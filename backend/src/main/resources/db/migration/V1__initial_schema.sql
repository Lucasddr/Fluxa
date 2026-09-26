CREATE EXTENSION IF NOT EXISTS pgcrypto;


CREATE TABLE users (
                       id UUID NOT NULL,
                       name VARCHAR(100) NOT NULL,
                       email VARCHAR(100) NOT NULL,
                       password_hash VARCHAR(255) NOT NULL,
                       created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
                       updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
                       role VARCHAR(20) DEFAULT USER,

                       CONSTRAINT users_pkey PRIMARY KEY (id),
                       CONSTRAINT users_email_key UNIQUE (email)
);


CREATE TABLE accounts (
                          id UUID NOT NULL,
                          user_id UUID NOT NULL,
                          name VARCHAR(100) NOT NULL,
                          start_balance NUMERIC(12,2) DEFAULT 0.00 NOT NULL,
                          current_balance NUMERIC(12,2) DEFAULT 0.00 NOT NULL,
                          currency VARCHAR(3) DEFAULT 'BRL' NOT NULL,
                          created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
                          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,

                          CONSTRAINT accounts_pkey PRIMARY KEY (id),
                          CONSTRAINT uq_accounts_user_name UNIQUE (user_id, name),

                          CONSTRAINT accounts_user_id_fkey
                              FOREIGN KEY (user_id)
                                  REFERENCES users(id)
                                  ON DELETE CASCADE
);


CREATE TABLE categories (
                            id UUID NOT NULL,
                            user_id UUID NOT NULL,
                            name VARCHAR(100) NOT NULL,
                            kind VARCHAR(10) NOT NULL,
                            created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
                            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
                            icon VARCHAR(255) NOT NULL,
                            color VARCHAR(255) NOT NULL,
                            description VARCHAR(255),
                            status BOOLEAN DEFAULT true NOT NULL,

                            CONSTRAINT categories_pkey PRIMARY KEY (id),
                            CONSTRAINT uq_categories_user_name UNIQUE (user_id, name),

                            CONSTRAINT chk_categories_kind
                                CHECK (
                                    kind IN ('INCOME', 'EXPENSE', 'BOTH')
                                    ),

                            CONSTRAINT categories_user_id_fkey
                                FOREIGN KEY (user_id)
                                    REFERENCES users(id)
                                    ON DELETE CASCADE
);


CREATE TABLE credit_purchases (
                                  id UUID NOT NULL,
                                  user_id UUID NOT NULL,
                                  account_id UUID NOT NULL,
                                  category_id UUID,
                                  title VARCHAR(120) NOT NULL,
                                  merchant VARCHAR(120),
                                  total_amount NUMERIC(12,2) NOT NULL,
                                  purchase_date DATE NOT NULL,
                                  installments_qty INTEGER NOT NULL,
                                  first_due_date DATE NOT NULL,
                                  notes VARCHAR(250),
                                  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
                                  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,

                                  CONSTRAINT credit_purchases_pkey PRIMARY KEY (id),

                                  CONSTRAINT credit_purchases_installments_qty_check
                                      CHECK (installments_qty >= 1),

                                  CONSTRAINT credit_purchases_total_amount_check
                                      CHECK (total_amount > 0),

                                  CONSTRAINT credit_purchases_account_id_fkey
                                      FOREIGN KEY (account_id)
                                          REFERENCES accounts(id)
                                          ON DELETE RESTRICT,

                                  CONSTRAINT credit_purchases_category_id_fkey
                                      FOREIGN KEY (category_id)
                                          REFERENCES categories(id)
                                          ON DELETE SET NULL,

                                  CONSTRAINT credit_purchases_user_id_fkey
                                      FOREIGN KEY (user_id)
                                          REFERENCES users(id)
                                          ON DELETE CASCADE
);


CREATE TABLE installments (
                              id UUID NOT NULL,
                              credit_purchase_id UUID NOT NULL,
                              account_id UUID NOT NULL,
                              number INTEGER NOT NULL,
                              due_date DATE NOT NULL,
                              amount NUMERIC(12,2) NOT NULL,
                              status VARCHAR(255) DEFAULT 'PENDING' NOT NULL,
                              created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
                              updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,

                              CONSTRAINT installments_pkey PRIMARY KEY (id),

                              CONSTRAINT uk_installments_purchase_number
                                  UNIQUE (credit_purchase_id, number),

                              CONSTRAINT uq_installments_cp_number
                                  UNIQUE (credit_purchase_id, number),

                              CONSTRAINT installments_amount_check
                                  CHECK (amount > 0),

                              CONSTRAINT installments_number_check
                                  CHECK (number >= 1),

                              CONSTRAINT installments_status_check
                                  CHECK (
                                      status IN ('PENDING', 'PAID', 'CANCELED')
                                      ),

                              CONSTRAINT installments_account_id_fkey
                                  FOREIGN KEY (account_id)
                                      REFERENCES accounts(id)
                                      ON DELETE CASCADE,

                              CONSTRAINT installments_credit_purchase_id_fkey
                                  FOREIGN KEY (credit_purchase_id)
                                      REFERENCES credit_purchases(id)
                                      ON DELETE CASCADE
);


CREATE TABLE transactions (
                              id UUID NOT NULL,
                              user_id UUID NOT NULL,
                              account_id UUID NOT NULL,
                              category_id UUID,
                              kind VARCHAR(10) NOT NULL,
                              amount NUMERIC(12,2) NOT NULL,
                              occurred_at DATE NOT NULL,
                              description VARCHAR(200),
                              installment_id UUID,
                              created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
                              updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
                              payment_method VARCHAR,
                              recurrent BOOLEAN DEFAULT false NOT NULL,
                              observation VARCHAR,
                              subtitle VARCHAR(255),

                              CONSTRAINT transactions_pkey PRIMARY KEY (id),

                              CONSTRAINT transactions_amount_check
                                  CHECK (amount > 0),

                              CONSTRAINT transactions_account_id_fkey
                                  FOREIGN KEY (account_id)
                                      REFERENCES accounts(id)
                                      ON DELETE RESTRICT,

                              CONSTRAINT transactions_category_id_fkey
                                  FOREIGN KEY (category_id)
                                      REFERENCES categories(id)
                                      ON DELETE SET NULL,

                              CONSTRAINT transactions_installment_fkey
                                  FOREIGN KEY (installment_id)
                                      REFERENCES installments(id)
                                      ON DELETE SET NULL,

                              CONSTRAINT transactions_user_id_fkey
                                  FOREIGN KEY (user_id)
                                      REFERENCES users(id)
                                      ON DELETE CASCADE
);


CREATE TABLE refresh_tokens (
                                id UUID NOT NULL,
                                created_at TIMESTAMP(6) WITH TIME ZONE NOT NULL,
                                expires_at TIMESTAMP(6) WITH TIME ZONE NOT NULL,
                                revoked BOOLEAN NOT NULL,
                                token_hash VARCHAR(255) NOT NULL,
                                user_id UUID NOT NULL,

                                CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id)
);


CREATE VIEW v_account_balance_from_transactions AS
SELECT
    a.id AS account_id,
    a.user_id,
    (
        a.start_balance
            + COALESCE(
                SUM(
                        CASE
                            WHEN t.kind = 'INCOME'
                                THEN t.amount
                            WHEN t.kind IN ('EXPENSE', 'ADJUSTMENT')
                                THEN -t.amount
                            ELSE 0
                            END
                ),
                0
              )
        ) AS balance_from_transactions
FROM accounts a
         LEFT JOIN transactions t
                   ON t.account_id = a.id
GROUP BY
    a.id,
    a.user_id,
    a.start_balance;


CREATE INDEX idx_users_email
    ON users (email);

CREATE INDEX idx_accounts_user_id
    ON accounts (user_id);

CREATE INDEX idx_categories_user_id
    ON categories (user_id);

CREATE INDEX idx_cp_account
    ON credit_purchases (account_id);

CREATE INDEX idx_cp_user_date
    ON credit_purchases (user_id, purchase_date DESC);

CREATE INDEX idx_inst_due_date
    ON installments (due_date);

CREATE INDEX idx_inst_status_due
    ON installments (status, due_date);

CREATE INDEX idx_tx_account_date
    ON transactions (account_id, occurred_at DESC);

CREATE INDEX idx_tx_category_date
    ON transactions (category_id, occurred_at DESC);

CREATE INDEX idx_tx_user_date
    ON transactions (user_id, occurred_at DESC);

