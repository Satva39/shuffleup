# ShuffleUp — Consolidated Patch and Follow-up Audit

**Date:** 16 October 2026  
**Source:** Original `card-game-platform(1).zip` with the prior ShuffleUp changed-file patches merged, plus the latest home/demo, login compatibility, email-readiness, legacy-account, and Expo-config fixes.  
**Release status:** Partial source integration. Do not consider production readiness proven until the database migrations, live EmailJS delivery, builds, and live web/Android flows pass.

## Latest reported issues addressed in source

### Demo button visible and does not hang indefinitely

- The homepage demo button now uses a high-contrast accent background and white text, has a visible focus state, and wraps instead of overflowing on narrow screens.
- Homepage vertical spacing is reduced so the next section is not pushed unnecessarily far below the hero.
- Demo creation uses the shared API base URL and a 12-second timeout, then shows a visible error instead of leaving the control in a prolonged loading state.
- Authenticated-session loading is bounded for `/api/auth/me`; the demo CTA remains present while the app checks whether a saved session exists.

### Production API resolution and saved-session reliability

- Added `frontend/src/services/apiBase.js`. It uses `VITE_API_URL` when configured, `http://localhost:5000` only for development, and the known ShuffleUp Render API as a production fallback.
- The frontend auth, home, socket, bot setup, stats and social API calls now use that shared resolver.
- Session validation has a 10-second timeout. A network or 5xx issue no longer automatically deletes a saved client session; explicit 401/403/404 responses still clear it.

### Existing registered accounts and login error

- Added `database/migrations/20261016_legacy_accounts_verified.sql`. It marks a legacy account as verified when its first verification token was not created within 10 minutes of the user's creation time. New signups create the token immediately and stay unverified; old users who clicked resend after the rollout can still be grandfathered in.
- Login/registration now return an actionable 503 message if required auth columns/tables are missing. The auth middleware treats a database/schema failure as a service failure rather than incorrectly declaring the user's token invalid.
- **The migration must be applied to the deployed PostgreSQL/Neon database.** A source patch alone cannot repair a remote database schema. Password checks are not bypassed.

### Email delivery diagnosis

- Added `GET /api/health/ready`, which exposes boolean checks only (no secret values): database connectivity, auth schema readiness, and whether the required EmailJS configuration variables are present.
- EmailJS server logs now give a sanitized hint to check service ID, template ID, recipient field, template variable names and backend private key without logging EmailJS response bodies or secret values.
- A `true` EmailJS configuration flag confirms only that environment variables are present; it does **not** prove that EmailJS accepted the template or delivered the message. Use EmailJS Email History and Render backend logs for send attempts.
- The backend expects the verification template's To Email to use `{{to_email}}` and its link to use `{{verification_url}}`; password reset uses `{{to_email}}` and `{{password_reset_url}}`.

### Expo Doctor configuration

- Removed `newArchEnabled` from `mobile/app.json` because the installed Expo Doctor reported it as an unsupported schema property for this project.
- The two missing direct peer dependencies and Expo patch mismatch must be resolved with Expo's version-aware installer in the user's mobile project; avoid manually editing `package-lock.json` versions:

```powershell
cd E:\card-game-platform\mobile
npx expo install --fix
npx expo install expo-font expo-asset
npx expo-doctor
```

- After the checks pass, run a fresh `npm ci`, check Expo Doctor again, and make a new EAS Android build. The project owner reported 25 npm audit findings (7 moderate, 17 high, 1 critical); do not run `npm audit fix --force` blindly because it can introduce incompatible native package versions.

## Previously integrated feature areas retained

The consolidated patch continues to include the previous implementation of: selected-game bot navigation and clearer player-count labels; EmailJS registration verification and password reset; password-strength validation and show/hide controls; the 120-second server-issued demo-session foundation; bot personas and fallback dialogue with an optional OpenAI-compatible adapter; disclosed, deliberately advantaged War Challenge mode; disconnect grace-period bot takeover; server-recorded match statistics; room recovery/invitations; friends/challenges; live counts/metrics; targeted mobile scroll changes; and event-driven web/mobile card effects/audio.

These are **source implementations**, not claims that every feature has passed end-to-end production/device tests. LLM remains optional; `BOT_LLM_ENABLED=false` is supported.

## Checks run for this follow-up

| Check | Result | Notes |
|---|---|---|
| `node --check` on all backend `src/**/*.js` | **PASS** | All backend JavaScript source files passed syntax checking. |
| Frontend/mobile JS/JSX parse | **PASS** | 441 files parsed through the globally available TypeScript parser with zero syntax errors. This is not a production build. |
| `mobile/app.json` JSON parse | **PASS** | Valid JSON; unsupported `newArchEnabled` key removed. |
| `backend/src/utils/emailJs.test.js` | **PASS** | EmailJS config, request payload, and provider-error behavior. |
| `backend/src/utils/authSecurity.test.js` | **PASS** | Auth token/password helper tests. |
| `backend/src/utils/requestMetrics.test.js` | **PASS** | Request metrics helper tests. |
| `backend/src/bots/botDialogue.test.js` | **PASS** | Persona fallback, OpenAI-compatible adapter and provider-failure fallback. |
| `backend/src/sockets/roomManager.test.js` | **PASS** | Room reconnect/live-count tests and bot persona selection test. |
| Stats/bot-manager tests needing `pg` | **BLOCKED IN THIS WORKSPACE** | Node modules were excluded from this changed-file workspace, so importing `backend/src/config/database.js` failed because the `pg` package was unavailable. Run the full test suite from a clean project installation. |
| Full backend `npm run test:all` | **NOT RUN HERE** | Needs the backend's installed dependencies; selected dependency-free tests and all backend syntax checks ran. |
| Website production build | **NOT VERIFIED** | The earlier reported Linux Rollup optional-dependency issue requires a clean frontend dependency install and production build. |
| Production API / real EmailJS delivery | **NOT TESTED** | Outbound DNS access and actual provider configuration were unavailable in this session. No real email send is claimed. |
| PostgreSQL migrations / old-account login | **NOT TESTED LIVE** | Apply migrations to staging, then open the readiness endpoint and test a legacy account. |
| Expo Doctor / EAS / physical Android | **NOT RUN HERE** | Run the commands above in the user's mobile project; physical-device and EAS verification remain required. |

## Required deployment order

1. **Rotate the EmailJS private key** because it was visible in a prior screenshot. Update only the backend environment variable; do not share the replacement key.
2. Back up a staging database and apply these migration files from the project root in order:

```powershell
psql "$env:DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/20261016_email_verification_and_password_reset.sql
psql "$env:DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/20261016_legacy_accounts_verified.sql
psql "$env:DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/20261016_game_stats_and_demo.sql
psql "$env:DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/20261016_social_features.sql
```

3. Deploy the backend code and set `EMAILJS_SERVICE_ID`, `EMAILJS_PUBLIC_KEY`, the rotated `EMAILJS_PRIVATE_KEY`, both real template IDs, `PUBLIC_APP_URL`, `FRONTEND_URL`, `JWT_SECRET`, and `DATABASE_URL` in the backend host settings.
4. Open `https://shuffleup-backend.onrender.com/api/health/ready` (substitute the actual backend host if it differs). Expect `database: true`, `authSchema: true`, and both EmailJS configured flags to be true. A false config flag means one or more required backend environment values is missing. A true flag is not a delivery guarantee.
5. Test a legacy account and a fresh registration with an inbox you control. Existing account login must still validate the supplied password. Newly registered accounts must verify through their one-time link. Inspect EmailJS Email History and Render backend logs if delivery fails.
6. Deploy the frontend after confirming `VITE_API_URL` points to the deployed backend. Run frontend production build checks locally first.
7. Repair the Expo dependencies using the commands above, then produce a new EAS Android build and test demo, login, email-link navigation, audio, scrolling, and reconnect on an actual device.
8. Do not deploy to production until the above staging checks pass.

## Remaining limitations

- This patch does not have access to the user's Render, Vercel, EmailJS, EAS or PostgreSQL accounts and has not changed remote settings or databases.
- The exact cause of the live login error cannot be proven from the screenshot alone. The missing-column/table failure path is now reported explicitly; `/api/health/ready` will distinguish DB/auth-schema readiness from missing EmailJS variables after the new backend is deployed.
- A configured EmailJS account can still reject a template or fail delivery; template values and provider logs must be checked.
- Multi-instance room/session/takeover state remains process-local in this implementation; production horizontal scaling needs shared state.
- Bot correctness, takeover/rejoin, rule parity, match result extraction, styling, and native audio must still be exercised in live web/mobile matches. The War Challenge mode is an intentionally unfair, disclosed variant, not a claim of a universal unbeatable bot.

## Patch packaging

The companion ZIP is a changed-file overlay against the supplied original source tree, preserving paths under `card-game-platform/`. It excludes actual `.env` files, `.git`, `node_modules`, build output, caches, and private keys. See `PATCH_MANIFEST.txt` inside the archive for the precise added/modified file list.
