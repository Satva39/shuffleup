# ShuffleUp Mobile — Production Foundation

This is a new React Native + Expo client for the existing ShuffleUp production platform. It does not replace or modify the existing web frontend or backend.

## Source-of-truth findings
- Production API/socket base: `https://shuffleup-backend.onrender.com`
- REST auth endpoints: `/api/auth/register`, `/api/auth/login`, `/api/auth/me`
- Socket.IO authenticates with the existing JWT in `handshake.auth.token`.
- Room events: `create-room`, `join-room`, `toggle-ready`, `start-game`, `leave-room`, plus `room-updated` and `game-started`.
- The backend registers all 15 existing game Socket.IO modules.

## Install

From `mobile/`:

```bash
npm install
npx expo install expo-linear-gradient expo-secure-store react-native-safe-area-context react-native-screens
npm start
```

For a production Android build:

```bash
npm install
npm install -g eas-cli
npx eas login
eas build:configure
eas build --platform android --profile production
```

## Important
This foundation intentionally stops before implementing the 15 game UIs. Game employees should add their game clients under `src/games/<game-id>/` and connect to the existing server events. They must not alter the web frontend or backend unless a genuine backward-compatible mobile compatibility issue is proven.

## Production design rules
- JavaScript/JSX only; no TypeScript.
- SecureStore for authentication token persistence.
- Socket.IO is reconnectable and server-authoritative.
- No second backend, database, fake multiplayer, or mobile-specific rules.
- Touch-first layouts, safe-area support, clear offline/disconnected states, and accessible actions.
