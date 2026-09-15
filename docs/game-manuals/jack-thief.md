# Jack Thief / Old Maid / Gaddha Chor

## Overview
A pair-removal and hidden-draw elimination game. The only unmatched card is the Jack of Hearts.

## Supported Players
2–8 players at room level; the engine itself accepts 2–12.

## Objective
Remove all same-rank pairs and avoid being the final player holding the unmatched Jack of Hearts.

## Deck / Cards
Standard 52-card ranks and suits, except `JH` is removed before dealing as the special unmatched card definition used by the engine. The remaining deck is dealt round-robin.

## Setup
The server shuffles, deals, then immediately removes all possible same-rank pairs from every hand. The first eligible player starts.

## Game Flow
Draw one hidden card from the next active player → add to your hand → remove newly formed same-rank pairs → continue clockwise through active players.

## Turn Rules
A player may draw only from the next active player and chooses a hidden card position. A turn timeout is 18 seconds; the server can perform the automatic draw path when a player fails to act.

## Card Rules
A pair is any two cards of the same rank. Suits do not matter for pairing.

## Special Rules
Players who have no cards are marked finished. Elimination order is retained. The final remaining Jack is the loser.

## Scoring
No numeric score; outcome is placement/elimination based.

## Round Completion
The round is complete when only one card remains and it is a Jack.

## Game Completion
The player holding the final Jack is marked loser and the game becomes complete.

## Multiplayer Behaviour
The server knows hidden card identities; clients receive only permitted state.

## Reconnection Behaviour
The game tracks connected/disconnected status and provides a reconnect event.

## Private Information
A target player's exact card identities are hidden; the drawer chooses an index only.

## Winning Condition
Avoid the final unmatched Jack; players who finish earlier are ranked ahead of the loser.

## Implementation Notes
The server rules use `JH` as the special removed/unmatched card and same-rank matching for every other pair.
