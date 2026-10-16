ALTER TABLE users
    ADD COLUMN verified BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE email_verification_tokens (
    id UUID NOT NULL,
    user_id UUID NOT NULL,
    token_hash VARCHAR(64) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    used BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT email_verification_tokens_pkey PRIMARY KEY (id),
    CONSTRAINT email_verification_tokens_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT email_verification_tokens_token_hash_key UNIQUE (token_hash)
);
