# ShuffleUp six-feature integration and release checklist

This patch builds on the preceding changed-file package and implements a first integration of the requested demo, bot personalities/voice, disclosed challenge mode, disconnected-player bot takeover, persistent match statistics, and game-experience effects. It does not substitute source-level tests for live deployment or physical-device testing.

## 1. Two-minute demo before login

- `POST /api/demo/session` issues a signed guest JWT with a 120-second expiration and no-store caching.
- The server applies a per-IP, per-process session rate limit (5 per hour by default) and only allows bot-game demo rooms.
- Both the socket and active demo room are expired server-side. A browser/mobile countdown is UX only; it is not the authority for access.
- Guests cannot use normal multiplayer, social, or authenticated-history features. The flow should prompt registration/sign-in at expiry.
- This rate limiter is local-memory, not cluster-wide. For a multi-instance deployment, move the limiter/session revocation to a shared store such as Redis before relying on it for abuse control.

## 2. Bot personas, reactions and voice

- Bot setup supports **Mixed**, **Male**, and **Female** persona selection. Persona names are not claims about actual people.
- Short reactions after public player actions use deterministic fallback dialogue by default.
- An optional OpenAI-compatible adapter supports self-hosted open models served through `/v1/chat/completions` (for example Ollama with an OpenAI-compatible endpoint, vLLM, or LocalAI). The server passes only public game/action context and has a short timeout/cooldown. Provider errors fall back without holding up the game action.
- Configure `BOT_LLM_ENABLED`, `BOT_LLM_BASE_URL`, `BOT_LLM_MODEL`, and optionally `BOT_LLM_API_KEY`; the key must remain server-side. Voice uses browser SpeechSynthesis or Expo Speech and lets users choose available voices/volume. Available system voices vary by operating system/device.
- Voice/reaction quality and the privacy behavior of an externally hosted provider require deployment review. Do not send hands, hidden cards or private engine state to a model.

## 3. Impossible Challenge

- The deliberately unfair, visibly disclosed mode is limited to **War**. It forces the Challenge bot to win resolved battles within this mode; ordinary War and the other game engines are not changed.
- Setup labels the mode and the game screen shows a disclosed-advantage notice.
- This is not a universal never-lose algorithm for all games and must not be described as one. Extending it to another game requires a separately isolated, disclosed engine policy and tests.

## 4. Automatic takeover on disconnect

- Active supported rooms schedule takeover after `BOT_TAKEOVER_GRACE_MS` (default 45 seconds; clamped to 10–180 seconds), excluding demo rooms, Impossible Challenge, and Solitaire.
- The game-specific bot joins the existing seat and plays through the existing server/engine contracts. A reconnect can return control to the human. The code distinguishes a real Socket.IO connection from the synthetic seat ID used by an in-game bot, avoiding immediate handback to the bot itself.
- Rooms/sessions are currently held in process memory. Takeover timers do not survive a backend process restart or automatically synchronize across instances; production scale-out needs shared room/session/timer state.

## 5. Persistent statistics

- `database/migrations/20261016_game_stats_and_demo.sql` adds `game_matches` and `game_match_players`; apply it once to a backed-up staging database first.
- The server records completion events and associates stats only with registered UUID users. Explicit engine winners/team results/authoritative rankings are used; unknown results stay unknown and are not inferred from client state or a raw score.
- The website and mobile dashboard show server-reported completed matches, wins/losses, game breakdown, recent results and a 30-day daily trend, separately from local game-screen launches.
- Match recording requires the relevant game's server completion event to be emitted through the wrapped Socket.IO layer and to expose a result format the extractor understands. Verify all game result payloads in staging before using win rates for ranking/rewards.
- DB errors cannot be considered tested until `DATABASE_URL` is connected and the migration applied.

## 6. Dealer/card animations and audio

- The web experience bridge reacts to real game/socket events to animate card dealing, plays/collection and completion; effects are overlays and do not intercept game input. Website sound/music controls are opt-in.
- The mobile experience layer uses `expo-audio` and `expo-speech`, with synthesized local WAV sound effects, opt-in sound/music/voice controls and card/round/game-result effects. Persona voice selection prefers a system voice that matches the requested persona when one is available.
- The mobile app's Expo dependencies are declared in `mobile/package.json` and lockfile. The existing dependency installation here was not sufficient to run Metro/EAS; install the locked dependencies and rebuild the native Android binary before testing.

## Environment configuration

See `backend/.env.example`. Required for demo/JWT: `JWT_SECRET` (random, at least 32 characters). Required for stats: a working `DATABASE_URL` and the migration above. Optional bot LLM settings: `BOT_LLM_ENABLED`, `BOT_LLM_BASE_URL`, `BOT_LLM_MODEL`, `BOT_LLM_API_KEY`, `BOT_LLM_TIMEOUT_MS`, `BOT_REACTION_COOLDOWN_MS`. Optional takeover grace: `BOT_TAKEOVER_GRACE_MS`. Never put the LLM key in web/mobile environment variables.

## Verification run for this integration

- Backend `npm run test:all`: passed after the six-feature changes and takeover-race correction.
- Frontend/mobile Babel parse check: all 440 JavaScript/JSX source files parsed successfully.
- New/expanded tests cover demo JWT duration/guest identity, bot persona/reaction adapter and provider fallback, War's disclosed challenge behavior, takeover grace/policy and return-control logic, bot room persona selection, and completion-result winner extraction.
- Website production build is **blocked** in this environment: `vite` is not executable from the preinstalled symlinked dependencies and invoking it directly shows missing optional dependency `@rollup/rollup-linux-x64-gnu`.
- Not verified in this environment: live PostgreSQL migration/persistence, physical Android device behavior/EAS build, actual speech/audio availability on target devices, hosted LLM credentials/response, two-live-client takeover flow, backend restart resilience, or production load capacity. The earlier 200-request/20-client local HTTP test is not an end-to-end multiplayer performance result.

## Release validation sequence

1. Install dependencies from lockfiles in a clean environment and complete Vite/Expo/EAS builds.
2. Apply the stats migration to a backed-up staging PostgreSQL database.
3. Test expired demo tokens while connected, after navigating away, and after trying regular multiplayer endpoints.
4. Test each supported bot game through completion, and test one human disconnect/reconnect with two real clients per supported game.
5. Test the disclosed War challenge mode in setup and in-game.
6. Check statistics against the actual completion events emitted by all 15 games; document unknown-result games instead of guessing.
7. Test music/sound/voice controls on desktop browsers and a physical Android device.
