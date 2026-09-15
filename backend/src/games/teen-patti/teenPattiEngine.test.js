import assert from "node:assert/strict";

import {
    GAME_STATUS,
    ACTIONS,
    PLAYER_STATUS,
} from "./teenPattiRules.js";

import {
    createTeenPattiGame,
    applyAction,
} from "./teenPattiEngine.js";

function test(name, callback) {
    try {
        callback();
        console.log(`✓ ${name}`);
    } catch (error) {
        console.error(`✗ ${name}`);
        throw error;
    }
}

function createRoom(playerCount) {
    return {
        code: "TEST01",
        gameId: "teen-patti",
        players: Array.from({ length: playerCount }, (_, index) => ({
            id: `player-${index + 1}`,
            username: `Player ${index + 1}`,
        })),
    };
}

function getCurrentPlayer(game) {
    return game.players.find(
        (player) => player.id === game.currentPlayerId
    );
}

function finishRoundByPlay(game) {
    while (game.status === GAME_STATUS.PLAYING) {
        const currentPlayer = getCurrentPlayer(game);

        applyAction(
            game,
            currentPlayer.id,
            ACTIONS.PLAY
        );
    }
}

// GAME CREATION

test("Creates a 3-player game", () => {
    const game = createTeenPattiGame(createRoom(3));

    assert.equal(game.players.length, 3);
    assert.equal(game.status, GAME_STATUS.PLAYING);
});

test("Creates a 4-player game", () => {
    const game = createTeenPattiGame(createRoom(4));

    assert.equal(game.players.length, 4);
});

test("Creates a 5-player game", () => {
    const game = createTeenPattiGame(createRoom(5));

    assert.equal(game.players.length, 5);
});

test("Creates a 6-player game", () => {
    const game = createTeenPattiGame(createRoom(6));

    assert.equal(game.players.length, 6);
});

test("Rejects fewer than 3 players", () => {
    assert.throws(() => {
        createTeenPattiGame(createRoom(2));
    });
});

test("Rejects more than 6 players", () => {
    assert.throws(() => {
        createTeenPattiGame(createRoom(7));
    });
});

// DEALING

test("Deals exactly 3 cards to every player", () => {
    const game = createTeenPattiGame(createRoom(6));

    for (const player of game.players) {
        assert.equal(player.cards.length, 3);
    }
});

test("Deals unique cards to all players", () => {
    const game = createTeenPattiGame(createRoom(6));

    const cardIds = game.players.flatMap((player) =>
        player.cards.map((card) => card.id)
    );

    assert.equal(cardIds.length, 18);
    assert.equal(new Set(cardIds).size, 18);
});

test("Uses a fresh deck for every game", () => {
    const gameA = createTeenPattiGame(createRoom(3));
    const gameB = createTeenPattiGame(createRoom(3));

    const cardsA = gameA.players.flatMap((player) =>
        player.cards.map((card) => card.id)
    );

    const cardsB = gameB.players.flatMap((player) =>
        player.cards.map((card) => card.id)
    );

    assert.equal(cardsA.length, 9);
    assert.equal(cardsB.length, 9);
});

// INITIAL STATE

test("First turn belongs to the correct player", () => {
    const game = createTeenPattiGame(createRoom(3));

    assert.equal(
        game.currentPlayerId,
        game.players[1].id
    );

    assert.equal(
        game.players[1].hasActed,
        false
    );
});

test("All players start active", () => {
    const game = createTeenPattiGame(createRoom(6));

    for (const player of game.players) {
        assert.equal(
            player.status,
            PLAYER_STATUS.ACTIVE
        );

        assert.equal(
            player.hasActed,
            false
        );
    }
});

// PLAY ACTION

test("PLAY marks the current player as acted", () => {
    const game = createTeenPattiGame(createRoom(3));
    const currentPlayer = getCurrentPlayer(game);

    applyAction(
        game,
        currentPlayer.id,
        ACTIONS.PLAY
    );

    assert.equal(
        currentPlayer.hasActed,
        true
    );
});

test("PLAY moves the turn to the next active player", () => {
    const game = createTeenPattiGame(createRoom(3));
    const firstPlayer = getCurrentPlayer(game);

    applyAction(
        game,
        firstPlayer.id,
        ACTIONS.PLAY
    );

    assert.notEqual(
        game.currentPlayerId,
        firstPlayer.id
    );

    assert.equal(
        game.status,
        GAME_STATUS.PLAYING
    );
});

// FOLD ACTION

test("FOLD marks the player as folded", () => {
    const game = createTeenPattiGame(createRoom(3));
    const currentPlayer = getCurrentPlayer(game);

    applyAction(
        game,
        currentPlayer.id,
        ACTIONS.FOLD
    );

    assert.equal(
        currentPlayer.status,
        PLAYER_STATUS.FOLDED
    );

    assert.equal(
        currentPlayer.hasActed,
        true
    );
});

test("Folded player is skipped", () => {
    const game = createTeenPattiGame(createRoom(3));
    const firstPlayer = getCurrentPlayer(game);

    applyAction(
        game,
        firstPlayer.id,
        ACTIONS.FOLD
    );

    const nextPlayer = getCurrentPlayer(game);

    assert.ok(nextPlayer);

    assert.notEqual(
        nextPlayer.id,
        firstPlayer.id
    );

    assert.equal(
        nextPlayer.status,
        PLAYER_STATUS.ACTIVE
    );
});

// INVALID ACTIONS

test("Rejects action from a player whose turn it is not", () => {
    const game = createTeenPattiGame(createRoom(3));
    const currentPlayer = getCurrentPlayer(game);

    const otherPlayer = game.players.find(
        (player) => player.id !== currentPlayer.id
    );

    assert.throws(() => {
        applyAction(
            game,
            otherPlayer.id,
            ACTIONS.PLAY
        );
    });
});

test("Rejects invalid action", () => {
    const game = createTeenPattiGame(createRoom(3));
    const currentPlayer = getCurrentPlayer(game);

    assert.throws(() => {
        applyAction(
            game,
            currentPlayer.id,
            "invalid-action"
        );
    });
});

test("Rejects unknown player", () => {
    const game = createTeenPattiGame(createRoom(3));

    assert.throws(() => {
        applyAction(
            game,
            "unknown-player",
            ACTIONS.PLAY
        );
    });
});

test("Rejects action after game is complete", () => {
    const game = createTeenPattiGame(createRoom(3));

    game.status = GAME_STATUS.COMPLETE;

    assert.throws(() => {
        applyAction(
            game,
            game.players[1].id,
            ACTIONS.PLAY
        );
    });
});

// ROUND COMPLETION

test("Last active player wins the current round", () => {
    const game = createTeenPattiGame(createRoom(3));

    const firstPlayer = getCurrentPlayer(game);

    applyAction(
        game,
        firstPlayer.id,
        ACTIONS.FOLD
    );

    const secondPlayer = getCurrentPlayer(game);

    assert.ok(secondPlayer);
    assert.notEqual(secondPlayer.id, firstPlayer.id);

    applyAction(
        game,
        secondPlayer.id,
        ACTIONS.FOLD
    );

    const winner = game.players.find(
        (player) =>
            player.status === PLAYER_STATUS.ACTIVE
    );

    assert.ok(winner);

    assert.equal(
        game.status,
        GAME_STATUS.ROUND_COMPLETE
    );

    assert.equal(
        game.lastRoundResult.winnerId,
        winner.id
    );

    assert.equal(
        winner.score,
        1
    );

    assert.equal(
        game.round,
        1
    );
});

test("Showdown completes the current round", () => {
    const game = createTeenPattiGame(createRoom(3));

    finishRoundByPlay(game);

    assert.equal(
        game.status,
        GAME_STATUS.ROUND_COMPLETE
    );

    assert.equal(
        game.round,
        1
    );

    assert.equal(
        game.roundResults.length,
        1
    );

    const roundWinner = game.roundResults[0].winnerId;

    const winner = game.players.find(
        (player) => player.id === roundWinner
    );

    assert.ok(winner);

    assert.equal(
        winner.score,
        1
    );
});

// NEXT ROUND

test("NEXT_ROUND starts the following round", () => {
    const game = createTeenPattiGame(createRoom(3));

    const oldDealer = game.dealerId;

    finishRoundByPlay(game);

    assert.equal(
        game.status,
        GAME_STATUS.ROUND_COMPLETE
    );

    assert.equal(
        game.round,
        1
    );

    const starter = game.players.find(
        (player) =>
            player.connected &&
            player.status === PLAYER_STATUS.ACTIVE
    );

    assert.ok(starter);

    applyAction(
        game,
        starter.id,
        ACTIONS.NEXT_ROUND
    );

    assert.equal(
        game.status,
        GAME_STATUS.PLAYING
    );

    assert.equal(
        game.round,
        2
    );

    assert.notEqual(
        game.dealerId,
        oldDealer
    );

    assert.ok(
        game.currentPlayerId
    );

    for (const player of game.players) {
        assert.equal(
            player.cards.length,
            3
        );

        assert.equal(
            player.hasActed,
            false
        );
    }
});

test("Rejects NEXT_ROUND while the current round is still playing", () => {
    const game = createTeenPattiGame(createRoom(3));
    const currentPlayer = getCurrentPlayer(game);

    assert.throws(() => {
        applyAction(
            game,
            currentPlayer.id,
            ACTIONS.NEXT_ROUND
        );
    });
});

test("NEXT_ROUND preserves round scores", () => {
    const game = createTeenPattiGame(createRoom(3));

    finishRoundByPlay(game);

    const scoresAfterRoundOne = game.players.map(
        (player) => ({
            id: player.id,
            score: player.score,
        })
    );

    const starter = game.players.find(
        (player) =>
            player.connected &&
            player.status === PLAYER_STATUS.ACTIVE
    );

    applyAction(
        game,
        starter.id,
        ACTIONS.NEXT_ROUND
    );

    for (const previous of scoresAfterRoundOne) {
        const player = game.players.find(
            (item) => item.id === previous.id
        );

        assert.equal(
            player.score,
            previous.score
        );
    }
});

test("Completes exactly 11 rounds and determines the overall winner", () => {
    const game = createTeenPattiGame(createRoom(3));

    for (let round = 1; round <= 11; round += 1) {
        finishRoundByPlay(game);

        assert.equal(
            game.round,
            round
        );

        if (round < 11) {
            assert.equal(
                game.status,
                GAME_STATUS.ROUND_COMPLETE
            );

            const starter = game.players.find(
                (player) =>
                    player.connected &&
                    player.status === PLAYER_STATUS.ACTIVE
            );

            assert.ok(starter);

            applyAction(
                game,
                starter.id,
                ACTIONS.NEXT_ROUND
            );

            assert.equal(
                game.round,
                round + 1
            );

            assert.equal(
                game.status,
                GAME_STATUS.PLAYING
            );
        } else {
            assert.equal(
                game.status,
                GAME_STATUS.COMPLETE
            );
        }
    }

    assert.equal(
        game.round,
        11
    );

    assert.equal(
        game.roundResults.length,
        11
    );

    assert.equal(
        game.status,
        GAME_STATUS.COMPLETE
    );

    assert.ok(game.winner);

    assert.equal(
        game.result.totalRounds,
        11
    );

    const totalScore = game.players.reduce(
        (total, player) =>
            total + player.score,
        0
    );

    assert.equal(
        totalScore,
        11
    );

    const winner = game.players.find(
        (player) => player.id === game.winner
    );

    assert.ok(winner);

    assert.equal(
        winner.status,
        PLAYER_STATUS.WINNER
    );
});

console.log("\nTeen Patti engine tests passed.");