# Satte Pe Satta

## Overview
A four-suit sequence-building game centered on the 7s, with round penalties and a 100-point game target.

## Supported Players
3–8 players.

## Objective
Empty your hand first. Players accumulate penalty points from cards remaining in their hands; the game ends when a player reaches the target threshold.

## Deck / Cards
Standard 52-card deck. Rows are built independently for spades, hearts, diamonds and clubs.

## Setup
The 7 of Hearts (`7-hearts`) is the mandatory opening card. It is automatically placed before the first player turn.

## Game Flow
Start from 7♥ → extend a suit row by adjacent ranks → when no legal move exists, pass → first player to empty hand ends the round → apply penalties → next round if needed.

## Turn Rules
A player may place any legal adjacent card. A pass is legal only when no legal move exists.

## Card Rules
A suit row opens with its 7. Once opened, only the immediate lower or immediate higher rank can be appended.

## Special Rules
Aces are the low end of the rank order in the implemented index. The starter 7♥ is removed from the holder's hand automatically.

## Scoring
The round winner receives 0 penalty points. Every other player adds the point value of each remaining card to their cumulative score. The game target is 100.

## Round Completion
Round completes when a player empties their hand.

## Game Completion
When any player reaches at least 100 points, the implementation completes the game and stores the ranking-derived winner.

## Multiplayer Behaviour
Server calculates legal moves, turn order, passes, penalties and ranking.

## Reconnection Behaviour
Reconnect/state handling is implemented.

## Private Information
Opponent hand identities are not broadcast except through permitted public counts/layout.

## Winning Condition
The game enters complete state when the target threshold is reached; the stored winner is the top-ranked player by the engine's score ordering.

## Implementation Notes
The project uses 7♥ as the explicit starter card and a 100-point target, rather than assuming another regional scoring convention.
