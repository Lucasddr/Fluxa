# Fluxa --- Modelagem do Banco de Dados

## 1. Visão Geral

Este documento descreve a modelagem do banco de dados do Fluxa.

O objetivo principal desta modelagem é permitir:

-   Controle correto do saldo real
-   Controle correto do saldo comprometido
-   Representação de obrigações futuras
-   Rastreabilidade completa das operações

O banco foi projetado para suportar o MVP e permitir evolução futura sem
refatorações destrutivas.

Banco de dados: PostgreSQL

------------------------------------------------------------------------

# 2. Entidades

------------------------------------------------------------------------

# 2.1 users

Representa o usuário do sistema.

## Objetivo

Identificar e autenticar o usuário.

## Campos

  Campo           Tipo               Descrição
  --------------- ------------------ ---------------------
  id              UUID (PK)          Identificador único
  name            VARCHAR            Nome do usuário
  email           VARCHAR (UNIQUE)   Email
  password_hash   VARCHAR            Hash da senha
  created_at      TIMESTAMP          Data de criação
  updated_at      TIMESTAMP          Data de atualização

------------------------------------------------------------------------

# 2.2 accounts

Representa onde o dinheiro está armazenado.

Exemplo:

-   Conta bancária
-   Carteira
-   Conta digital

## Objetivo

Permitir cálculo correto do saldo real.

## Campos

  Campo        Tipo              Descrição
  ------------ ----------------- -----------
  id           BIGINT (PK)       
  user_id      UUID (FK users)   
  name         VARCHAR           
  type         VARCHAR           
  created_at   TIMESTAMP         

------------------------------------------------------------------------

# 2.3 categories

Representa a categoria da transação.

Exemplo:

-   Alimentação
-   Salário
-   Transporte

## Objetivo

Organização e análise financeira.

## Campos

  Campo        Tipo
  ------------ -------------
  id           BIGINT (PK)
  user_id      UUID
  name         VARCHAR
  type         VARCHAR
  created_at   TIMESTAMP

------------------------------------------------------------------------

# 2.4 transactions

Representa movimentações reais.

Exemplo:

-   Receita
-   Despesa

## Objetivo

Calcular saldo real.

## Campos

  Campo         Tipo
  ------------- -------------
  id            BIGINT (PK)
  user_id       UUID
  account_id    BIGINT
  category_id   BIGINT
  type          VARCHAR
  amount        NUMERIC
  description   VARCHAR
  occurred_at   TIMESTAMP
  created_at    TIMESTAMP

------------------------------------------------------------------------

# 2.5 credit_purchases

Representa uma compra parcelada.

Exemplo:

Notebook em 6x

## Objetivo

Representar o evento original.

## Campos

  Campo            Tipo
  ---------------- -------------
  id               BIGINT (PK)
  user_id          UUID
  account_id       BIGINT
  description      VARCHAR
  total_amount     NUMERIC
  installments     INTEGER
  first_due_date   DATE
  created_at       TIMESTAMP

------------------------------------------------------------------------

# 2.6 installments

Representa cada parcela individual.

Esta é a tabela mais importante do sistema.

## Objetivo

Representar obrigações futuras.

Permitir:

-   Cálculo do saldo comprometido
-   Controle de pagamento
-   Projeção financeira

## Campos

  Campo                 Tipo
  --------------------- -------------
  id                    BIGINT (PK)
  credit_purchase_id    BIGINT
  user_id               UUID
  installment_number    INTEGER
  due_date              DATE
  amount                NUMERIC
  status                VARCHAR
  paid_transaction_id   BIGINT

------------------------------------------------------------------------

# 3. Relacionamentos

users

1 → N accounts

1 → N transactions

1 → N credit_purchases

1 → N installments

------------------------------------------------------------------------

accounts

1 → N transactions

1 → N credit_purchases

------------------------------------------------------------------------

credit_purchases

1 → N installments

------------------------------------------------------------------------

transactions

1 → 1 installments (quando pago)

------------------------------------------------------------------------

# 4. Lógica Financeira

------------------------------------------------------------------------

# Saldo Real

Calculado com base em:

transactions

------------------------------------------------------------------------

# Saldo Comprometido

Calculado com base em:

installments

WHERE status = OPEN

------------------------------------------------------------------------

# Saldo Disponível

Saldo Real - Saldo Comprometido

------------------------------------------------------------------------

# 5. Fluxo de Compra Parcelada

Usuário registra compra

Sistema cria:

credit_purchase

Sistema cria:

N installments

------------------------------------------------------------------------

Quando paga:

Cria transaction

Atualiza installment

------------------------------------------------------------------------

# 6. Vantagem desta Modelagem

Permite:

Controle financeiro real

Projeção futura

Simulação

Escalabilidade

------------------------------------------------------------------------

Fim do Documento
