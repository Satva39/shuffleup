# Spades

## Overview
Four-player partnership Spades with Nil bidding, bags and a 500-point target.

## Supported Players
Exactly 4 players. North/South are Team A; East/West are Team B.

## Objective
Meet the partnership bid while taking tricks and avoid accumulating excessive bags.

## Deck / Cards
Standard 52-card deck, 13 cards per player, 13 tricks per hand. Spades are always trump.

## Setup
Dealer and leader rotate by seat. Bidding occurs before trick play.

## Game Flow
Deal → one bid per player → 13 tricks → hand scoring → next hand until a team reaches the target.

## Turn Rules
Players must follow suit when able. A player who cannot follow may play another suit or a spade.

## Card Rules
Spades are trump. Spades cannot be led until broken unless the leader has only spades.

## Special Rules
Bid 0 is Nil. Nil succeeds for +100 when the Nil player takes zero tricks and fails for -100 otherwise. Nil players' actual tricks still contribute to the partnership trick total.

## Scoring
A made non-Nil contract scores 10×bid plus overtrick bags. A failed contract scores -10×bid. Bags accumulate across hands; each 10 bags causes a -100 penalty. Nil is scored separately. The game target is 500.

## Round Completion
A hand ends after 13 tricks and records team scores/bags.

## Game Completion
A team reaches 500. If both reach the target simultaneously, the higher score wins; exact tie continues.

## Multiplayer Behaviour
Server validates legal bids and card play.

## Reconnection Behaviour
Reconnect and state-request events are implemented.

## Private Information
Only the player's own hand is private; public trick/score information is broadcast.

## Winning Condition
First team to the configured 500-point threshold with the tie logic implemented in `gameWinner`.

## Implementation Notes
No blind-Nil option exists in the inspected rules.
