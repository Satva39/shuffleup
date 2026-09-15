# War

## Overview
Two-player War with explicit server-controlled battles and recursive War resolution.

## Supported Players
Exactly 2 real players.

## Objective
Take all available cards and be the last player with cards.

## Deck / Cards
Standard 52-card deck. Rank order is 2 through Ace. Suits do not break ties.

## Setup
The server shuffles and deals 26 cards to each player.

## Game Flow
Start battle → each active player reveals one face-up card → higher rank wins the battle pile → tied ranks start War → repeat until a winner is resolved → next battle.

## Turn Rules
The battle is initiated through the server's `war:start-battle` event. Card reveals and delays are server-driven.

## Card Rules
Highest rank wins. Aces are high.

## Special Rules
On a tie, each tied player places one face-down card when available and then a new face-up comparison card. Further ties repeat the War procedure.

## Scoring
No numeric score. The currency is card ownership.

## Round Completion
A battle completes when its comparison resolves.

## Game Completion
A player with no remaining cards is eliminated. The game completes when only one player remains eligible. The engine also records simultaneous exhaustion as a draw result where applicable.

## Multiplayer Behaviour
The server owns deck order, battle pile, reveals and card transfer.

## Reconnection Behaviour
Reconnect and state requests are implemented.

## Private Information
Opponent draw-pile order remains private; public state exposes only permitted card/battle data.

## Winning Condition
Last player with cards.

## Implementation Notes
Reveal timing constants are 850 ms for the main battle reveal, 700 ms for War reveal and 1100 ms before the next battle.
