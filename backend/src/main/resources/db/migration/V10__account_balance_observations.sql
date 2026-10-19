CREATE TABLE account_balance_observations (
    id UUID NOT NULL,
    user_id UUID NOT NULL,
    account_id UUID NOT NULL,
    observed_balance NUMERIC(12, 2) NOT NULL,
    ledger_balance NUMERIC(12, 2) NOT NULL,
    balance_as_of DATE NOT NULL,
    source VARCHAR(20) NOT NULL,
    status VARCHAR(32) NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    reviewed_at TIMESTAMP WITH TIME ZONE,

    CONSTRAINT account_balance_observations_pkey PRIMARY KEY (id),
    CONSTRAINT account_balance_observations_user_fkey
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT account_balance_observations_account_fkey
        FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT,
    CONSTRAINT account_balance_observations_source_check
        CHECK (source IN ('MANUAL', 'STATEMENT')),
    CONSTRAINT account_balance_observations_status_check
        CHECK (status IN ('PENDING_REVIEW', 'RECONCILED', 'OBSERVED_ACCEPTED', 'LEDGER_ACCEPTED'))
);

CREATE INDEX idx_balance_observations_account_date
    ON account_balance_observations (account_id, balance_as_of DESC, recorded_at DESC);

CREATE INDEX idx_balance_observations_user_recorded
    ON account_balance_observations (user_id, recorded_at DESC);
