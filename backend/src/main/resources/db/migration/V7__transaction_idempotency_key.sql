ALTER TABLE transactions
    ADD COLUMN idempotency_key VARCHAR(36);

CREATE UNIQUE INDEX uq_transactions_user_idempotency
    ON transactions (user_id, idempotency_key)
    WHERE idempotency_key IS NOT NULL;
