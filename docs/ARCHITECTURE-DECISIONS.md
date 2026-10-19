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
