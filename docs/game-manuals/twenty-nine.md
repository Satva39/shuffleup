# 29 / Twenty-Nine

## Overview
Four-player partnership trick-taking game using a 32-card deck, bidding, hidden trump reveal and target-score hand progression.

## Supported Players
Exactly 4 players. North/South are Team A; East/West are Team B.

## Objective
Win the bidding contract and collect enough card points.

## Deck / Cards
32 cards: J, 9, A, 10, K, Q, 8, 7 in each suit. Trick rank is J > 9 > A > 10 > K > Q > 8 > 7. Card points: J=3, 9=2, A=1, 10=1.

## Setup
Each player first receives four cards. The dealer rotates by hand. The auction starts from the seat left of dealer.

## Game Flow
Initial four-card deal → auction (16–28) → winning bidder selects hidden trump → remaining four cards are dealt → trick play → hand score → next hand.

## Turn Rules
Players must follow the led suit when able. The trick winner leads next.

## Card Rules
Trump, once revealed, beats non-trump. Before reveal it remains hidden from public state.

## Special Rules
Trump is selected privately by the winning bidder and is revealed when the implementation's reveal condition is met during play.

## Scoring
Card points won by the bidding team are compared with the bid. A made contract gives +1 game point; a failed contract gives -1 to the bidding team. The last trick adds one point to the hand total. Target score is 6.

## Round Completion
A hand ends after 8 tricks.

## Game Completion
A team reaches the configured target of 6 game points with a strictly higher score; the implementation leaves equal target scores unresolved.

## Multiplayer Behaviour
The server owns auction, trump, trick legality and scoring.

## Reconnection Behaviour
Reconnect/state events are implemented.

## Private Information
Opponent hands and hidden trump are private until the engine reveals the trump.

## Winning Condition
First team satisfying the implemented target rule.

## Implementation Notes
The exact auction/hidden-trump sequence is defined in `twentyNineEngine.js` and `twentyNineSocket.js`.
