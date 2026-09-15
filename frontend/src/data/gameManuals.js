export const gameManuals = {
    "kachuful": {
        "id": "kachuful",
        "title": "Kachuful",
        "sections": [
            {
                "heading": "Overview",
                "body": "Implemented server rules define Kachuful as a variable-round trick-taking game."
            },
            {
                "heading": "Supported Players",
                "body": "4–10 players."
            },
            {
                "heading": "Objective",
                "body": "Score points by predicting the exact number of tricks you will win."
            },
            {
                "heading": "Deck / Cards",
                "body": "One standard 52-card deck. Player count determines the maximum number of cards per round: the server plays `floor(52 / playerCount)` rounds, with round card count increasing from 1 up to that maximum."
            },
            {
                "heading": "Setup",
                "body": "The server deals one card per player in round 1. Later rounds use one additional card per player. The dealer starts at seat/index 0 and rotates each round."
            },
            {
                "heading": "Game Flow",
                "body": "Each round: deal → private bid → bids reveal when all players bid → trick play → round scoring → next round."
            },
            {
                "heading": "Turn Rules",
                "body": "The player left of the dealer starts the round's bidding and first trick. Trick turns proceed around the room."
            },
            {
                "heading": "Card Rules",
                "body": "Players must follow the leading suit when able. Otherwise any card may be played. The round trump rotates through Spades, Diamonds, Clubs, Hearts."
            },
            {
                "heading": "Special Rules",
                "body": "The trump suit is round-dependent and is not a player choice."
            },
            {
                "heading": "Scoring",
                "body": "An exact bid is worth `10 + bid`. A non-exact bid scores 0 for that round."
            },
            {
                "heading": "Round Completion",
                "body": "All cards are played; each player's `tricksWon` is compared with their bid and the round score is added to their cumulative score."
            },
            {
                "heading": "Game Completion",
                "body": "The engine runs through all `floor(52 / playerCount)` rounds and then selects the game result according to the final scores."
            },
            {
                "heading": "Multiplayer Behaviour",
                "body": "The server owns bids, hands, turn order, trick resolution and scores."
            },
            {
                "heading": "Reconnection Behaviour",
                "body": "Kachuful tracks player socket connection state and emits current game state to the reconnecting player."
            },
            {
                "heading": "Private Information",
                "body": "Player cards and hidden pre-reveal state are sanitized through public/private state functions."
            },
            {
                "heading": "Winning Condition",
                "body": "The engine's winner is determined from cumulative scores after the final round."
            },
            {
                "heading": "Implementation Notes",
                "body": "This manual intentionally follows the code's exact trump order and scoring rather than substituting another regional Kachuful ruleset."
            }
        ]
    },
    "teen-patti": {
        "id": "teen-patti",
        "title": "Teen Patti",
        "sections": [
            {
                "heading": "Overview",
                "body": "The implementation is a 3-card comparison game played over exactly 11 rounds. It is an in-game points system only; no betting or real-money wagering is implemented."
            },
            {
                "heading": "Supported Players",
                "body": "3–6 players."
            },
            {
                "heading": "Objective",
                "body": "Win individual rounds and accumulate the highest round-win score across 11 rounds."
            },
            {
                "heading": "Deck / Cards",
                "body": "Standard 52-card deck. Each player receives three cards."
            },
            {
                "heading": "Setup",
                "body": "Dealer is initially player index 0; the first active player is the next seat."
            },
            {
                "heading": "Game Flow",
                "body": "Deal 3 cards → sequential actions → round winner → optional explicit next round → after round 11, final standings."
            },
            {
                "heading": "Turn Rules",
                "body": "A player may `fold` or `play`. Each active player acts once. If only one active player remains, that player wins the round. If all active players have acted without a single survivor, the server resolves the round by showdown."
            },
            {
                "heading": "Card Rules",
                "body": "Hand ranking is: High Card < Pair < Color < Sequence < Pure Sequence < Trail. The engine compares the evaluated 3-card hands server-side."
            },
            {
                "heading": "Special Rules",
                "body": "A folded player is not considered during the remaining round."
            },
            {
                "heading": "Scoring",
                "body": "Each round win adds 1 point to the winner. No betting amount or currency exists."
            },
            {
                "heading": "Round Completion",
                "body": "The winning hand/remaining active player is recorded and the status becomes `round-complete` until someone starts the next round. The final round transitions the game to `complete`."
            },
            {
                "heading": "Game Completion",
                "body": "After 11 rounds, the highest round score wins; seat order breaks a score tie."
            },
            {
                "heading": "Multiplayer Behaviour",
                "body": "All authoritative actions are validated by the server."
            },
            {
                "heading": "Reconnection Behaviour",
                "body": "The engine and socket module track disconnected players and support an explicit reconnect event."
            },
            {
                "heading": "Private Information",
                "body": "Private state contains the player's own three cards; public state does not expose opponents' hidden cards."
            },
            {
                "heading": "Winning Condition",
                "body": "Highest score after 11 rounds."
            },
            {
                "heading": "Implementation Notes",
                "body": "The source implements no betting/chip/pot system, so none is documented here."
            }
        ]
    },
    "indian-rummy": {
        "id": "indian-rummy",
        "title": "Indian Rummy",
        "sections": [
            {
                "heading": "Overview",
                "body": "Server implementation of a 13-card Indian Rummy hand with declaration-based completion."
            },
            {
                "heading": "Supported Players",
                "body": "2–6 players."
            },
            {
                "heading": "Objective",
                "body": "Declare a valid 13-card grouping containing at least one pure sequence and at least two sequences."
            },
            {
                "heading": "Deck / Cards",
                "body": "Two standard 52-card decks plus two printed Jokers (106 cards total). Each player receives 13 cards."
            },
            {
                "heading": "Setup",
                "body": "A random non-printed card rank is chosen as the wild-joker rank. Players are dealt 13 cards. One further card starts the discard pile; the rest form the closed/draw pile."
            },
            {
                "heading": "Game Flow",
                "body": "Draw from closed deck or discard pile → form groups in hand → discard one card. A player can attempt declaration after drawing."
            },
            {
                "heading": "Turn Rules",
                "body": "A player draws at most once, must discard before ending the turn, and turns advance to the next active player."
            },
            {
                "heading": "Card Rules",
                "body": "A sequence is same-suit consecutive cards; a set is same-rank cards of different suits. The selected wild-joker rank and printed Jokers act as jokers in grouping validation."
            },
            {
                "heading": "Special Rules",
                "body": "Declaration removes one selected card from the 14-card post-draw hand before the server validates the remaining 13 cards."
            },
            {
                "heading": "Scoring",
                "body": "The declarer scores 0. Other players receive deadwood penalties based on the best partial grouping, capped at 80 points. Joker-valued deadwood contributes 0."
            },
            {
                "heading": "Round Completion",
                "body": "A valid declaration immediately sets game status to `complete`."
            },
            {
                "heading": "Game Completion",
                "body": "The declaring player is the winner."
            },
            {
                "heading": "Multiplayer Behaviour",
                "body": "The server validates turn, card ownership, draw/discard order and declaration groups."
            },
            {
                "heading": "Reconnection Behaviour",
                "body": "The game tracks disconnect/reconnect and can return private state to the reconnecting player."
            },
            {
                "heading": "Private Information",
                "body": "Hands are private; public state exposes only sanitized card information."
            },
            {
                "heading": "Winning Condition",
                "body": "First valid declaration."
            },
            {
                "heading": "Implementation Notes",
                "body": "This is the implemented one-hand declaration model, not a multi-round chip-scoring rummy tournament."
            }
        ]
    },
    "mangoose": {
        "id": "mangoose",
        "title": "Mangoose",
        "sections": [
            {
                "heading": "Overview",
                "body": "Mangoose is a shedding/placement game built around personal closed/open piles and four suit-specific center foundations."
            },
            {
                "heading": "Supported Players",
                "body": "2–12 players."
            },
            {
                "heading": "Objective",
                "body": "Reduce your own card piles to zero. The first player to empty their cards becomes the winner; game completion is then checked."
            },
            {
                "heading": "Deck / Cards",
                "body": "One standard 52-card deck."
            },
            {
                "heading": "Setup",
                "body": "Cards are dealt round-robin into each player's closed pile. Four empty center stacks exist, one for each suit."
            },
            {
                "heading": "Game Flow",
                "body": "Flip a card → choose a legal destination → continue the turn or advance. Cards may also be played from the top of an open pile."
            },
            {
                "heading": "Turn Rules",
                "body": "Actions include flip, play to center, play to opponent, play to own open pile and call Mongoose."
            },
            {
                "heading": "Card Rules",
                "body": "Center stack: its first card must be that suit's Ace; later cards must be exactly one rank above/below the top card of the same suit. Opponent open piles accept only the immediately ascending rank; suit is irrelevant."
            },
            {
                "heading": "Special Rules",
                "body": "When a player puts a card onto their own open pile while another legal destination existed, a 3-second Mongoose call window opens. A successful Mongoose call applies a penalty by transferring one closed-pile card from each eligible other player to the offending player."
            },
            {
                "heading": "Scoring",
                "body": "There is no separate numeric score. The engine tracks finishing/winner status and remaining card counts."
            },
            {
                "heading": "Round Completion",
                "body": "Players may finish individually; the engine advances turns and continues until game completion."
            },
            {
                "heading": "Game Completion",
                "body": "The engine finishes when only one eligible player still has cards after winners/finished players are excluded."
            },
            {
                "heading": "Multiplayer Behaviour",
                "body": "Legal targets and all penalties are decided server-side."
            },
            {
                "heading": "Reconnection Behaviour",
                "body": "Player connection state and explicit reconnect handling are implemented in the game module."
            },
            {
                "heading": "Private Information",
                "body": "Opponents do not receive the identities of hidden closed-pile cards."
            },
            {
                "heading": "Winning Condition",
                "body": "Being the final eligible player in the engine's completion state, with earlier individual finishes retained as standings."
            },
            {
                "heading": "Implementation Notes",
                "body": "The implementation uses exact adjacency for center stacks and exact ascending rank for opponent open piles; those suit/rank constraints are the ShuffleUp source of truth."
            }
        ]
    },
    "uno": {
        "id": "uno",
        "title": "UNO",
        "sections": [
            {
                "heading": "Overview",
                "body": "UNO is a 2–12 player multi-round game with a 500-point match target."
            },
            {
                "heading": "Supported Players",
                "body": "2–12 players."
            },
            {
                "heading": "Objective",
                "body": "Win rounds by emptying your hand and accumulate at least 500 total points."
            },
            {
                "heading": "Deck / Cards",
                "body": "108-card UNO deck: four colors, number cards, Skip, Reverse, Draw Two, four Wild and four Wild Draw Four."
            },
            {
                "heading": "Setup",
                "body": "Each player receives seven cards. A non-wild opening discard is selected. Starting-player effects for Reverse, Skip and Draw Two are resolved by the server."
            },
            {
                "heading": "Game Flow",
                "body": "Play/draw → apply special card effects → manage UNO declaration → round winner → round score → optional next round → game complete at 500+ points."
            },
            {
                "heading": "Turn Rules",
                "body": "The current player may play a legal card or draw. Wild cards can require color selection."
            },
            {
                "heading": "Card Rules",
                "body": "A normal card matches active color, or matches the top card by number. Action cards match their action type when color does not match. Wild is always playable. Wild Draw Four is restricted when the player still has another card matching the active color."
            },
            {
                "heading": "Special Rules",
                "body": "Reverse changes direction for games above two players; Skip advances past a player; Draw Two draws two; Wild and Wild Draw Four open a color-choice state."
            },
            {
                "heading": "Scoring",
                "body": "Number cards: face value. Skip/Reverse/Draw Two: 20. Wild/Wild Draw Four: 50. The round winner receives the total point value of opponents' remaining cards. The match target is 500."
            },
            {
                "heading": "Round Completion",
                "body": "A player reaching zero cards completes the round. The game becomes either `round-complete` or `game-complete` depending on the player's accumulated score."
            },
            {
                "heading": "Game Completion",
                "body": "A player reaching 500 or more wins the match."
            },
            {
                "heading": "Multiplayer Behaviour",
                "body": "Server owns active color, draw/discard piles, turn direction and UNO state."
            },
            {
                "heading": "Reconnection Behaviour",
                "body": "Reconnect action and state recovery are implemented."
            },
            {
                "heading": "Private Information",
                "body": "Each player's hand is private."
            },
            {
                "heading": "Winning Condition",
                "body": "First accumulated score >= 500."
            },
            {
                "heading": "Implementation Notes",
                "body": "UNO declaration and challenge are implemented through explicit actions; a failed UNO-call penalty draws two cards."
            }
        ]
    },
    "jack-thief": {
        "id": "jack-thief",
        "title": "Jack Thief / Old Maid / Gaddha Chor",
        "sections": [
            {
                "heading": "Overview",
                "body": "A pair-removal and hidden-draw elimination game. The only unmatched card is the Jack of Hearts."
            },
            {
                "heading": "Supported Players",
                "body": "2–8 players at room level; the engine itself accepts 2–12."
            },
            {
                "heading": "Objective",
                "body": "Remove all same-rank pairs and avoid being the final player holding the unmatched Jack of Hearts."
            },
            {
                "heading": "Deck / Cards",
                "body": "Standard 52-card ranks and suits, except `JH` is removed before dealing as the special unmatched card definition used by the engine. The remaining deck is dealt round-robin."
            },
            {
                "heading": "Setup",
                "body": "The server shuffles, deals, then immediately removes all possible same-rank pairs from every hand. The first eligible player starts."
            },
            {
                "heading": "Game Flow",
                "body": "Draw one hidden card from the next active player → add to your hand → remove newly formed same-rank pairs → continue clockwise through active players."
            },
            {
                "heading": "Turn Rules",
                "body": "A player may draw only from the next active player and chooses a hidden card position. A turn timeout is 18 seconds; the server can perform the automatic draw path when a player fails to act."
            },
            {
                "heading": "Card Rules",
                "body": "A pair is any two cards of the same rank. Suits do not matter for pairing."
            },
            {
                "heading": "Special Rules",
                "body": "Players who have no cards are marked finished. Elimination order is retained. The final remaining Jack is the loser."
            },
            {
                "heading": "Scoring",
                "body": "No numeric score; outcome is placement/elimination based."
            },
            {
                "heading": "Round Completion",
                "body": "The round is complete when only one card remains and it is a Jack."
            },
            {
                "heading": "Game Completion",
                "body": "The player holding the final Jack is marked loser and the game becomes complete."
            },
            {
                "heading": "Multiplayer Behaviour",
                "body": "The server knows hidden card identities; clients receive only permitted state."
            },
            {
                "heading": "Reconnection Behaviour",
                "body": "The game tracks connected/disconnected status and provides a reconnect event."
            },
            {
                "heading": "Private Information",
                "body": "A target player's exact card identities are hidden; the drawer chooses an index only."
            },
            {
                "heading": "Winning Condition",
                "body": "Avoid the final unmatched Jack; players who finish earlier are ranked ahead of the loser."
            },
            {
                "heading": "Implementation Notes",
                "body": "The server rules use `JH` as the special removed/unmatched card and same-rank matching for every other pair."
            }
        ]
    },
    "napoleon": {
        "id": "napoleon",
        "title": "Napoleon",
        "sections": [
            {
                "heading": "Overview",
                "body": "ShuffleUp implements a five-player Japanese Napoleon-style trick-taking variant defined directly in `napoleonRules.js`."
            },
            {
                "heading": "Supported Players",
                "body": "Exactly 5 players."
            },
            {
                "heading": "Objective",
                "body": "Win the bidding contract and collect enough scoring cards for the contract."
            },
            {
                "heading": "Deck / Cards",
                "body": "Standard 52-card deck. Ten cards are dealt to each player and two cards form the blind."
            },
            {
                "heading": "Setup",
                "body": "The game has 8 rounds. The dealer is tracked by seat index. The next seat begins bidding."
            },
            {
                "heading": "Game Flow",
                "body": "Deal 10 each + blind → bid → winning bidder takes blind and discards two → call partner card → trick play → round scoring → next round."
            },
            {
                "heading": "Turn Rules",
                "body": "Bids run sequentially; passed players cannot re-enter. Trick play advances in seat order and the trick winner leads the next trick."
            },
            {
                "heading": "Card Rules",
                "body": "Players must follow the leading suit when able. First-trick comparison uses ordinary rank/trump behaviour. From trick two, special ranking enables Mighty (A♠), trump Jack, same-color sub-Jack, and Same Two behavior as defined in `napoleonRules.js`."
            },
            {
                "heading": "Special Rules",
                "body": "Bid range is 11–20. Equal bid amounts are broken by suit order Clubs < Diamonds < Hearts < Spades. The bidder chooses a called card to identify the hidden partner. The bidder may play alone if no partner is identified/used by the implemented flow."
            },
            {
                "heading": "Scoring",
                "body": "A/K/Q/J/10 are scoring cards, contributing 20 total points across the deck. For a bid below 20, contract succeeds when team points reach the bid while remaining below 20. A 20-point contract succeeds only with exactly 20. Score deltas and the solo/partner multipliers are implemented in `calculateScoreDeltas`."
            },
            {
                "heading": "Round Completion",
                "body": "After 20 tricks/required card flow, team result is calculated and scores are applied."
            },
            {
                "heading": "Game Completion",
                "body": "After the configured 8 rounds, final player scores determine the game result."
            },
            {
                "heading": "Multiplayer Behaviour",
                "body": "The server controls bids, blind, called card, trump, special ranks and trick results."
            },
            {
                "heading": "Reconnection Behaviour",
                "body": "Player connection state is tracked in the engine and socket layer."
            },
            {
                "heading": "Private Information",
                "body": "Blind, called partner information and opponent hands are sanitized in public state."
            },
            {
                "heading": "Winning Condition",
                "body": "Highest accumulated score after 8 rounds."
            },
            {
                "heading": "Implementation Notes",
                "body": "The rules file explicitly documents this as the ShuffleUp implementation rather than a claim that every regional Napoleon ruleset is identical."
            }
        ]
    },
    "bridge": {
        "id": "bridge",
        "title": "Bridge",
        "sections": [
            {
                "heading": "Overview",
                "body": "ShuffleUp Bridge implements four-player Contract Bridge with partnership seating, auction, dummy reveal and server-side contract scoring."
            },
            {
                "heading": "Supported Players",
                "body": "Exactly 4 players: North, East, South, West. North/South form one partnership; East/West form the other."
            },
            {
                "heading": "Objective",
                "body": "Win tricks according to the final contract and earn contract score across completed deals."
            },
            {
                "heading": "Deck / Cards",
                "body": "Standard 52-card deck, 13 cards per player."
            },
            {
                "heading": "Setup",
                "body": "Each deal includes dealer and a 16-deal standard vulnerability cycle. The auction is level 1–7 across Clubs, Diamonds, Hearts, Spades and No Trump."
            },
            {
                "heading": "Game Flow",
                "body": "Deal → auction → contract/double/redouble → opening lead → dummy reveal → trick play → score → optional next deal."
            },
            {
                "heading": "Turn Rules",
                "body": "Bids must strictly increase in Bridge order. After a contract exists, three consecutive passes end the auction. During play, players must follow suit when possible."
            },
            {
                "heading": "Card Rules",
                "body": "Trump beats non-trump; in No Trump, highest card of the led suit wins. Thirteen tricks are played per deal."
            },
            {
                "heading": "Special Rules",
                "body": "Declarer is the first player of the declaring partnership to have bid the final strain. Dummy is declarer's partner and is revealed after the opening lead. Declarer controls dummy play through the server action path."
            },
            {
                "heading": "Scoring",
                "body": "`calculateContractScore` implements contract trick values, part-score/game bonuses, slam bonuses, overtricks and undertricks with doubled/redoubled and vulnerability rules."
            },
            {
                "heading": "Round Completion",
                "body": "The 13-trick deal is scored and becomes `deal-complete`/round-complete state."
            },
            {
                "heading": "Game Completion",
                "body": "The inspected implementation does not define a fixed match target. A player may request the next deal through the Socket.IO next-deal flow."
            },
            {
                "heading": "Multiplayer Behaviour",
                "body": "Public and private state separate hidden hands from visible dummy information."
            },
            {
                "heading": "Reconnection Behaviour",
                "body": "Explicit reconnect/state requests are implemented."
            },
            {
                "heading": "Private Information",
                "body": "Opponent hands are private; dummy becomes public only after the opening lead."
            },
            {
                "heading": "Winning Condition",
                "body": "No fixed global match winner is implemented; deal results are authoritative."
            },
            {
                "heading": "Implementation Notes",
                "body": "Vulnerability uses the standard 16-deal cycle implemented in `bridgeRules.js`."
            }
        ]
    },
    "spades": {
        "id": "spades",
        "title": "Spades",
        "sections": [
            {
                "heading": "Overview",
                "body": "Four-player partnership Spades with Nil bidding, bags and a 500-point target."
            },
            {
                "heading": "Supported Players",
                "body": "Exactly 4 players. North/South are Team A; East/West are Team B."
            },
            {
                "heading": "Objective",
                "body": "Meet the partnership bid while taking tricks and avoid accumulating excessive bags."
            },
            {
                "heading": "Deck / Cards",
                "body": "Standard 52-card deck, 13 cards per player, 13 tricks per hand. Spades are always trump."
            },
            {
                "heading": "Setup",
                "body": "Dealer and leader rotate by seat. Bidding occurs before trick play."
            },
            {
                "heading": "Game Flow",
                "body": "Deal → one bid per player → 13 tricks → hand scoring → next hand until a team reaches the target."
            },
            {
                "heading": "Turn Rules",
                "body": "Players must follow suit when able. A player who cannot follow may play another suit or a spade."
            },
            {
                "heading": "Card Rules",
                "body": "Spades are trump. Spades cannot be led until broken unless the leader has only spades."
            },
            {
                "heading": "Special Rules",
                "body": "Bid 0 is Nil. Nil succeeds for +100 when the Nil player takes zero tricks and fails for -100 otherwise. Nil players' actual tricks still contribute to the partnership trick total."
            },
            {
                "heading": "Scoring",
                "body": "A made non-Nil contract scores 10×bid plus overtrick bags. A failed contract scores -10×bid. Bags accumulate across hands; each 10 bags causes a -100 penalty. Nil is scored separately. The game target is 500."
            },
            {
                "heading": "Round Completion",
                "body": "A hand ends after 13 tricks and records team scores/bags."
            },
            {
                "heading": "Game Completion",
                "body": "A team reaches 500. If both reach the target simultaneously, the higher score wins; exact tie continues."
            },
            {
                "heading": "Multiplayer Behaviour",
                "body": "Server validates legal bids and card play."
            },
            {
                "heading": "Reconnection Behaviour",
                "body": "Reconnect and state-request events are implemented."
            },
            {
                "heading": "Private Information",
                "body": "Only the player's own hand is private; public trick/score information is broadcast."
            },
            {
                "heading": "Winning Condition",
                "body": "First team to the configured 500-point threshold with the tie logic implemented in `gameWinner`."
            },
            {
                "heading": "Implementation Notes",
                "body": "No blind-Nil option exists in the inspected rules."
            }
        ]
    },
    "twenty-nine": {
        "id": "twenty-nine",
        "title": "29 / Twenty-Nine",
        "sections": [
            {
                "heading": "Overview",
                "body": "Four-player partnership trick-taking game using a 32-card deck, bidding, hidden trump reveal and target-score hand progression."
            },
            {
                "heading": "Supported Players",
                "body": "Exactly 4 players. North/South are Team A; East/West are Team B."
            },
            {
                "heading": "Objective",
                "body": "Win the bidding contract and collect enough card points."
            },
            {
                "heading": "Deck / Cards",
                "body": "32 cards: J, 9, A, 10, K, Q, 8, 7 in each suit. Trick rank is J > 9 > A > 10 > K > Q > 8 > 7. Card points: J=3, 9=2, A=1, 10=1."
            },
            {
                "heading": "Setup",
                "body": "Each player first receives four cards. The dealer rotates by hand. The auction starts from the seat left of dealer."
            },
            {
                "heading": "Game Flow",
                "body": "Initial four-card deal → auction (16–28) → winning bidder selects hidden trump → remaining four cards are dealt → trick play → hand score → next hand."
            },
            {
                "heading": "Turn Rules",
                "body": "Players must follow the led suit when able. The trick winner leads next."
            },
            {
                "heading": "Card Rules",
                "body": "Trump, once revealed, beats non-trump. Before reveal it remains hidden from public state."
            },
            {
                "heading": "Special Rules",
                "body": "Trump is selected privately by the winning bidder and is revealed when the implementation's reveal condition is met during play."
            },
            {
                "heading": "Scoring",
                "body": "Card points won by the bidding team are compared with the bid. A made contract gives +1 game point; a failed contract gives -1 to the bidding team. The last trick adds one point to the hand total. Target score is 6."
            },
            {
                "heading": "Round Completion",
                "body": "A hand ends after 8 tricks."
            },
            {
                "heading": "Game Completion",
                "body": "A team reaches the configured target of 6 game points with a strictly higher score; the implementation leaves equal target scores unresolved."
            },
            {
                "heading": "Multiplayer Behaviour",
                "body": "The server owns auction, trump, trick legality and scoring."
            },
            {
                "heading": "Reconnection Behaviour",
                "body": "Reconnect/state events are implemented."
            },
            {
                "heading": "Private Information",
                "body": "Opponent hands and hidden trump are private until the engine reveals the trump."
            },
            {
                "heading": "Winning Condition",
                "body": "First team satisfying the implemented target rule."
            },
            {
                "heading": "Implementation Notes",
                "body": "The exact auction/hidden-trump sequence is defined in `twentyNineEngine.js` and `twentyNineSocket.js`."
            }
        ]
    },
    "mindi-coat": {
        "id": "mindi-coat",
        "title": "Mindi Coat",
        "sections": [
            {
                "heading": "Overview",
                "body": "Four-player partnership trick-taking game with a hidden Hukum/trump card and Coat scoring."
            },
            {
                "heading": "Supported Players",
                "body": "Exactly 4 players. North/South are Team A; East/West are Team B."
            },
            {
                "heading": "Objective",
                "body": "Capture the four Tens and/or the most tricks, earn hand points, and reach 5 total points."
            },
            {
                "heading": "Deck / Cards",
                "body": "Standard 52-card deck, four cards per suit rank set from 2 through Ace."
            },
            {
                "heading": "Setup",
                "body": "Each player receives 13 cards. The player immediately clockwise from the dealer is the first leader and also the designated Hukum selector for the hand."
            },
            {
                "heading": "Game Flow",
                "body": "Select a hidden Hukum card → trick play → optionally open Hukum when legal → hand result → next hand until 5 points."
            },
            {
                "heading": "Turn Rules",
                "body": "Players must follow the led suit when able. The trick winner leads the next trick."
            },
            {
                "heading": "Card Rules",
                "body": "Standard rank comparison within suit. Once Hukum is revealed, the revealed suit becomes trump."
            },
            {
                "heading": "Special Rules",
                "body": "The selected Hukum card is removed from its selector's hand and kept hidden. Another player may open it only when they cannot follow the led suit, only on an existing trick, and not the player who originally hid it. On reveal, the Hukum card returns to its original owner's hand and its suit becomes trump."
            },
            {
                "heading": "Scoring",
                "body": "The team with more captured Tens wins the hand; if Tens tie, more tricks wins. A Coat is taking all four Tens and scores 2 points. A normal hand win scores 1 point. The target is 5."
            },
            {
                "heading": "Round Completion",
                "body": "A hand ends after 13 tricks."
            },
            {
                "heading": "Game Completion",
                "body": "A team reaching 5 total points wins."
            },
            {
                "heading": "Multiplayer Behaviour",
                "body": "The server owns the hidden Hukum card, trump reveal and trick legality."
            },
            {
                "heading": "Reconnection Behaviour",
                "body": "Explicit reconnect/state events exist."
            },
            {
                "heading": "Private Information",
                "body": "The Hukum card and its identity are private until opened."
            },
            {
                "heading": "Winning Condition",
                "body": "First team to 5 points."
            },
            {
                "heading": "Implementation Notes",
                "body": "The rules module labels the implementation `closed-trump`; the hidden-card behaviour above is taken directly from the engine."
            }
        ]
    },
    "bluff": {
        "id": "bluff",
        "title": "Bluff / Cheat",
        "sections": [
            {
                "heading": "Overview",
                "body": "Sequential-rank bluffing game with a six-second challenge window."
            },
            {
                "heading": "Supported Players",
                "body": "2–6 players."
            },
            {
                "heading": "Objective",
                "body": "Play all your cards without being forced to take the pile after a successful challenge."
            },
            {
                "heading": "Deck / Cards",
                "body": "Standard 52-card deck."
            },
            {
                "heading": "Setup",
                "body": "Cards are dealt round-robin. The required claim rank starts at Ace."
            },
            {
                "heading": "Game Flow",
                "body": "Play 1–4 face-down cards → challenge window → resolve challenge or expire → next required rank → repeat."
            },
            {
                "heading": "Turn Rules",
                "body": "A player claims the current required rank and may play truthfully or bluff. At most four cards may be played in one claim."
            },
            {
                "heading": "Card Rules",
                "body": "Claim rank advances A → 2 → … → K → A. Opponents cannot see the normal face-down card identities."
            },
            {
                "heading": "Special Rules",
                "body": "The challenge window is 6 seconds and the first valid challenge resolves it. A final empty-hand claim enters a final-challenge phase before victory is confirmed."
            },
            {
                "heading": "Scoring",
                "body": "No numeric score. The penalty is taking the entire face-down pile."
            },
            {
                "heading": "Round Completion",
                "body": "There is one continuous game; the claim/challenge cycle continues until a winner is confirmed."
            },
            {
                "heading": "Game Completion",
                "body": "A player whose final claim survives challenge wins."
            },
            {
                "heading": "Multiplayer Behaviour",
                "body": "The server owns claims, pile, challenge timing and truth evaluation."
            },
            {
                "heading": "Reconnection Behaviour",
                "body": "Explicit reconnect and state request handling are implemented."
            },
            {
                "heading": "Private Information",
                "body": "Unchallenged card identities remain private. A challenged claim's cards may be revealed in the result event."
            },
            {
                "heading": "Winning Condition",
                "body": "Empty hand after the final claim is resolved truthfully."
            },
            {
                "heading": "Implementation Notes",
                "body": "The engine uses `MAX_CARDS_PER_CLAIM = 4` and `CHALLENGE_WINDOW_MS = 6000`."
            }
        ]
    },
    "satte-pe-satta": {
        "id": "satte-pe-satta",
        "title": "Satte Pe Satta",
        "sections": [
            {
                "heading": "Overview",
                "body": "A four-suit sequence-building game centered on the 7s, with round penalties and a 100-point game target."
            },
            {
                "heading": "Supported Players",
                "body": "3–8 players."
            },
            {
                "heading": "Objective",
                "body": "Empty your hand first. Players accumulate penalty points from cards remaining in their hands; the game ends when a player reaches the target threshold."
            },
            {
                "heading": "Deck / Cards",
                "body": "Standard 52-card deck. Rows are built independently for spades, hearts, diamonds and clubs."
            },
            {
                "heading": "Setup",
                "body": "The 7 of Hearts (`7-hearts`) is the mandatory opening card. It is automatically placed before the first player turn."
            },
            {
                "heading": "Game Flow",
                "body": "Start from 7♥ → extend a suit row by adjacent ranks → when no legal move exists, pass → first player to empty hand ends the round → apply penalties → next round if needed."
            },
            {
                "heading": "Turn Rules",
                "body": "A player may place any legal adjacent card. A pass is legal only when no legal move exists."
            },
            {
                "heading": "Card Rules",
                "body": "A suit row opens with its 7. Once opened, only the immediate lower or immediate higher rank can be appended."
            },
            {
                "heading": "Special Rules",
                "body": "Aces are the low end of the rank order in the implemented index. The starter 7♥ is removed from the holder's hand automatically."
            },
            {
                "heading": "Scoring",
                "body": "The round winner receives 0 penalty points. Every other player adds the point value of each remaining card to their cumulative score. The game target is 100."
            },
            {
                "heading": "Round Completion",
                "body": "Round completes when a player empties their hand."
            },
            {
                "heading": "Game Completion",
                "body": "When any player reaches at least 100 points, the implementation completes the game and stores the ranking-derived winner."
            },
            {
                "heading": "Multiplayer Behaviour",
                "body": "Server calculates legal moves, turn order, passes, penalties and ranking."
            },
            {
                "heading": "Reconnection Behaviour",
                "body": "Reconnect/state handling is implemented."
            },
            {
                "heading": "Private Information",
                "body": "Opponent hand identities are not broadcast except through permitted public counts/layout."
            },
            {
                "heading": "Winning Condition",
                "body": "The game enters complete state when the target threshold is reached; the stored winner is the top-ranked player by the engine's score ordering."
            },
            {
                "heading": "Implementation Notes",
                "body": "The project uses 7♥ as the explicit starter card and a 100-point target, rather than assuming another regional scoring convention."
            }
        ]
    },
    "war": {
        "id": "war",
        "title": "War",
        "sections": [
            {
                "heading": "Overview",
                "body": "Two-player War with explicit server-controlled battles and recursive War resolution."
            },
            {
                "heading": "Supported Players",
                "body": "Exactly 2 real players."
            },
            {
                "heading": "Objective",
                "body": "Take all available cards and be the last player with cards."
            },
            {
                "heading": "Deck / Cards",
                "body": "Standard 52-card deck. Rank order is 2 through Ace. Suits do not break ties."
            },
            {
                "heading": "Setup",
                "body": "The server shuffles and deals 26 cards to each player."
            },
            {
                "heading": "Game Flow",
                "body": "Start battle → each active player reveals one face-up card → higher rank wins the battle pile → tied ranks start War → repeat until a winner is resolved → next battle."
            },
            {
                "heading": "Turn Rules",
                "body": "The battle is initiated through the server's `war:start-battle` event. Card reveals and delays are server-driven."
            },
            {
                "heading": "Card Rules",
                "body": "Highest rank wins. Aces are high."
            },
            {
                "heading": "Special Rules",
                "body": "On a tie, each tied player places one face-down card when available and then a new face-up comparison card. Further ties repeat the War procedure."
            },
            {
                "heading": "Scoring",
                "body": "No numeric score. The currency is card ownership."
            },
            {
                "heading": "Round Completion",
                "body": "A battle completes when its comparison resolves."
            },
            {
                "heading": "Game Completion",
                "body": "A player with no remaining cards is eliminated. The game completes when only one player remains eligible. The engine also records simultaneous exhaustion as a draw result where applicable."
            },
            {
                "heading": "Multiplayer Behaviour",
                "body": "The server owns deck order, battle pile, reveals and card transfer."
            },
            {
                "heading": "Reconnection Behaviour",
                "body": "Reconnect and state requests are implemented."
            },
            {
                "heading": "Private Information",
                "body": "Opponent draw-pile order remains private; public state exposes only permitted card/battle data."
            },
            {
                "heading": "Winning Condition",
                "body": "Last player with cards."
            },
            {
                "heading": "Implementation Notes",
                "body": "Reveal timing constants are 850 ms for the main battle reveal, 700 ms for War reveal and 1100 ms before the next battle."
            }
        ]
    },
    "solitaire": {
        "id": "solitaire",
        "title": "Solitaire Multiplayer",
        "sections": [
            {
                "heading": "Overview",
                "body": "Competitive multiplayer Klondike-style Solitaire. Each player solves an independent board while the server compares progress."
            },
            {
                "heading": "Supported Players",
                "body": "2–8 real players."
            },
            {
                "heading": "Objective",
                "body": "Move all 52 cards into the four foundations before the competition ends."
            },
            {
                "heading": "Deck / Cards",
                "body": "Each player receives a separate standard 52-card deck."
            },
            {
                "heading": "Setup",
                "body": "Seven tableau columns contain 1–7 cards. Only each column's top card starts face-up. The remaining cards form the stock. There are four suit foundations."
            },
            {
                "heading": "Game Flow",
                "body": "Tableau/foundation moves and stock draws occur independently per player; the server continuously updates progress and rankings."
            },
            {
                "heading": "Turn Rules",
                "body": "There is no shared turn. Each player can make legal moves on their own board at any time while connected and incomplete."
            },
            {
                "heading": "Card Rules",
                "body": "Tableau builds downward in alternating colors. Only a King can enter an empty tableau column. Foundations build upward by the same suit starting with Ace."
            },
            {
                "heading": "Special Rules",
                "body": "Stock is draw-1. When the stock is exhausted, the waste is redealt to the stock. `MAX_REDEALS` is `Infinity` in the rules module."
            },
            {
                "heading": "Scoring",
                "body": "For an incomplete player: `max(0, foundationCards × 100 - elapsedSeconds - moves)`. For a completed player: `max(1, 10000 - completionSeconds × 10 - moves)`."
            },
            {
                "heading": "Round Completion",
                "body": "There is one competitive board per player; completion status is recorded independently."
            },
            {
                "heading": "Game Completion",
                "body": "The engine completes the multiplayer game when its completion condition is met for the active player set."
            },
            {
                "heading": "Multiplayer Behaviour",
                "body": "Each player's board is independent. Opponents receive progress/ranking information rather than private tableau/stock contents."
            },
            {
                "heading": "Reconnection Behaviour",
                "body": "Explicit reconnect support restores the player's private board state from the server-held game object."
            },
            {
                "heading": "Private Information",
                "body": "Tableau hidden-card identities, stock order, waste and foundations are private to the owning player."
            },
            {
                "heading": "Winning Condition",
                "body": "Ranking uses completion state, completion time, moves, foundation progress and server-calculated score as implemented."
            },
            {
                "heading": "Implementation Notes",
                "body": "The server constructs a separate shuffled deck for every player, so players are not racing over a shared deck."
            }
        ]
    },
};
