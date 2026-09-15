# Solitaire Multiplayer

## Overview
Competitive multiplayer Klondike-style Solitaire. Each player solves an independent board while the server compares progress.

## Supported Players
2–8 real players.

## Objective
Move all 52 cards into the four foundations before the competition ends.

## Deck / Cards
Each player receives a separate standard 52-card deck.

## Setup
Seven tableau columns contain 1–7 cards. Only each column's top card starts face-up. The remaining cards form the stock. There are four suit foundations.

## Game Flow
Tableau/foundation moves and stock draws occur independently per player; the server continuously updates progress and rankings.

## Turn Rules
There is no shared turn. Each player can make legal moves on their own board at any time while connected and incomplete.

## Card Rules
Tableau builds downward in alternating colors. Only a King can enter an empty tableau column. Foundations build upward by the same suit starting with Ace.

## Special Rules
Stock is draw-1. When the stock is exhausted, the waste is redealt to the stock. `MAX_REDEALS` is `Infinity` in the rules module.

## Scoring
For an incomplete player: `max(0, foundationCards × 100 - elapsedSeconds - moves)`. For a completed player: `max(1, 10000 - completionSeconds × 10 - moves)`.

## Round Completion
There is one competitive board per player; completion status is recorded independently.

## Game Completion
The engine completes the multiplayer game when its completion condition is met for the active player set.

## Multiplayer Behaviour
Each player's board is independent. Opponents receive progress/ranking information rather than private tableau/stock contents.

## Reconnection Behaviour
Explicit reconnect support restores the player's private board state from the server-held game object.

## Private Information
Tableau hidden-card identities, stock order, waste and foundations are private to the owning player.

## Winning Condition
Ranking uses completion state, completion time, moves, foundation progress and server-calculated score as implemented.

## Implementation Notes
The server constructs a separate shuffled deck for every player, so players are not racing over a shared deck.
