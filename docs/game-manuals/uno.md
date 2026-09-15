# UNO

## Overview
UNO is a 2–12 player multi-round game with a 500-point match target.

## Supported Players
2–12 players.

## Objective
Win rounds by emptying your hand and accumulate at least 500 total points.

## Deck / Cards
108-card UNO deck: four colors, number cards, Skip, Reverse, Draw Two, four Wild and four Wild Draw Four.

## Setup
Each player receives seven cards. A non-wild opening discard is selected. Starting-player effects for Reverse, Skip and Draw Two are resolved by the server.

## Game Flow
Play/draw → apply special card effects → manage UNO declaration → round winner → round score → optional next round → game complete at 500+ points.

## Turn Rules
The current player may play a legal card or draw. Wild cards can require color selection.

## Card Rules
A normal card matches active color, or matches the top card by number. Action cards match their action type when color does not match. Wild is always playable. Wild Draw Four is restricted when the player still has another card matching the active color.

## Special Rules
Reverse changes direction for games above two players; Skip advances past a player; Draw Two draws two; Wild and Wild Draw Four open a color-choice state.

## Scoring
Number cards: face value. Skip/Reverse/Draw Two: 20. Wild/Wild Draw Four: 50. The round winner receives the total point value of opponents' remaining cards. The match target is 500.

## Round Completion
A player reaching zero cards completes the round. The game becomes either `round-complete` or `game-complete` depending on the player's accumulated score.

## Game Completion
A player reaching 500 or more wins the match.

## Multiplayer Behaviour
Server owns active color, draw/discard piles, turn direction and UNO state.

## Reconnection Behaviour
Reconnect action and state recovery are implemented.

## Private Information
Each player's hand is private.

## Winning Condition
First accumulated score >= 500.

## Implementation Notes
UNO declaration and challenge are implemented through explicit actions; a failed UNO-call penalty draws two cards.
