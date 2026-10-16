-- Grandfather accounts created before email verification was introduced.
-- A new registration creates its first verification token within seconds of
-- inserting the user. Older accounts may have a token added much later because
-- a resend was attempted after the verification rollout.
-- Safe to rerun: genuinely new accounts with a token near account creation remain unverified.
-- Run only after 20261016_email_verification_and_password_reset.sql.
BEGIN;

UPDATE users AS existing_user
SET email_verified = TRUE
WHERE existing_user.email_verified IS DISTINCT FROM TRUE
  AND NOT EXISTS (
    SELECT 1
    FROM email_verification_tokens AS verification_token
    WHERE verification_token.user_id = existing_user.id
      AND verification_token.created_at <= existing_user.created_at + INTERVAL '10 minutes'
  );

COMMIT;
