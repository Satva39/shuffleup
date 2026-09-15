# Bridge

## Overview
ShuffleUp Bridge implements four-player Contract Bridge with partnership seating, auction, dummy reveal and server-side contract scoring.

## Supported Players
Exactly 4 players: North, East, South, West. North/South form one partnership; East/West form the other.

## Objective
Win tricks according to the final contract and earn contract score across completed deals.

## Deck / Cards
Standard 52-card deck, 13 cards per player.

## Setup
Each deal includes dealer and a 16-deal standard vulnerability cycle. The auction is level 1–7 across Clubs, Diamonds, Hearts, Spades and No Trump.

## Game Flow
Deal → auction → contract/double/redouble → opening lead → dummy reveal → trick play → score → optional next deal.

## Turn Rules
Bids must strictly increase in Bridge order. After a contract exists, three consecutive passes end the auction. During play, players must follow suit when possible.

## Card Rules
Trump beats non-trump; in No Trump, highest card of the led suit wins. Thirteen tricks are played per deal.

## Special Rules
Declarer is the first player of the declaring partnership to have bid the final strain. Dummy is declarer's partner and is revealed after the opening lead. Declarer controls dummy play through the server action path.

## Scoring
`calculateContractScore` implements contract trick values, part-score/game bonuses, slam bonuses, overtricks and undertricks with doubled/redoubled and vulnerability rules.

## Round Completion
The 13-trick deal is scored and becomes `deal-complete`/round-complete state.

## Game Completion
The inspected implementation does not define a fixed match target. A player may request the next deal through the Socket.IO next-deal flow.

## Multiplayer Behaviour
Public and private state separate hidden hands from visible dummy information.

## Reconnection Behaviour
Explicit reconnect/state requests are implemented.

## Private Information
Opponent hands are private; dummy becomes public only after the opening lead.

## Winning Condition
No fixed global match winner is implemented; deal results are authoritative.

## Implementation Notes
Vulnerability uses the standard 16-deal cycle implemented in `bridgeRules.js`.
