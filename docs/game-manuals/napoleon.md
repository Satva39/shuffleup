# Napoleon

## Overview
ShuffleUp implements a five-player Japanese Napoleon-style trick-taking variant defined directly in `napoleonRules.js`.

## Supported Players
Exactly 5 players.

## Objective
Win the bidding contract and collect enough scoring cards for the contract.

## Deck / Cards
Standard 52-card deck. Ten cards are dealt to each player and two cards form the blind.

## Setup
The game has 8 rounds. The dealer is tracked by seat index. The next seat begins bidding.

## Game Flow
Deal 10 each + blind → bid → winning bidder takes blind and discards two → call partner card → trick play → round scoring → next round.

## Turn Rules
Bids run sequentially; passed players cannot re-enter. Trick play advances in seat order and the trick winner leads the next trick.

## Card Rules
Players must follow the leading suit when able. First-trick comparison uses ordinary rank/trump behaviour. From trick two, special ranking enables Mighty (A♠), trump Jack, same-color sub-Jack, and Same Two behavior as defined in `napoleonRules.js`.

## Special Rules
Bid range is 11–20. Equal bid amounts are broken by suit order Clubs < Diamonds < Hearts < Spades. The bidder chooses a called card to identify the hidden partner. The bidder may play alone if no partner is identified/used by the implemented flow.

## Scoring
A/K/Q/J/10 are scoring cards, contributing 20 total points across the deck. For a bid below 20, contract succeeds when team points reach the bid while remaining below 20. A 20-point contract succeeds only with exactly 20. Score deltas and the solo/partner multipliers are implemented in `calculateScoreDeltas`.

## Round Completion
After 20 tricks/required card flow, team result is calculated and scores are applied.

## Game Completion
After the configured 8 rounds, final player scores determine the game result.

## Multiplayer Behaviour
The server controls bids, blind, called card, trump, special ranks and trick results.

## Reconnection Behaviour
Player connection state is tracked in the engine and socket layer.

## Private Information
Blind, called partner information and opponent hands are sanitized in public state.

## Winning Condition
Highest accumulated score after 8 rounds.

## Implementation Notes
The rules file explicitly documents this as the ShuffleUp implementation rather than a claim that every regional Napoleon ruleset is identical.
