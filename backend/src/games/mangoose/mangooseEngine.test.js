import {
    ACTIONS,
    MAX_PLAYERS,
    MIN_PLAYERS,
    PLAYER_STATUS,
    canPlayOnCenter,
    canPlayOnOpponent,
} from "./mangooseRules.js";

import {
    applyAction,
    createMangooseGame,
    getPrivateGameState,
    getPlayerCardCount,
    resolvePendingMongoose,
} from "./mangooseEngine.js";

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

function makeCard(rank, suit) {
    return {
        id: `${rank}-${suit}-${Math.random()}`,
        rank,
        suit,
    };
}

function createTestGame(players = 3) {
    return createMangooseGame({
        code: `TEST-${players}`,
        gameId: "mangoose",
        status: "playing",
        players: Array.from(
            { length: players },
            (_, index) => ({
                id: `p${index + 1}`,
                username: `P${index + 1}`,
                connected: true,
                socketId: null,
            })
        ),
    });
}

// 2-12 players initialize and deal all 52 cards.
for (const count of [
    MIN_PLAYERS,
    3,
    4,
    6,
    8,
    10,
    MAX_PLAYERS,
]) {
    const game = createTestGame(count);

    assert(
        game.players.length === count,
        `${count} player game did not initialize.`
    );

    assert(
        game.centerStacks.length === 4,
        "Mangoose must have four center foundations."
    );

    assert(
        game.centerStacks.every(
            (stack) => stack.cards.length === 0
        ),
        "Center foundations must start empty."
    );

    const totalCards = game.players.reduce(
        (total, player) =>
            total + getPlayerCardCount(player),
        0
    );

    assert(
        totalCards === 52,
        `${count} player game must contain all 52 cards.`
    );

    const first = game.players[0];
    game.currentPlayerId = first.id;

    const initialState = getPrivateGameState(
        game,
        first.id
    );

    assert(
        initialState.legalActions.includes(
            ACTIONS.FLIP
        ),
        `${count} player game did not offer flip.`
    );

    applyAction(
        game,
        first.id,
        ACTIONS.FLIP
    );

    assert(
        game.players[0].flippedCard,
        `${count} player flip failed.`
    );
}

console.log(
    "✓ Mangoose initializes correctly for 2/3/4/6/8/10/12 players"
);

// Center rule: same suit + exactly one rank up/down.
{
    const spades = {
        suit: "spades",
        cards: [makeCard("4", "spades")],
    };

    assert(
        canPlayOnCenter(
            makeCard("5", "spades"),
            spades
        ),
        "5♠ should play on 4♠."
    );

    assert(
        canPlayOnCenter(
            makeCard("3", "spades"),
            spades
        ),
        "3♠ should play on 4♠."
    );

    assert(
        !canPlayOnCenter(
            makeCard("5", "diamonds"),
            spades
        ),
        "5♦ must not play on 4♠."
    );

    assert(
        !canPlayOnCenter(
            makeCard("7", "spades"),
            spades
        ),
        "7♠ must not play on 4♠."
    );

    assert(
        canPlayOnCenter(
            makeCard("A", "hearts"),
            {
                suit: "hearts",
                cards: [],
            }
        ),
        "Matching Ace should start an empty foundation."
    );

    assert(
        !canPlayOnCenter(
            makeCard("A", "clubs"),
            {
                suit: "hearts",
                cards: [],
            }
        ),
        "An Ace cannot start a different-suit foundation."
    );

    console.log(
        "✓ Center play uses same-suit adjacent ranks"
    );
}

// Opponent pile rule: exact ascending rank, suit independent.
{
    const top = makeCard("5", "hearts");

    assert(
        canPlayOnOpponent(
            makeCard("6", "spades"),
            top
        ),
        "6♠ should play on 5♥."
    );

    assert(
        !canPlayOnOpponent(
            makeCard("4", "clubs"),
            top
        ),
        "4♣ must not play on 5♥ because opponent piles are ascending only."
    );

    console.log(
        "✓ Opponent piles use ascending rank only"
    );
}

// Successful play keeps the same turn.
{
    const game = createTestGame(2);
    const player = game.players[0];
    const opponent = game.players[1];

    player.closedPile = [
        makeCard("9", "hearts"),
        makeCard("6", "spades"),
    ];
    player.openPile = [];
    opponent.openPile = [
        makeCard("5", "hearts"),
    ];
    opponent.closedPile = [
        makeCard("9", "clubs"),
    ];
    game.centerStacks.find(
        (stack) => stack.suit === "spades"
    ).cards = [makeCard("5", "spades")];
    game.currentPlayerId = player.id;

    applyAction(
        game,
        player.id,
        ACTIONS.FLIP
    );

    const result = applyAction(
        game,
        player.id,
        ACTIONS.PLAY_CENTER,
        "spades"
    );

    assert(
        result.sameTurn === true,
        "A successful play should keep the same turn."
    );

    assert(
        game.currentPlayerId === player.id,
        "The same player should continue after a successful play."
    );

    console.log(
        "✓ Successful play keeps the same player's turn"
    );
}

// A mistaken own drop opens a Mongoose call window instead of
// automatically applying the penalty.
{
    const game = createTestGame(3);
    const offender = game.players[0];

    offender.closedPile = [
        makeCard("6", "spades"),
    ];
    offender.openPile = [];

    game.players[1].closedPile = [
        makeCard("8", "diamonds"),
        makeCard("9", "hearts"),
    ];
    game.players[2].closedPile = [
        makeCard("9", "spades"),
        makeCard("10", "clubs"),
    ];

    game.centerStacks.find(
        (stack) => stack.suit === "spades"
    ).cards = [makeCard("5", "spades")];

    game.currentPlayerId = offender.id;

    applyAction(
        game,
        offender.id,
        ACTIONS.FLIP
    );

    const result = applyAction(
        game,
        offender.id,
        ACTIONS.PLAY_OWN
    );

    assert(
        result.type === "mongoose-window",
        "A mistaken playable-card drop should open a Mongoose call window."
    );

    assert(
        game.pendingMongoose?.offenderId ===
        offender.id,
        "The offender should be the pending Mongoose target."
    );

    assert(
        game.currentPlayerId === offender.id,
        "The turn must remain locked during the Mongoose call window."
    );

    console.log(
        "✓ Mistaken playable-card drop opens a Mongoose call window"
    );
}

// A successful Mongoose call makes every active opponent pass one
// accessible closed-pile card to the offender and then advances turn.
{
    const game = createTestGame(3);
    const offender = game.players[0];

    offender.closedPile = [
        makeCard("6", "spades"),
    ];

    game.players[1].closedPile = [
        makeCard("8", "diamonds"),
        makeCard("9", "hearts"),
    ];
    game.players[2].closedPile = [
        makeCard("9", "spades"),
        makeCard("10", "clubs"),
    ];

    game.centerStacks.find(
        (stack) => stack.suit === "spades"
    ).cards = [makeCard("5", "spades")];

    game.currentPlayerId = offender.id;

    applyAction(
        game,
        offender.id,
        ACTIONS.FLIP
    );
    applyAction(
        game,
        offender.id,
        ACTIONS.PLAY_OWN
    );

    const result = applyAction(
        game,
        game.players[1].id,
        ACTIONS.CALL_MONGOOSE,
        offender.id
    );

    assert(
        result.type === "mongoose-called",
        "A valid Mongoose call should succeed."
    );

    assert(
        result.penaltyCount === 2,
        "Each active opponent should pass one card."
    );

    assert(
        offender.closedPile.length === 2,
        "The offender should receive both penalty cards."
    );

    assert(
        game.currentPlayerId ===
        game.players[1].id,
        "After Mongoose, turn should advance clockwise."
    );

    assert(
        !game.pendingMongoose,
        "The Mongoose call window must close after a successful call."
    );

    console.log(
        "✓ Mongoose call applies one penalty card from every active opponent"
    );
}

// If nobody calls Mongoose, the window expires and the normal turn ends.
{
    const game = createTestGame(2);
    const offender = game.players[0];

    offender.closedPile = [
        makeCard("6", "spades"),
    ];

    game.players[1].closedPile = [
        makeCard("9", "clubs"),
    ];

    game.centerStacks.find(
        (stack) => stack.suit === "spades"
    ).cards = [makeCard("5", "spades")];

    game.currentPlayerId = offender.id;

    applyAction(
        game,
        offender.id,
        ACTIONS.FLIP
    );
    applyAction(
        game,
        offender.id,
        ACTIONS.PLAY_OWN
    );

    const result = resolvePendingMongoose(
        game
    );

    assert(
        result.type ===
        "mongoose-window-expired",
        "An uncalled Mongoose window should expire normally."
    );

    assert(
        game.currentPlayerId ===
        game.players[1].id,
        "The next player should receive the turn after an uncalled mistake."
    );

    console.log(
        "✓ Uncalled Mongoose window ends normally"
    );
}

// If a closed pile reaches zero, the existing open pile is recycled
// in the same order and the next closed draw uses that sequence.
{
    const game = createTestGame(2);
    const player = game.players[0];
    const other = game.players[1];

    player.closedPile = [];
    player.openPile = [
        makeCard("9", "clubs"),
        makeCard("10", "clubs"),
        makeCard("J", "clubs"),
    ];

    other.closedPile = [
        makeCard("4", "hearts"),
    ];

    game.currentPlayerId = player.id;

    const result = applyAction(
        game,
        player.id,
        ACTIONS.FLIP
    );

    assert(
        result.card.rank === "J",
        "The previous open-pile top card should become the first recycled draw."
    );

    assert(
        player.openPile.length === 0,
        "Open pile should be emptied when recycled."
    );

    assert(
        player.closedPile.length === 2,
        "The remaining recycled cards should stay in closed pile."
    );

    console.log(
        "✓ Empty closed pile recycles the player's open pile"
    );
}

// Receiving a card while a target player's closed pile is empty
// immediately recycles that player's open pile, preserving order.
{
    const game = createTestGame(2);
    const player = game.players[0];
    const targetPlayer = game.players[1];

    player.closedPile = [
        makeCard("9", "spades"),
        makeCard("J", "spades"),
    ];

    targetPlayer.closedPile = [];
    targetPlayer.openPile = [
        makeCard("7", "hearts"),
        makeCard("10", "clubs"),
    ];

    game.currentPlayerId = player.id;

    // J is rank 11 and can be pushed onto 10 regardless of suit.
    game.centerStacks.find(
        (stack) => stack.suit === "hearts"
    ).cards = [makeCard("Q", "hearts")];

    applyAction(
        game,
        player.id,
        ACTIONS.FLIP
    );

    const result = applyAction(
        game,
        player.id,
        ACTIONS.PLAY_OPPONENT,
        targetPlayer.id
    );

    assert(
        result.sameTurn === true,
        "Playing onto an opponent should continue the same turn."
    );

    assert(
        targetPlayer.openPile.length === 0,
        "The target open pile should be recycled after receiving the card."
    );

    assert(
        targetPlayer.closedPile.length === 3,
        "The recycled pile should contain all previous open cards plus the new card."
    );

    assert(
        targetPlayer.closedPile[2].rank === "J",
        "The newly received card should preserve the open-pile sequence at the top."
    );

    console.log(
        "✓ Opponent move recycles an empty closed pile immediately"
    );
}

// A first winner does not end the game immediately.
{
    const game = createTestGame(3);
    const winner = game.players[0];
    const second = game.players[1];
    const mongooseCandidate = game.players[2];

    winner.closedPile = [
        makeCard("K", "spades"),
    ];
    winner.openPile = [];

    second.closedPile = [
        makeCard("10", "clubs"),
    ];
    second.openPile = [];

    mongooseCandidate.closedPile = [
        makeCard("10", "hearts"),
        makeCard("J", "hearts"),
    ];
    mongooseCandidate.openPile = [];

    game.centerStacks.find(
        (stack) => stack.suit === "spades"
    ).cards = [makeCard("Q", "spades")];

    game.currentPlayerId = winner.id;

    applyAction(
        game,
        winner.id,
        ACTIONS.FLIP
    );

    const firstWinnerResult = applyAction(
        game,
        winner.id,
        ACTIONS.PLAY_CENTER,
        "spades"
    );

    assert(
        firstWinnerResult.type === "player-finished",
        "A player who plays their last card should finish as the first winner."
    );

    assert(
        winner.status === PLAYER_STATUS.WINNER,
        "The first player to empty both piles should become the winner."
    );

    assert(
        game.status === "playing",
        "The game must continue after the first winner."
    );

    assert(
        game.currentPlayerId === second.id,
        "Turn should advance clockwise after the first winner."
    );

    game.centerStacks.find(
        (stack) => stack.suit === "clubs"
    ).cards = [makeCard("9", "clubs")];

    game.currentPlayerId = second.id;

    applyAction(
        game,
        second.id,
        ACTIONS.FLIP
    );

    const secondWinnerResult = applyAction(
        game,
        second.id,
        ACTIONS.PLAY_CENTER,
        "clubs"
    );

    assert(
        secondWinnerResult.type === "game-complete",
        "The game should complete when only one player remains with cards."
    );

    assert(
        mongooseCandidate.status ===
        PLAYER_STATUS.MONGOOSE,
        "The last remaining player should become the Mongoose."
    );

    assert(
        game.status === "complete",
        "The game should be complete when the final Mongoose is determined."
    );

    console.log(
        "✓ First winner survives while the game continues to the final Mongoose"
    );
}

console.log(
    "✓ Mangoose engine regression tests completed"
);
