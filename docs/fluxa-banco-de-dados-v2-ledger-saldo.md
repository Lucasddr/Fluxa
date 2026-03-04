# Fluxa — Banco de Dados (V2: Ledger + Saldo Materializado)

## 1. Objetivo desta revisão

Você levantou um ponto correto: **recalcular saldo sempre via `SUM(transactions)` pode ficar caro** conforme o sistema cresce.

Esta revisão adota o padrão recomendado para produtos financeiros:

- **Ledger (fonte da verdade):** `transactions`
- **Saldo materializado (leitura rápida):** `accounts.current_balance`

Regra de ouro: `current_balance` é **derivado** do ledger. Se algo sair do lugar, dá para **reconciliar/recalcular**.

Banco: PostgreSQL

---

## 2. Entidades

### 2.1 `users`
Usuário do sistema.

| Campo | Tipo | Restrições / Observações |
|---|---|---|
| id | UUID | PK |
| name | VARCHAR | opcional |
| email | VARCHAR | UNIQUE |
| password_hash | VARCHAR | nullable no futuro (OAuth) |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

---

### 2.2 `accounts`
Onde o dinheiro está (conta, carteira, etc.).

**Mudança principal:** adicionamos saldo materializado.

| Campo | Tipo | Restrições / Observações |
|---|---|---|
| id | BIGINT | PK |
| user_id | UUID | FK → users.id |
| name | VARCHAR | |
| type | VARCHAR | ex.: CHECKING / WALLET / SAVINGS / (futuro: CREDIT_CARD) |
| opening_balance | NUMERIC(12,2) | DEFAULT 0 |
| current_balance | NUMERIC(12,2) | DEFAULT 0 (**saldo materializado**) |
| balance_updated_at | TIMESTAMP | última atualização do `current_balance` |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

**Semântica:**
- `opening_balance`: saldo inicial (se você quiser importar um saldo existente ao criar a conta)
- `current_balance`: saldo atual “rápido” para Home e consultas frequentes
- `balance_updated_at`: ajuda a debug e reconciliação

---

### 2.3 `categories`
Categorias para organização e filtros.

| Campo | Tipo | Restrições / Observações |
|---|---|---|
| id | BIGINT | PK |
| user_id | UUID | FK → users.id |
| name | VARCHAR | |
| type | VARCHAR | INCOME / EXPENSE / BOTH |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

---

### 2.4 `transactions` (LEDGER)
Movimentações reais (fonte da verdade).

| Campo | Tipo | Restrições / Observações |
|---|---|---|
| id | BIGINT | PK |
| user_id | UUID | FK → users.id |
| account_id | BIGINT | FK → accounts.id |
| category_id | BIGINT | FK → categories.id (nullable) |
| type | VARCHAR | INCOME / EXPENSE |
| amount | NUMERIC(12,2) | sempre positivo; `type` define o sinal |
| description | VARCHAR | |
| occurred_at | TIMESTAMP | data real do evento |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

---

### 2.5 `credit_purchases`
Evento “comprei parcelado no crédito”.

| Campo | Tipo | Restrições / Observações |
|---|---|---|
| id | BIGINT | PK |
| user_id | UUID | FK → users.id |
| account_id | BIGINT | FK → accounts.id (conta/cartão de referência) |
| description | VARCHAR | |
| total_amount | NUMERIC(12,2) | |
| installments | INTEGER | número de parcelas |
| first_due_date | DATE | início da cobrança |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

---

### 2.6 `installments`
**Obrigações futuras** geradas a partir de `credit_purchases`.

| Campo | Tipo | Restrições / Observações |
|---|---|---|
| id | BIGINT | PK |
| credit_purchase_id | BIGINT | FK → credit_purchases.id |
| user_id | UUID | FK → users.id |
| installment_number | INTEGER | 1..N |
| due_date | DATE | vencimento |
| amount | NUMERIC(12,2) | |
| status | VARCHAR | OPEN / PAID / CANCELED |
| paid_transaction_id | BIGINT | FK → transactions.id (nullable) |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

---

## 3. Relacionamentos

- `users (1) → (N) accounts`
- `users (1) → (N) categories`
- `users (1) → (N) transactions`
- `users (1) → (N) credit_purchases`
- `credit_purchases (1) → (N) installments`
- `accounts (1) → (N) transactions`
- `accounts (1) → (N) credit_purchases`
- `transactions (0/1) → (0/1) installments` via `installments.paid_transaction_id` (quando uma parcela é marcada como paga)

---

## 4. Regras de consistência (Ledger + Materializado)

### 4.1 Atualização do saldo materializado
Sempre que uma transação é criada:

1. Inserir em `transactions` (ledger)
2. Atualizar `accounts.current_balance` (materializado)
3. Atualizar `accounts.balance_updated_at`

**Tudo dentro da mesma transação do banco** (ACID). No Spring: `@Transactional`.

**Delta do saldo:**
- `INCOME`: `+ amount`
- `EXPENSE`: `- amount`

### 4.2 Recalcular (reconciliação)
A qualquer momento, você pode recalcular:

`expected_balance = opening_balance + SUM(INCOME) - SUM(EXPENSE)`

E comparar com `current_balance` para detectar drift.

> Essa capacidade é o que te salva se algum bug ou concorrência causar divergência.

---

## 5. Cálculos financeiros do produto

### 5.1 Saldo Real (agora)
- Preferencialmente: `accounts.current_balance` (rápido)
- Auditoria/reconciliação: via `transactions`

### 5.2 Saldo Comprometido
- `SUM(installments.amount)` onde `status = 'OPEN'`
- Com janela (ex.: mês atual / próximos 90 dias / total futuro) definida pelo produto

### 5.3 Saldo Disponível
`Saldo Disponível = Saldo Real − Saldo Comprometido (na janela escolhida)`

---

## 6. Índices recomendados

- `transactions (user_id, occurred_at DESC)`
- `transactions (account_id, occurred_at DESC)`
- `installments (user_id, due_date, status)`
- `credit_purchases (user_id, created_at DESC)`
- `accounts (user_id, name)`
- `categories (user_id, name)`

---

Fim do documento.
