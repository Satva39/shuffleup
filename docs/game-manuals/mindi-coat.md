# Mindi Coat

## Overview
Four-player partnership trick-taking game with a hidden Hukum/trump card and Coat scoring.

## Supported Players
Exactly 4 players. North/South are Team A; East/West are Team B.

## Objective
Capture the four Tens and/or the most tricks, earn hand points, and reach 5 total points.

## Deck / Cards
Standard 52-card deck, four cards per suit rank set from 2 through Ace.

## Setup
Each player receives 13 cards. The player immediately clockwise from the dealer is the first leader and also the designated Hukum selector for the hand.

## Game Flow
Select a hidden Hukum card → trick play → optionally open Hukum when legal → hand result → next hand until 5 points.

## Turn Rules
Players must follow the led suit when able. The trick winner leads the next trick.

## Card Rules
Standard rank comparison within suit. Once Hukum is revealed, the revealed suit becomes trump.

## Special Rules
The selected Hukum card is removed from its selector's hand and kept hidden. Another player may open it only when they cannot follow the led suit, only on an existing trick, and not the player who originally hid it. On reveal, the Hukum card returns to its original owner's hand and its suit becomes trump.

## Scoring
The team with more captured Tens wins the hand; if Tens tie, more tricks wins. A Coat is taking all four Tens and scores 2 points. A normal hand win scores 1 point. The target is 5.

## Round Completion
A hand ends after 13 tricks.

## Game Completion
A team reaching 5 total points wins.

## Multiplayer Behaviour
The server owns the hidden Hukum card, trump reveal and trick legality.

## Reconnection Behaviour
Explicit reconnect/state events exist.

## Private Information
The Hukum card and its identity are private until opened.

## Winning Condition
First team to 5 points.

## Implementation Notes
The rules module labels the implementation `closed-trump`; the hidden-card behaviour above is taken directly from the engine.
