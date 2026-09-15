# Room Socket API

The room layer is Socket.IO-based rather than HTTP-based.

## `create-room`

Direction: client → server.

Payload:

```js
{ gameId }
```

Acknowledgment:

```js
{ success: true, room }
```

or

```js
{ success: false, message }
```

Server actions:

- validates the authenticated Socket.IO user
- validates game id through the room manager
- creates a unique six-character room code
- joins the socket to that room
- stores socket/user identity on the room player
- broadcasts `room-updated`

## `join-room`

Payload:

```js
{ roomCode }
```

The server normalizes the room code to uppercase, checks room status/capacity and adds the player when needed.

## `toggle-ready`

Payload:

```js
{ roomCode }
```

The server uses the authenticated socket identity. Toggles the player's ready flag and broadcasts `room-updated`.

## `start-game`

Payload:

```js
{ roomCode }
```

The server uses the authenticated socket identity. Only the host may start. The server requires the minimum player count and all non-host players to be ready.

Success broadcasts `game-started`.

## `leave-room`

Payload:

```js
{ roomCode }
```

The server uses the authenticated socket identity. Removes the player and broadcasts `room-updated` when the room remains.

## Server room events

- `room-updated`
- `game-started`

## Disconnect

The central socket server marks the room player disconnected and broadcasts `room-updated`. Game-specific modules retain their own connected/reconnection handling.
