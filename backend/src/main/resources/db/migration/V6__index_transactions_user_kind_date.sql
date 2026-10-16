CREATE INDEX idx_tx_user_kind_date
    ON transactions (user_id, kind, occurred_at DESC);
