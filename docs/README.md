# ShuffleUp Documentation

This documentation describes the ShuffleUp implementation found in the inspected project snapshot.

## Source of truth

1. Working backend game engines and rules.
2. Existing project documentation.
3. Database schema and database code.
4. Socket.IO handlers.
5. Frontend implementation.

Where the code contains an explicit implementation decision, this documentation records that decision rather than replacing it with a generic card-game convention.

## Documentation map

- `architecture/` — system, frontend, backend, multiplayer, authentication, room and data-flow documentation.
- `game-manuals/` — the 15 implemented game manuals.
- `api/` — HTTP API, Socket.IO and error references.
- `deployment/` — local setup, environment, production notes and troubleshooting.

## Current implementation boundaries

- Frontend uses React, JSX, CSS and Vite.
- Backend uses Node.js, Express and Socket.IO.
- PostgreSQL is used for persistent user accounts.
- Runtime room and game state is held in backend memory.
- `shared/` currently contains no shared runtime game code.
- No TypeScript files are used by the application source.
- No AI/bot players or real-money wagering mechanics are implemented.
- Redis is not present in the inspected implementation.
