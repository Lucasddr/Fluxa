# Architecture Decision Records — Fluxa

## ADR-001: Saldo calculado por query, sem coluna sincronizada (2026-10-16)

Status: aceito.

### Contexto
O MVP define `saldo disponível = receitas - saídas - compromissos futuros`.
A V1 criou `accounts.current_balance` / `start_balance` + view materializada;
a V3 removeu as colunas e a view.

### Decisão
Fonte oficial do saldo: agregações ao vivo sobre `transactions`
(`getTotalIncome`, `getTotalExpense`) + parcelas PENDING (`getTotalPayableAccounts`).
Nenhum código referencia saldo materializado (verificado em 2026-10-16).

### Regras
1. Nunca descontar duas vezes despesa já refletida no saldo atual.
2. Não tratar receita futura como dinheiro recebido.
3. Transações consideradas: realizadas + parcelas PENDING + receitas confirmadas.

### Consequências
- Leitura sempre consistente, sem job de sincronização.
- Custo por leitura aceitável no volume atual (dashboard 17-113ms medidos em 2026-10-16).
- Se medição futura provar necessidade: índice → projeção → agregação → cache, nessa ordem.
  Índice `idx_tx_user_kind_date` (V6) já cobre o caminho quente.

## ADR-002: Seleção de conta padrão em operações (2026-10-19)

Status: aceito para a feature `feat/account-management`.

### Contexto
O domínio agora permite várias contas bancárias por usuário. Transações e compras parceladas precisam ser atribuídas a uma conta, mantendo compatibilidade com clientes que ainda não enviam `accountId`.

### Decisão
- Cada usuário mantém exatamente uma conta padrão, garantida pela migration V9 e protegida por índice único parcial.
- Novas transações e compras parceladas podem indicar uma conta pertencente ao usuário. Se o `accountId` não vier, o backend usa a conta padrão.
- O dashboard continua agregando todas as contas (BRL) e identifica o agregado como "Todas as contas".
- Não excluir a última conta nem uma conta que tenha transações ou compras parceladas. Ao excluir uma conta padrão vazia, promover outra conta dentro da mesma transação.

### Consequências
- `AccountController`/`AccountService` fornecem CRUD, leitura e troca da conta padrão com ownership no backend.
- A migration V9 adiciona `accounts.is_default`, migra os registros existentes para um padrão por usuário e cria o índice parcial.
- As listagens e detalhes de transações passam a expor o nome da conta para tornar a multi-conta visível no histórico.

## ADR-003: Observações de saldo, revisão explícita e projeção separada (2026-10-19)

Status: aceito.

### Contexto
O histórico inicial pode estar incompleto, então a soma das transações não prova o valor real disponível no banco. A interface precisa registrar o saldo informado, comparar os dados e deixar a decisão final com o usuário.

### Decisão
- Persistir cada observação em `account_balance_observations` com valor, `balance_as_of`, `recorded_at`, origem, saldo do ledger usado na conferência, status e data de revisão. Essa tabela armazena observações/reconciliações, não um cache derivado de saldo.
- A primeira etapa importa extratos de contas bancárias; faturas de cartão ficam para depois. O usuário também pode informar saldo manualmente, sempre guardando o valor, a data efetiva e o instante de registro.
- Uma diferença cria estado `PENDING_REVIEW`; não gerar transação de ajuste automaticamente.
- Enquanto estiver pendente, operações usam como padrão a última base resolvida mais transações registradas depois dela; sem base resolvida, usam a soma do ledger. A UI avisa que o histórico pode estar incompleto.
- O usuário pode aceitar o valor observado como base operacional ou escolher manter as transações registradas como base. Essa escolha não converte diferença em receita/despesa e não altera relatórios históricos.
- Mudança em transação retroativa que afete uma observação resolvida a reabre para revisão. Uma transação registrada no mesmo dia depois da observação entra na movimentação posterior usando `created_at`.
- O período histórico (`start`/`end`) só controla receitas/despesas observadas. A projeção de compromissos tem seletor separado de 7, 30 e 90 dias.
- `Saldo disponível = saldo operacional atual - parcelas PENDING/OVERDUE com vencimento até o fim da janela`. Receitas futuras não são tratadas como saldo atual.

### Consequências
- Migration V10 cria observações de saldo, índices e restrições de estado sem alterar migrations aplicadas.
- O dashboard expõe saldo calculado, saldo disponível, confiança/conferência e horizonte de projeção.
- O histórico de transações continua sendo a base dos relatórios de entradas e saídas.

## ADR-004: Importação de extrato com prévia e deduplicação por origem (2026-10-19)

Status: aceito.

### Contexto
Extratos bancários têm formatos diferentes e podem conter movimentações que já foram lançadas manualmente ou importadas antes. A importação precisa preservar a escolha do usuário sem duplicar valores silenciosamente.

### Decisão
- Aceitar CSV e OFX para contas bancárias. Arquivos são processados em memória, com limite de 5 MB e 5.000 movimentações; nenhum extrato é enviado a um serviço externo.
- Interpretar linhas com uma prévia antes da gravação. O usuário pode selecionar, corrigir data/valor/descrição e atribuir uma categoria por movimentação.
- Determinar receita/despesa pelo sinal do valor e validar que a categoria pertence ao usuário e ao tipo correspondente. Método de pagamento importado fica como `OTHER` quando a origem não o informa.
- Deduplicar por `source_reference` persistida por conta; OFX usa `FITID` quando disponível, CSV usa impressão digital dos campos normalizados com ocorrência para linhas iguais.
- O usuário pode salvar uma regra por conta a partir de uma classificação confirmada. Regras normalizam acentos/caixa, pontuação e números; sugestões só preenchem a prévia e nunca importam sem confirmação.
- Não assumir um saldo final de CSV, pois esse campo não é padronizado. O usuário pode conferir o saldo depois da importação usando a observação de saldo existente.

### Consequências
- Migration V11 cria `imported_statement_entries` ligada à conta e à transação criada; V12 armazena regras de categoria determinísticas com escopo por conta.
- A importação atualiza as transações registradas e pode reabrir observações de saldo afetadas para revisão; não cria lançamentos de ajuste.
