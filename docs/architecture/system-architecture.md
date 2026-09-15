# System Architecture

## Overview

ShuffleUp is a browser client with HTTP authentication and Socket.IO multiplayer communication.

```text
Browser
  |
  +--> React / Vite frontend
  |       |
  |       +--> HTTP fetch --> Express API --> PostgreSQL
  |       |
  |       +--> Socket.IO client --> Socket.IO server
  |                                  |
  |                                  +--> in-memory room manager
  |                                  +--> game socket handlers
  |                                  +--> game engines / rules
  |
  +<----- HTTP JSON responses
  +<----- Socket.IO state/events
```

## Frontend

`frontend/src/App.jsx` registers the application routes and renders the game pages. Authentication state is provided by `AuthContext`. The frontend uses `fetch()` for authentication requests and one Socket.IO client instance for real-time gameplay.

## Backend

`backend/src/app.js` creates the Express application, configures CORS and JSON parsing, exposes `/api/health`, and mounts `/api/auth`.

`backend/src/server.js` creates the HTTP server and attaches Socket.IO. Socket.IO is configured with the frontend origin from `FRONTEND_URL`.

## Rooms

`backend/src/sockets/roomManager.js` keeps a `Map` of active rooms in process memory. A room stores:

- six-character room code
- selected game id
- host id
- status (`waiting` or `playing`)
- creation time
- player records
- readiness and connection state

Rooms are not persisted in PostgreSQL.

## Game engines

Each game has a backend directory containing an engine, rules module and Socket.IO handler. The engine is authoritative for cards, turns and results. Socket handlers translate client events into engine operations and send sanitized public/private state.

## Database

The inspected schema contains one persistent table, `users`. Authentication reads and writes this table. Game rooms, hands and scores are not stored in PostgreSQL.

## Deployment boundary

The project does not specify a production hosting provider. The frontend uses Vite; the backend is a Node HTTP server with Socket.IO. A production deployment must preserve HTTP and WebSocket connectivity and set the required environment variables.
