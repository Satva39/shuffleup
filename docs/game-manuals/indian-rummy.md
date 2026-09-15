# Indian Rummy

## Overview
Server implementation of a 13-card Indian Rummy hand with declaration-based completion.

## Supported Players
2–6 players.

## Objective
Declare a valid 13-card grouping containing at least one pure sequence and at least two sequences.

## Deck / Cards
Two standard 52-card decks plus two printed Jokers (106 cards total). Each player receives 13 cards.

## Setup
A random non-printed card rank is chosen as the wild-joker rank. Players are dealt 13 cards. One further card starts the discard pile; the rest form the closed/draw pile.

## Game Flow
Draw from closed deck or discard pile → form groups in hand → discard one card. A player can attempt declaration after drawing.

## Turn Rules
A player draws at most once, must discard before ending the turn, and turns advance to the next active player.

## Card Rules
A sequence is same-suit consecutive cards; a set is same-rank cards of different suits. The selected wild-joker rank and printed Jokers act as jokers in grouping validation.

## Special Rules
Declaration removes one selected card from the 14-card post-draw hand before the server validates the remaining 13 cards.

## Scoring
The declarer scores 0. Other players receive deadwood penalties based on the best partial grouping, capped at 80 points. Joker-valued deadwood contributes 0.

## Round Completion
A valid declaration immediately sets game status to `complete`.

## Game Completion
The declaring player is the winner.

## Multiplayer Behaviour
The server validates turn, card ownership, draw/discard order and declaration groups.

## Reconnection Behaviour
The game tracks disconnect/reconnect and can return private state to the reconnecting player.

## Private Information
Hands are private; public state exposes only sanitized card information.

## Winning Condition
First valid declaration.

## Implementation Notes
This is the implemented one-hand declaration model, not a multi-round chip-scoring rummy tournament.
