-- Additive migration for ShuffleUp friend requests, friendships and challenges.
-- Run against a backed-up staging database before production rollout.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

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
CREATE INDEX IF NOT EXISTS friend_requests_receiver_pending_idx
    ON friend_requests(receiver_id, created_at DESC) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS friend_requests_sender_pending_idx
    ON friend_requests(sender_id, created_at DESC) WHERE status = 'pending';
CREATE UNIQUE INDEX IF NOT EXISTS friend_requests_unique_pending_pair_idx
    ON friend_requests(LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id))
    WHERE status = 'pending';

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
CREATE INDEX IF NOT EXISTS game_challenges_receiver_pending_idx
    ON game_challenges(receiver_id, created_at DESC) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS game_challenges_sender_pending_idx
    ON game_challenges(sender_id, created_at DESC) WHERE status = 'pending';
