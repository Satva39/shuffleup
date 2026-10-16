# ShuffleUp Email Verification and Password Reset Setup

The backend now uses EmailJS for verification/reset messages. It does **not** use SMTP. EmailJS sending follows the official REST API endpoint and parameters documented at <https://www.emailjs.com/docs/rest-api/send/>. EmailJS currently documents a one-request-per-second send limit, so this implementation queues sends serially within each backend process. If you deploy multiple backend instances, add a shared/global queue or rate limiter.

## 1. Configure EmailJS

In the EmailJS dashboard, connect the email service you want to send from, then create two templates:

**Verification template**

- Template ID → `EMAILJS_VERIFICATION_TEMPLATE_ID`
- To email field: `{{to_email}}`
- Recipient/display name as appropriate: `{{to_name}}`
- Link in the message: `{{verification_url}}`
- Expiry note: `{{expires_minutes}}` minutes
- App name if useful: `{{app_name}}`

**Password reset template**

- Template ID → `EMAILJS_PASSWORD_RESET_TEMPLATE_ID`
- To email field: `{{to_email}}`
- Recipient/display name as appropriate: `{{to_name}}`
- Link in the message: `{{password_reset_url}}`
- Expiry note: `{{expires_minutes}}` minutes
- App name if useful: `{{app_name}}`

The EmailJS account must permit server-side/non-browser API requests. Keep the private key in the backend's secret environment, never in Vite `VITE_*` variables or the APK.

Set these backend environment variables:

```env
EMAILJS_SERVICE_ID=service_xxxxxxx
EMAILJS_PUBLIC_KEY=your_public_key
EMAILJS_PRIVATE_KEY=your_private_key
EMAILJS_VERIFICATION_TEMPLATE_ID=template_verification
EMAILJS_PASSWORD_RESET_TEMPLATE_ID=template_password_reset
PUBLIC_APP_URL=https://shuffleup-five.vercel.app
```

Use the real deployed website URL for `PUBLIC_APP_URL` and HTTPS in production. `FRONTEND_URL` remains the website origin permitted by the backend's CORS policy. Do not copy the placeholders as working credentials.

## 2. Apply the database migrations

Back up the database first. On the existing PostgreSQL/Neon database, run both migrations in this order:

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/20261016_email_verification_and_password_reset.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/20261016_legacy_accounts_verified.sql
```

Or execute each file in your database console in the same order. The second migration grandfathers existing accounts that have no verification-token record, including accounts which were accidentally left with `email_verified = FALSE` by an earlier partial rollout. Accounts that already have a verification token remain subject to verification and can request a resend. New registrations explicitly create `email_verified = FALSE`. Token values themselves are not stored in the database; only token hashes, expiry timestamps, and one-use state are stored.

For a brand-new database, `database/schema.sql` includes the new columns and tables.

## 3. Deploy and verify

1. Set backend environment variables in the hosting dashboard. Do not commit `.env` files.
2. Apply the migration before deploying the new backend code.
3. Deploy the backend, then deploy the Vite frontend.
4. Try a new registration using an inbox you control. It should not automatically sign in.
5. Open the EmailJS verification link; it should report success, and login should then work.
6. Request a password reset. The email link should open `/reset-password`; the link expires after 30 minutes and is single-use.
7. After a password reset, the backend increments `auth_version`; previous API/socket sessions are rejected and must sign in again.
8. Check the EmailJS dashboard for delivery errors. This source package cannot verify your provider account or deliver a real email without your configuration.

The link opens the website in a mobile browser. After verification/reset, the user can return to the Android app and sign in with the updated account.

## Security notes

- Verification and reset tokens are random, single-use, expire after 30 minutes, and are stored as hashes.
- Password verification/reset and protected API/socket access are checked on the server.
- Password reset requests use a generic response to avoid exposing whether an account exists.
- Per-account email requests are capped at three in a rolling 15-minute window; route-level limits also apply. The route-level limiter is in-process, so multi-instance deployments should use shared rate limiting.
- If the deployment uses a reverse proxy, configure `TRUST_PROXY_HOPS` only to the number of trusted proxy hops. Do not blindly trust client-provided forwarded headers.
