# Error Handling

## HTTP errors

Authentication controllers return JSON messages with HTTP status codes.

Current authentication error cases include:

| Status | Cases |
|---:|---|
| 400 | missing registration/login fields; short password |
| 401 | missing/invalid/expired JWT; invalid login credentials |
| 404 | current user not found |
| 409 | email already registered |
| 500 | database/controller failure |

## Room errors

Room callbacks return `{ success: false, message }` for cases such as:

- invalid game
- room not found
- game already started
- room full
- player not found
- insufficient players
- not host
- non-ready players

## Game errors

Each game socket catches engine/validation errors and emits its namespaced `:<error>` event. The engine validates:

- room/player membership
- current turn
- phase/state
- card ownership
- legal bid/action
- game-specific rules

## Validation principle

Client UI restrictions are not the authoritative rule system. Game engines perform server-side checks before mutating state.
