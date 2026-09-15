# Game Socket Event Inventory

This file lists event names found in the implemented game socket modules. Payload names are based on the handler signatures in those modules. It does not add planned events.

## kachuful

### Client → server

- `kachuful:join` — handler parameters `{ roomCode, userId }, callback`.
- `kachuful:bid` — handler parameters `{ roomCode, userId, bid }, callback`.
- `kachuful:play-card` — handler parameters `{ roomCode, userId, cardId }, callback`.
- `kachuful:next-round` — handler parameters `{ roomCode, userId }, callback`.

### Server → client

- `kachuful:bid-submitted`
- `kachuful:card-played`
- `kachuful:error`
- `kachuful:game-complete`
- `kachuful:next-round`
- `kachuful:state`

## teen-patti

### Client → server

- `teen-patti:join` — handler parameters `{ roomCode, userId }, callback`.
- `teen-patti:action` — handler parameters `{ roomCode, userId, action }, callback`.
- `teen-patti:reconnect` — handler parameters `{ roomCode, userId }, callback`.

### Server → client

- `teen-patti:error`
- `teen-patti:game-complete`
- `teen-patti:public-state`
- `teen-patti:round-complete`
- `teen-patti:state`

## indian-rummy

### Client → server

- `indian-rummy:join` — handler parameters `{ roomCode, userId }, callback`.
- `indian-rummy:action` — handler parameters `{ roomCode, userId, action, cardId }, callback`.
- `indian-rummy:reconnect` — handler parameters `{ roomCode, userId }, callback`.

### Server → client

- `indian-rummy:declare-result`
- `indian-rummy:discard`
- `indian-rummy:draw`
- `indian-rummy:error`
- `indian-rummy:game-complete`
- `indian-rummy:public-state`
- `indian-rummy:state`
- `indian-rummy:turn`

## mangoose

### Client → server

- `mangoose:join` — handler parameters `{ roomCode, userId }, callback`.
- `mangoose:reconnect` — handler parameters `{ roomCode, userId }, callback`.

### Server → client

- `mangoose:card-flipped`
- `mangoose:card-played`
- `mangoose:error`
- `mangoose:game-complete`
- `mangoose:mongoose-called`
- `mangoose:mongoose-expired`
- `mangoose:mongoose-window`
- `mangoose:notice`
- `mangoose:public-state`
- `mangoose:state`

## uno

### Client → server

- `uno:join` — handler parameters `{ roomCode, userId }, callback`.
- `uno:action` — handler parameters `{ roomCode, userId, action, payload }, callback`.
- `uno:reconnect` — handler parameters `{ roomCode, userId }, callback`.

### Server → client

- `uno:error`
- `uno:public-state`
- `uno:round-started`
- `uno:state`

## jack-thief

### Client → server

- `jack-thief:join` — handler parameters `{ roomCode, userId }, callback`.
- `jack-thief:draw` — handler parameters `{ roomCode, userId, targetPlayerId, cardIndex }, callback`.
- `jack-thief:reconnect` — handler parameters `{ roomCode, userId }, callback`.
- `jack-thief:request-state` — handler parameters `{ roomCode, userId }, callback`.

### Server → client

- `jack-thief:card-drawn`
- `jack-thief:deal`
- `jack-thief:error`
- `jack-thief:game-complete`
- `jack-thief:pair-removed`
- `jack-thief:player-finished`
- `jack-thief:player-status`
- `jack-thief:public-state`
- `jack-thief:round-complete`
- `jack-thief:state`
- `jack-thief:turn`

## napoleon

### Client → server

- `napoleon:join` — handler parameters `{ roomCode, userId }, callback`.
- `napoleon:bid` — handler parameters `{ roomCode, userId, bid }, callback`.
- `napoleon:call-partner` — handler parameters `{ roomCode, userId, card }, callback`.
- `napoleon:discard` — handler parameters `{ roomCode, userId, cardIds }, callback`.
- `napoleon:play-card` — handler parameters `{ roomCode, userId, cardId }, callback`.
- `napoleon:next-round` — handler parameters `{ roomCode, userId }, callback`.

### Server → client

- `napoleon:bid-updated`
- `napoleon:card-played`
- `napoleon:contract-updated`
- `napoleon:error`
- `napoleon:play-started`
- `napoleon:state`

## bridge

### Client → server

- `bridge:join` — handler parameters `{ roomCode, userId }, callback`.
- `bridge:bid` — handler parameters `{ roomCode, userId, action }, callback`.
- `bridge:play-card` — handler parameters `{ roomCode, userId, cardId, sourceSeat }, callback`.
- `bridge:next-deal` — handler parameters `{ roomCode, userId }, callback`.
- `bridge:reconnect` — handler parameters `{ roomCode, userId }, callback`.
- `bridge:state` — handler parameters `{ roomCode, userId }, callback`.

### Server → client

- `bridge:auction-complete`
- `bridge:bid-submitted`
- `bridge:card-played`
- `bridge:contract`
- `bridge:deal`
- `bridge:deal-complete`
- `bridge:dummy-reveal`
- `bridge:error`
- `bridge:next-deal`
- `bridge:opening-lead`
- `bridge:public-state`
- `bridge:round-complete`
- `bridge:state`
- `bridge:trick-complete`
- `bridge:turn`

## spades

### Client → server

- `spades:join` — handler parameters `{ roomCode, userId }, callback`.
- `spades:bid` — handler parameters `{ roomCode, userId, bid }, callback`.
- `spades:play-card` — handler parameters `{ roomCode, userId, cardId }, callback`.
- `spades:next-hand` — handler parameters `{ roomCode, userId }, callback`.
- `spades:reconnect` — handler parameters `{ roomCode, userId }, callback`.
- `spades:state` — handler parameters `{ roomCode, userId }, callback`.

### Server → client

- `spades:bid-submitted`
- `spades:bidding-complete`
- `spades:card-played`
- `spades:deal`
- `spades:error`
- `spades:game-complete`
- `spades:hand-complete`
- `spades:next-hand`
- `spades:public-state`
- `spades:score-update`
- `spades:spades-broken`
- `spades:state`
- `spades:trick-complete`
- `spades:trick-start`
- `spades:turn`

## twenty-nine

### Client → server

- `twenty-nine:join` — handler parameters `{ roomCode, userId }, callback`.
- `twenty-nine:bid` — handler parameters `{ roomCode, userId, bid }, callback`.
- `twenty-nine:trump` — handler parameters `{ roomCode, userId, suit }, callback`.
- `twenty-nine:play-card` — handler parameters `{ roomCode, userId, cardId }, callback`.
- `twenty-nine:next-hand` — handler parameters `{ roomCode, userId }, callback`.
- `twenty-nine:reconnect` — handler parameters `{ roomCode, userId }, callback`.
- `twenty-nine:state` — handler parameters `{ roomCode, userId }, callback`.

### Server → client

- `twenty-nine:auction-complete`
- `twenty-nine:auction-update`
- `twenty-nine:bid-submitted`
- `twenty-nine:card-played`
- `twenty-nine:deal`
- `twenty-nine:error`
- `twenty-nine:game-complete`
- `twenty-nine:hand-complete`
- `twenty-nine:join`
- `twenty-nine:next-hand`
- `twenty-nine:public-state`
- `twenty-nine:score-update`
- `twenty-nine:state`
- `twenty-nine:trick-complete`
- `twenty-nine:trick-start`
- `twenty-nine:trump`
- `twenty-nine:trump-reveal`
- `twenty-nine:turn`

## mindi-coat

### Client → server

- `mindi-coat:join` — handler parameters `{ roomCode, userId }, callback`.
- `mindi-coat:trump-select` — handler parameters `{ roomCode, userId, cardId }, callback`.
- `mindi-coat:open-hukum` — handler parameters `{ roomCode, userId }, callback`.
- `mindi-coat:play-card` — handler parameters `{ roomCode, userId, cardId }, callback`.
- `mindi-coat:next-hand` — handler parameters `{ roomCode, userId }, callback`.
- `mindi-coat:reconnect` — handler parameters `{ roomCode, userId }, callback`.
- `mindi-coat:state` — handler parameters `{ roomCode, userId }, callback`.

### Server → client

- `mindi-coat:card-played`
- `mindi-coat:coat`
- `mindi-coat:deal`
- `mindi-coat:error`
- `mindi-coat:game-complete`
- `mindi-coat:hand-complete`
- `mindi-coat:key-card-captured`
- `mindi-coat:next-hand`
- `mindi-coat:public-state`
- `mindi-coat:score-update`
- `mindi-coat:state`
- `mindi-coat:trick-complete`
- `mindi-coat:trick-start`
- `mindi-coat:trump-reveal`
- `mindi-coat:trump-selected`
- `mindi-coat:turn`

## bluff

### Client → server

- `bluff:join` — handler parameters `{ roomCode, userId }, callback`.
- `bluff:reconnect` — handler parameters `{ roomCode, userId }, callback`.
- `bluff:state` — handler parameters `{ roomCode, userId }, callback`.
- `bluff:play-cards` — handler parameters `{ roomCode, userId, cardIds }, callback`.
- `bluff:expire` — handler parameters `{ roomCode, userId, claimId }, callback`.
- `bluff:challenge` — handler parameters `{ roomCode, userId }, callback`.

### Server → client

- `bluff:challenge-result`
- `bluff:error`
- `bluff:public-state`
- `bluff:state`

## satte-pe-satta

### Client → server

- `satte-pe-satta:join` — handler parameters `{ roomCode, userId }, callback`.
- `satte-pe-satta:reconnect` — handler parameters `{ roomCode, userId }, callback`.
- `satte-pe-satta:state` — handler parameters `{ roomCode, userId }, callback`.
- `satte-pe-satta:play-card` — handler parameters `{ roomCode, userId, cardId }, callback`.
- `satte-pe-satta:pass` — handler parameters `{ roomCode, userId }, callback`.

### Server → client

- `satte-pe-satta:card-played`
- `satte-pe-satta:error`
- `satte-pe-satta:game-complete`
- `satte-pe-satta:next-round`
- `satte-pe-satta:pass`
- `satte-pe-satta:public-state`
- `satte-pe-satta:round-complete`
- `satte-pe-satta:state`

## war

### Client → server

- `war:join` — handler parameters `{ roomCode, userId }, callback`.
- `war:reconnect` — handler parameters `{ roomCode, userId }, callback`.
- `war:state` — handler parameters `{ roomCode, userId }, callback`.
- `war:start-battle` — handler parameters `{ roomCode, userId }, callback`.

### Server → client

- `war:battle-result`
- `war:battle-start`
- `war:error`
- `war:game-complete`
- `war:next-battle`
- `war:pile-transfer`
- `war:state`
- `war:war-reveal`
- `war:war-start`

## solitaire

### Client → server

- `solitaire:join` — handler parameters `{ roomCode, userId }, callback`.
- `solitaire:reconnect` — handler parameters `{ roomCode, userId }, callback`.
- `solitaire:state` — handler parameters `{ roomCode, userId }, callback`.
- `solitaire:move` — handler parameters `{ roomCode, userId, move }, callback`.
- `solitaire:draw-stock` — handler parameters `{ roomCode, userId }, callback`.

### Server → client

- `solitaire:complete`
- `solitaire:error`
- `solitaire:game-complete`
- `solitaire:move-result`
- `solitaire:progress`
- `solitaire:ranking-update`
- `solitaire:state`
