# Shared Infrastructure

ShuffleUp keeps game-specific engines and state inside each game module. The shared layer contains only platform-wide contracts and values that are genuinely common.

## Shared constants

`shared/constants/platform.js` owns the canonical game identifiers, player limits, room statuses, lifecycle phase names, and standard card suit/rank values.

The game identifiers are:

- `kachuful`
- `teen-patti`
- `indian-rummy`
- `mangoose`
- `uno`
- `jack-thief`
- `napoleon`
- `bridge`
- `spades`
- `twenty-nine`
- `mindi-coat`
- `bluff`
- `satte-pe-satta`
- `war`
- `solitaire`

Game engines may keep additional game-specific rules and representations.

## Shared contracts

`shared/types/contracts.js` documents the common player, room, and game-state shape using JSDoc. It is documentation/type information for JavaScript and does not replace runtime validation.

## Socket identity

Socket.IO connections authenticate with the existing JWT. The authenticated user id is stored in `socket.data.authUserId` by the central socket middleware.

Room-control events use the authenticated socket identity rather than trusting a client-supplied user id.

Game socket modules must bind a game socket to the authenticated user during join/reconnect and validate that identity before private-state reads or player actions.

## Privacy

Private state continues to be emitted only to the corresponding player's socket. Public state remains game-specific and is produced by the game's public-state function.

## Backward compatibility

No game engine, game rules, UI layout, route, or game-specific event naming is replaced by the shared layer.
