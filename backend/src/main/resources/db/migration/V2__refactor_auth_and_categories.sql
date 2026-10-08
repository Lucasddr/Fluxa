ALTER TABLE users
    ALTER COLUMN role SET DEFAULT 'USER';

ALTER TABLE users
    ADD CONSTRAINT chk_users_role
        CHECK (role IN ('USER', 'ADMIN'));

ALTER TABLE categories
    DROP CONSTRAINT chk_categories_kind;

ALTER TABLE categories
    ADD CONSTRAINT chk_categories_kind
        CHECK (kind IN ('INCOME', 'EXPENSE'));

ALTER TABLE refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_fkey
          FOREIGN KEY (user_id)
              REFERENCES users(id);