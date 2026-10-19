ALTER TABLE accounts
    ADD COLUMN is_default BOOLEAN NOT NULL DEFAULT FALSE;

WITH ranked_accounts AS (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at, id) AS row_number
    FROM accounts
)
UPDATE accounts a
SET is_default = TRUE
FROM ranked_accounts r
WHERE a.id = r.id
  AND r.row_number = 1;

ALTER TABLE accounts
    ALTER COLUMN is_default DROP DEFAULT;

CREATE UNIQUE INDEX uq_accounts_one_default_per_user
    ON accounts (user_id)
    WHERE is_default = TRUE;
