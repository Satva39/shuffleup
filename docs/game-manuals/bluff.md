# Bluff / Cheat

## Overview
Sequential-rank bluffing game with a six-second challenge window.

## Supported Players
2–6 players.

## Objective
Play all your cards without being forced to take the pile after a successful challenge.

## Deck / Cards
Standard 52-card deck.

## Setup
Cards are dealt round-robin. The required claim rank starts at Ace.

## Game Flow
Play 1–4 face-down cards → challenge window → resolve challenge or expire → next required rank → repeat.

## Turn Rules
A player claims the current required rank and may play truthfully or bluff. At most four cards may be played in one claim.

## Card Rules
Claim rank advances A → 2 → … → K → A. Opponents cannot see the normal face-down card identities.

## Special Rules
The challenge window is 6 seconds and the first valid challenge resolves it. A final empty-hand claim enters a final-challenge phase before victory is confirmed.

## Scoring
No numeric score. The penalty is taking the entire face-down pile.

## Round Completion
There is one continuous game; the claim/challenge cycle continues until a winner is confirmed.

## Game Completion
A player whose final claim survives challenge wins.

## Multiplayer Behaviour
The server owns claims, pile, challenge timing and truth evaluation.

## Reconnection Behaviour
Explicit reconnect and state request handling are implemented.

## Private Information
Unchallenged card identities remain private. A challenged claim's cards may be revealed in the result event.

## Winning Condition
Empty hand after the final claim is resolved truthfully.

## Implementation Notes
The engine uses `MAX_CARDS_PER_CLAIM = 4` and `CHALLENGE_WINDOW_MS = 6000`.
