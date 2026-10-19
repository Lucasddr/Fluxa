CREATE TABLE imported_statement_entries (
    id UUID NOT NULL,
    user_id UUID NOT NULL,
    account_id UUID NOT NULL,
    transaction_id UUID NOT NULL,
    source_reference VARCHAR(128) NOT NULL,
    imported_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

    CONSTRAINT imported_statement_entries_pkey PRIMARY KEY (id),
    CONSTRAINT imported_statement_entries_user_fkey
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT imported_statement_entries_account_fkey
        FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT,
    CONSTRAINT imported_statement_entries_transaction_fkey
        FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
    CONSTRAINT uq_imported_statement_account_reference UNIQUE (account_id, source_reference),
    CONSTRAINT imported_statement_entries_transaction_unique UNIQUE (transaction_id)
);

CREATE INDEX idx_imported_statement_user_account
    ON imported_statement_entries (user_id, account_id, imported_at DESC);
