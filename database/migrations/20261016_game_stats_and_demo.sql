CREATE TABLE IF NOT EXISTS game_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code VARCHAR(6) NOT NULL,
  room_created_at BIGINT NOT NULL,
  game_id TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'multiplayer',
  result_event VARCHAR(100) NOT NULL,
  result_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  winner_ids TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (room_code, room_created_at)
);
CREATE INDEX IF NOT EXISTS game_matches_game_completed_idx ON game_matches(game_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS game_matches_completed_idx ON game_matches(completed_at DESC);

CREATE TABLE IF NOT EXISTS game_match_players (
  id BIGSERIAL PRIMARY KEY,
  match_id UUID NOT NULL REFERENCES game_matches(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  player_ref VARCHAR(120) NOT NULL,
  username VARCHAR(30) NOT NULL,
  is_bot BOOLEAN NOT NULL DEFAULT FALSE,
  outcome TEXT NOT NULL DEFAULT 'unknown' CHECK (outcome IN ('win', 'loss', 'unknown')),
  score NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (match_id, player_ref)
);
CREATE INDEX IF NOT EXISTS game_match_players_user_match_idx ON game_match_players(user_id, match_id DESC) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS game_match_players_user_game_outcome_idx ON game_match_players(user_id, outcome) WHERE user_id IS NOT NULL;
