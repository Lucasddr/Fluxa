DROP VIEW IF EXISTS v_account_balance_from_transactions;

ALTER TABLE accounts
    DROP COLUMN start_balance,
    DROP COLUMN current_balance;