# Mangoose

## Overview
Mangoose is a shedding/placement game built around personal closed/open piles and four suit-specific center foundations.

## Supported Players
2–12 players.

## Objective
Reduce your own card piles to zero. The first player to empty their cards becomes the winner; game completion is then checked.

## Deck / Cards
One standard 52-card deck.

## Setup
Cards are dealt round-robin into each player's closed pile. Four empty center stacks exist, one for each suit.

## Game Flow
Flip a card → choose a legal destination → continue the turn or advance. Cards may also be played from the top of an open pile.

## Turn Rules
Actions include flip, play to center, play to opponent, play to own open pile and call Mongoose.

## Card Rules
Center stack: its first card must be that suit's Ace; later cards must be exactly one rank above/below the top card of the same suit. Opponent open piles accept only the immediately ascending rank; suit is irrelevant.

## Special Rules
When a player puts a card onto their own open pile while another legal destination existed, a 3-second Mongoose call window opens. A successful Mongoose call applies a penalty by transferring one closed-pile card from each eligible other player to the offending player.

## Scoring
There is no separate numeric score. The engine tracks finishing/winner status and remaining card counts.

## Round Completion
Players may finish individually; the engine advances turns and continues until game completion.

## Game Completion
The engine finishes when only one eligible player still has cards after winners/finished players are excluded.

## Multiplayer Behaviour
Legal targets and all penalties are decided server-side.

## Reconnection Behaviour
Player connection state and explicit reconnect handling are implemented in the game module.

## Private Information
Opponents do not receive the identities of hidden closed-pile cards.

## Winning Condition
Being the final eligible player in the engine's completion state, with earlier individual finishes retained as standings.

## Implementation Notes
The implementation uses exact adjacency for center stacks and exact ascending rank for opponent open piles; those suit/rank constraints are the ShuffleUp source of truth.
