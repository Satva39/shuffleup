# Room System

## Room lifecycle

```text
Create Room
    |
    v
6-character Room Code
    |
    v
Players Join
    |
    v
Players Ready
    |
    v
Host Starts Game
    |
    v
Playing Room / Game
```

## Room object

The in-memory room manager stores:

| Field | Meaning |
|---|---|
| `code` | six-character room code |
| `gameId` | selected game |
| `hostId` | current host user id |
| `status` | `waiting` or `playing` |
| `createdAt` | creation timestamp |
| `players` | room player records |

Player records contain id, username, ready state, socket id and connection state.

## Game limits

| Game | Min | Max |
|---|---:|---:|
| Kachuful | 4 | 10 |
| Teen Patti | 3 | 6 |
| Indian Rummy | 2 | 6 |
| Mangoose | 2 | 12 |
| UNO | 2 | 12 |
| Jack Thief | 2 | 8 |
| Napoleon | 5 | 5 |
| Bridge | 4 | 4 |
| Spades | 4 | 4 |
| 29 Card Game | 4 | 4 |
| Mindi Coat | 4 | 4 |
| Bluff | 2 | 6 |
| Satte Pe Satta | 3 | 8 |
| War | 2 | 2 |
| Solitaire Multiplayer | 2 | 8 |

The room manager's configured limits are the authoritative limits used for room creation/joining.

## Create/join

A logged-in client sends `create-room` or `join-room`. The server verifies the supplied user identity is present in the event payload, creates/updates the room, joins the Socket.IO room and returns the room through the acknowledgment callback.

## Ready and start

Non-host players can toggle ready state. The host starts the game. Starting requires the configured minimum player count and all non-host players to be ready.

## Host transfer

If the host leaves or is removed after disconnect grace handling, the first remaining room player becomes host.

## Leaving and disconnects

Explicit leaving removes the player immediately.

A Socket.IO disconnect marks a player `connected: false` and broadcasts the room state. The room manager has a 15-second cleanup path; the game list currently bypasses that removal branch for all 15 implemented games, allowing their game-specific reconnection flows to retain the player.

The room system itself does not persist room state outside the running backend process.
