-- Backward-compatible authentication additions for ShuffleUp.
-- Existing accounts are preserved and treated as verified because they were
-- created before verification was available. New registrations explicitly set
-- email_verified = FALSE in the backend.

ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN;
UPDATE users SET email_verified = TRUE WHERE email_verified IS NULL;
ALTER TABLE users ALTER COLUMN email_verified SET DEFAULT FALSE;
ALTER TABLE users ALTER COLUMN email_verified SET NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_version INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash CHAR(64) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS email_verification_tokens_user_created_idx
    ON email_verification_tokens(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS email_verification_tokens_expiry_idx
    ON email_verification_tokens(expires_at);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash CHAR(64) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS password_reset_tokens_user_created_idx
    ON password_reset_tokens(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS password_reset_tokens_expiry_idx
    ON password_reset_tokens(expires_at);
