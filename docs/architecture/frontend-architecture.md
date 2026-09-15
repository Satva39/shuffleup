# Frontend Architecture

## Entry point

`frontend/src/main.jsx` renders `App` inside `React.StrictMode` and imports the global stylesheet.

## Routing

`frontend/src/App.jsx` uses React Router with these route groups:

| Route | Purpose |
|---|---|
| `/` | Home |
| `/login` | Login |
| `/register` | Registration |
| `/lobby` | Game selection, create/join room |
| `/room/:roomCode` | Waiting room |
| `/games/<game>/:roomCode` | Game-specific page |

The 15 game routes are explicitly registered in `App.jsx`.

## Authentication state

`AuthContext.jsx` stores the current user in React state and mirrors the user and JWT in browser `localStorage` under:

- `shuffleup_user`
- `shuffleup_token`

On provider startup, the stored token is checked with `GET /api/auth/me`. An invalid/expired session clears both stored values.

There is no separate React Router protected-route component in the inspected code. Pages such as Lobby and Room perform their own authentication navigation.

## HTTP service

`frontend/src/services/auth.js` uses `VITE_API_URL`, defaulting to `http://localhost:5000`, and provides:

- registration
- login
- current-user lookup

## Socket.IO client

`frontend/src/services/socket.js` creates one Socket.IO client with `autoConnect: false`. Game and room pages connect it when needed.

## Shared UI

Reusable site UI includes the navbar and game-card components. Game-specific UI lives beneath `frontend/src/games/<game>/` with pages, hooks, components, logic and styles.

## Game state

Game hooks such as `useSpadesSocket`, `useWarSocket` and the other game-specific hooks subscribe to the corresponding Socket.IO events and feed the page components. Clients render state received from the backend rather than owning the authoritative game rules.
