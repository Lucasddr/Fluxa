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
