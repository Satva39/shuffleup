# Teen Patti

## Overview
The implementation is a 3-card comparison game played over exactly 11 rounds. It is an in-game points system only; no betting or real-money wagering is implemented.

## Supported Players
3–6 players.

## Objective
Win individual rounds and accumulate the highest round-win score across 11 rounds.

## Deck / Cards
Standard 52-card deck. Each player receives three cards.

## Setup
Dealer is initially player index 0; the first active player is the next seat.

## Game Flow
Deal 3 cards → sequential actions → round winner → optional explicit next round → after round 11, final standings.

## Turn Rules
A player may `fold` or `play`. Each active player acts once. If only one active player remains, that player wins the round. If all active players have acted without a single survivor, the server resolves the round by showdown.

## Card Rules
Hand ranking is: High Card < Pair < Color < Sequence < Pure Sequence < Trail. The engine compares the evaluated 3-card hands server-side.

## Special Rules
A folded player is not considered during the remaining round.

## Scoring
Each round win adds 1 point to the winner. No betting amount or currency exists.

## Round Completion
The winning hand/remaining active player is recorded and the status becomes `round-complete` until someone starts the next round. The final round transitions the game to `complete`.

## Game Completion
After 11 rounds, the highest round score wins; seat order breaks a score tie.

## Multiplayer Behaviour
All authoritative actions are validated by the server.

## Reconnection Behaviour
The engine and socket module track disconnected players and support an explicit reconnect event.

## Private Information
Private state contains the player's own three cards; public state does not expose opponents' hidden cards.

## Winning Condition
Highest score after 11 rounds.

## Implementation Notes
The source implements no betting/chip/pot system, so none is documented here.
