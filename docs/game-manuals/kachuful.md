# Kachuful

## Overview
Implemented server rules define Kachuful as a variable-round trick-taking game.

## Supported Players
4–10 players.

## Objective
Score points by predicting the exact number of tricks you will win.

## Deck / Cards
One standard 52-card deck. Player count determines the maximum number of cards per round: the server plays `floor(52 / playerCount)` rounds, with round card count increasing from 1 up to that maximum.

## Setup
The server deals one card per player in round 1. Later rounds use one additional card per player. The dealer starts at seat/index 0 and rotates each round.

## Game Flow
Each round: deal → private bid → bids reveal when all players bid → trick play → round scoring → next round.

## Turn Rules
The player left of the dealer starts the round's bidding and first trick. Trick turns proceed around the room.

## Card Rules
Players must follow the leading suit when able. Otherwise any card may be played. The round trump rotates through Spades, Diamonds, Clubs, Hearts.

## Special Rules
The trump suit is round-dependent and is not a player choice.

## Scoring
An exact bid is worth `10 + bid`. A non-exact bid scores 0 for that round.

## Round Completion
All cards are played; each player's `tricksWon` is compared with their bid and the round score is added to their cumulative score.

## Game Completion
The engine runs through all `floor(52 / playerCount)` rounds and then selects the game result according to the final scores.

## Multiplayer Behaviour
The server owns bids, hands, turn order, trick resolution and scores.

## Reconnection Behaviour
Kachuful tracks player socket connection state and emits current game state to the reconnecting player.

## Private Information
Player cards and hidden pre-reveal state are sanitized through public/private state functions.

## Winning Condition
The engine's winner is determined from cumulative scores after the final round.

## Implementation Notes
This manual intentionally follows the code's exact trump order and scoring rather than substituting another regional Kachuful ruleset.
