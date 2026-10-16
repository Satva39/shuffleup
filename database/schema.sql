CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(30) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    auth_version INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

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

-- Friend relationships and game invitations (also provided as an additive migration).
CREATE TABLE IF NOT EXISTS friend_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '14 days'),
    responded_at TIMESTAMPTZ,
    CHECK (sender_id <> receiver_id)
);
CREATE INDEX IF NOT EXISTS friend_requests_receiver_pending_idx ON friend_requests(receiver_id, created_at DESC) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS friend_requests_sender_pending_idx ON friend_requests(sender_id, created_at DESC) WHERE status = 'pending';
CREATE UNIQUE INDEX IF NOT EXISTS friend_requests_unique_pending_pair_idx ON friend_requests(LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id)) WHERE status = 'pending';

CREATE TABLE IF NOT EXISTS friendships (
    user_low UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_high UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_low, user_high),
    CHECK (user_low < user_high)
);
CREATE INDEX IF NOT EXISTS friendships_high_idx ON friendships(user_high);

CREATE TABLE IF NOT EXISTS game_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    game_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
    room_code VARCHAR(6),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
    responded_at TIMESTAMPTZ,
    CHECK (sender_id <> receiver_id)
);
CREATE INDEX IF NOT EXISTS game_challenges_receiver_pending_idx ON game_challenges(receiver_id, created_at DESC) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS game_challenges_sender_pending_idx ON game_challenges(sender_id, created_at DESC) WHERE status = 'pending';
