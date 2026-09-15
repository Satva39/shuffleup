# Backend Architecture

## Entry points

- `src/app.js` — Express app configuration and HTTP routes.
- `src/server.js` — HTTP server creation, Socket.IO attachment and listen call.

## HTTP layer

`app.js` configures:

- CORS using `FRONTEND_URL`
- `express.json()`
- `GET /api/health`
- `/api/auth` routes

Authentication controller code lives in `controllers/authController.js`.

## Authentication

`middleware/authMiddleware.js` validates `Authorization: Bearer <token>` using `JWT_SECRET`.

`utils/generateToken.js` signs a JWT containing the user id and username with a seven-day expiration.

## Room and socket layer

`src/sockets/roomManager.js` owns room lifecycle and game player limits.

`src/sockets/socketServer.js` attaches:

- create room
- join room
- ready toggle
- start game
- leave room
- disconnect handling

It also installs all 15 game Socket.IO modules on every connection.

## Game modules

Each game follows the same broad backend split:

```text
<game>Rules.js
      |
      v
<game>Engine.js
      ^
      |
<game>Socket.js
      |
      v
Socket.IO client
```

The split is not a generic framework abstraction; it is the current layout of the game modules.

## Services/models

The `services/` and `models/` directories are present but contain no application modules in the inspected snapshot. Database access is currently performed directly through the PostgreSQL pool in the authentication controller.

## Shared directory

`shared/` contains no application modules in the inspected project snapshot.
