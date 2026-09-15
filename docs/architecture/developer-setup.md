# Developer Setup

## First orientation

Start with:

1. `frontend/src/App.jsx`
2. `frontend/src/context/AuthContext.jsx`
3. `frontend/src/services/socket.js`
4. `backend/src/app.js`
5. `backend/src/server.js`
6. `backend/src/sockets/roomManager.js`
7. `backend/src/sockets/socketServer.js`
8. `backend/src/games/`

## Run locally

Install backend and frontend dependencies separately, configure environment variables, apply the database schema, start backend, then start frontend.

## Functional smoke test

1. Open the frontend.
2. Register an account.
3. Log in.
4. Open the lobby.
5. Create a room.
6. Open the room with another account/browser session.
7. Join using the room code.
8. Ready the non-host player(s).
9. Start the game as host.
10. Exercise the game's actions through at least one complete round.

## When changing a game

Keep the existing three-part backend pattern in that game's folder:

- rules/constants
- engine
- Socket.IO handler

Then inspect its frontend page, hook and components before changing the UI.

## Do not assume persistence

The current architecture keeps room/game state in process memory. Database changes should be treated separately from game-engine changes.
