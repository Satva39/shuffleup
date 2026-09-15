# Multiplayer Architecture

## Connection model

A single Socket.IO connection is created by the frontend and joined to a Socket.IO room using the six-character ShuffleUp room code.

```text
Player A browser ─┐
Player B browser ─┼── Socket.IO room "ABC123" ── game socket ── game engine
Player C browser ─┘
```

## Authoritative state

Game engines live on the server. Client actions are validated against the server game state before state/event responses are sent.

Typical game flow:

1. client sends a game action
2. game socket checks room/player identity and phase/turn
3. engine applies or rejects the action
4. socket emits public/private state or result events
5. clients render the returned state

## Public vs private state

Many engines expose both public and private state functions. Private state is used to avoid leaking hidden hands, stock order or other player-only data.

Examples:

- card-game opponents generally receive counts instead of hidden hand identities
- 29 hides trump until reveal
- Mindi Coat hides the selected Hukum card
- Bridge reveals dummy only after the opening lead
- Bluff hides unrevealed claim cards
- Solitaire gives each player their own complete board while opponents receive progress

## Reconnection

The game-specific socket modules for all 15 games contain explicit reconnection/connection-state handling in the inspected snapshot, but the exact recovery state differs by game.

No single centralized reconnection protocol exists; recovery is implemented per game.
