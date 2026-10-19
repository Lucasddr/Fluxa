CREATE TABLE statement_import_category_rules (
    id UUID NOT NULL,
    user_id UUID NOT NULL,
    account_id UUID NOT NULL,
    category_id UUID NOT NULL,
    normalized_description VARCHAR(200) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

    CONSTRAINT statement_import_category_rules_pkey PRIMARY KEY (id),
    CONSTRAINT statement_import_category_rules_user_fkey
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT statement_import_category_rules_account_fkey
        FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    CONSTRAINT statement_import_category_rules_category_fkey
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    CONSTRAINT uq_statement_category_rule_account_description
        UNIQUE (account_id, normalized_description)
);

CREATE INDEX idx_statement_category_rules_user_account
    ON statement_import_category_rules (user_id, account_id);
