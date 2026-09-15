import crypto from "crypto";

import {
    MIN_PLAYERS,
    MAX_PLAYERS,
    TOTAL_ROUNDS,
    PLAYER_STATUS,
    GAME_STATUS,
    ACTIONS,
    validatePlayerCount,
    isValidAction,
} from "./teenPattiRules.js";

const SUITS = [
    "spades",
    "hearts",
    "diamonds",
    "clubs",
];

const RANKS = [
    "A",
    "K",
    "Q",
    "J",
    "10",
    "9",
    "8",
    "7",
    "6",
    "5",
    "4",
    "3",
    "2",
];

const RANK_VALUES = {
    "2": 2,
    "3": 3,
    "4": 4,
    "5": 5,
    "6": 6,
    "7": 7,
    "8": 8,
    "9": 9,
    "10": 10,
    J: 11,
    Q: 12,
    K: 13,
    A: 14,
};

function createDeck() {
    const deck = [];

    for (const suit of SUITS) {
        for (const rank of RANKS) {
            deck.push({
                id: `${rank}-${suit}`,
                rank,
                suit,
                value: RANK_VALUES[rank],
            });
        }
    }

    return deck;
}

function shuffleDeck(deck) {
    const shuffled = [...deck];

    for (let i = shuffled.length - 1; i > 0; i -= 1) {
        const randomBytes = crypto.randomBytes(4);
        const randomNumber = randomBytes.readUInt32BE(0);
        const j = randomNumber % (i + 1);

        [shuffled[i], shuffled[j]] = [
            shuffled[j],
            shuffled[i],
        ];
    }

    return shuffled;
}

function getSequenceValues(cards) {
    const values = cards
        .map((card) => RANK_VALUES[card.rank])
        .sort((a, b) => b - a);

    if (new Set(values).size !== 3) {
        return null;
    }

    // A-2-3 is the lowest Teen Patti sequence.
    if (
        values[0] === 14 &&
        values[1] === 3 &&
        values[2] === 2
    ) {
        return [3, 2, 1];
    }

    // Normal consecutive sequence.
    if (
        values[0] - values[1] === 1 &&
        values[1] - values[2] === 1
    ) {
        return values;
    }

    return null;
}

export function evaluateHand(cards) {
    const values = cards
        .map((card) => RANK_VALUES[card.rank])
        .sort((a, b) => b - a);

    const counts = {};

    for (const value of values) {
        counts[value] = (counts[value] || 0) + 1;
    }

    const sameSuit =
        cards.every((card) => card.suit === cards[0].suit);

    const sequence = getSequenceValues(cards);

    if (Object.values(counts).includes(3)) {
        return {
            rank: 6,
            name: "Trail",
            tiebreak: [values[0]],
        };
    }

    if (sameSuit && sequence) {
        return {
            rank: 5,
            name: "Pure Sequence",
            tiebreak: sequence,
        };
    }

    if (sequence) {
        return {
            rank: 4,
            name: "Sequence",
            tiebreak: sequence,
        };
    }

    if (sameSuit) {
        return {
            rank: 3,
            name: "Color",
            tiebreak: values,
        };
    }

    const pairValue = Object.keys(counts).find(
        (value) => counts[value] === 2
    );

    if (pairValue) {
        return {
            rank: 2,
            name: "Pair",
            tiebreak: [
                Number(pairValue),
                values.find(
                    (value) => value !== Number(pairValue)
                ),
            ],
        };
    }

    return {
        rank: 1,
        name: "High Card",
        tiebreak: values,
    };
}

export function compareHands(handA, handB) {
    const evaluatedA = Array.isArray(handA)
        ? evaluateHand(handA)
        : handA;

    const evaluatedB = Array.isArray(handB)
        ? evaluateHand(handB)
        : handB;

    if (evaluatedA.rank !== evaluatedB.rank) {
        return evaluatedA.rank > evaluatedB.rank ? 1 : -1;
    }

    const length = Math.max(
        evaluatedA.tiebreak.length,
        evaluatedB.tiebreak.length
    );

    for (let i = 0; i < length; i++) {
        const valueA = evaluatedA.tiebreak[i] || 0;
        const valueB = evaluatedB.tiebreak[i] || 0;

        if (valueA !== valueB) {
            return valueA > valueB ? 1 : -1;
        }
    }

    return 0;
}

function getNextActivePlayer(game, currentPlayerId) {
    const players = game.players;

    const startIndex = players.findIndex(
        (player) => player.id === currentPlayerId
    );

    if (startIndex === -1) {
        return null;
    }

    for (let offset = 1; offset <= players.length; offset += 1) {
        const index =
            (startIndex + offset) % players.length;

        const player = players[index];

        if (player.status === PLAYER_STATUS.ACTIVE) {
            return player;
        }
    }

    return null;
}

function getActivePlayers(game) {
    return game.players.filter(
        (player) => player.status === PLAYER_STATUS.ACTIVE
    );
}

export function createTeenPattiGame(room) {
    validatePlayerCount(room.players.length);

    if (
        room.players.length < MIN_PLAYERS ||
        room.players.length > MAX_PLAYERS
    ) {
        throw new Error("Invalid Teen Patti player count.");
    }

    const deck = shuffleDeck(createDeck());

    const players = room.players.map(
        (player, index) => ({
            id: player.id,
            username: player.username,
            seat: index,
            connected: player.connected !== false,
            status: PLAYER_STATUS.ACTIVE,
            cards: [
                deck.pop(),
                deck.pop(),
                deck.pop(),
            ],
            hasActed: false,
            score: 0,
        })
    );

    const dealerIndex = 0;

    const firstPlayer =
        players[(dealerIndex + 1) % players.length];

    return {
        roomCode: room.code,
        gameId: "teen-patti",
        status: GAME_STATUS.PLAYING,
        players,
        dealerId: players[dealerIndex].id,
        currentPlayerId: firstPlayer.id,
        round: 1,
        totalRounds: TOTAL_ROUNDS,
        lastRoundResult: null,
        deck,
        winner: null,
        result: null,
        createdAt: Date.now(),
    };
}

export function applyAction(game, playerId, action) {
    if (!game) {
        throw new Error("Game not found.");
    }

    if (!isValidAction(action)) {
        throw new Error("Invalid action.");
    }

    const player = game.players.find(
        (item) => item.id === playerId
    );

    if (!player) {
        throw new Error("Player is not part of this game.");
    }

    // Start the next round manually.
    if (action === ACTIONS.NEXT_ROUND) {
        if (game.status !== GAME_STATUS.ROUND_COMPLETE) {
            throw new Error("The current round is not complete.");
        }

        if (!player.connected) {
            throw new Error("You must be connected to start the next round.");
        }

        if (game.round >= game.totalRounds) {
            throw new Error("All rounds are already complete.");
        }

        startNextRound(game);
        return game;
    }

    if (game.status !== GAME_STATUS.PLAYING) {
        throw new Error("Game is not active.");
    }

    if (game.currentPlayerId !== playerId) {
        throw new Error("It is not your turn.");
    }

    if (player.status !== PLAYER_STATUS.ACTIVE) {
        throw new Error("You cannot act right now.");
    }

    if (action === ACTIONS.FOLD) {
        player.status = PLAYER_STATUS.FOLDED;
    }

    player.hasActed = true;

    const activePlayers = getActivePlayers(game);

    // One player remaining means the CURRENT ROUND is won.
    // It does NOT end the 11-round game.
    if (activePlayers.length === 1) {
        finishRound(game, activePlayers[0]);
        return game;
    }

    const everyoneActed = activePlayers.every(
        (item) => item.hasActed
    );

    if (everyoneActed) {
        finishByShowdown(game);
        return game;
    }

    const nextPlayer = getNextActivePlayer(
        game,
        playerId
    );

    if (!nextPlayer) {
        finishByShowdown(game);
        return game;
    }

    game.currentPlayerId = nextPlayer.id;

    return game;
}

function startNextRound(game) {
    if (game.round >= game.totalRounds) {
        throw new Error("All rounds are already complete.");
    }

    const dealerIndex = game.players.findIndex(
        (player) => player.id === game.dealerId
    );

    const nextDealerIndex =
        (dealerIndex + 1) % game.players.length;

    game.dealerId =
        game.players[nextDealerIndex].id;

    const deck = shuffleDeck(createDeck());

    game.deck = deck;

    game.players.forEach((player) => {
        player.cards = [
            deck.pop(),
            deck.pop(),
            deck.pop(),
        ];

        player.hasActed = false;

        if (player.connected) {
            player.status = PLAYER_STATUS.ACTIVE;
        } else {
            player.status = PLAYER_STATUS.DISCONNECTED;
        }
    });

    game.round += 1;
    game.status = GAME_STATUS.PLAYING;
    game.lastRoundResult = game.lastRoundResult;

    const firstPlayerIndex =
        (nextDealerIndex + 1) % game.players.length;

    let firstPlayer = null;

    for (
        let offset = 0;
        offset < game.players.length;
        offset += 1
    ) {
        const index =
            (firstPlayerIndex + offset) %
            game.players.length;

        if (
            game.players[index].status ===
            PLAYER_STATUS.ACTIVE
        ) {
            firstPlayer = game.players[index];
            break;
        }
    }

    game.currentPlayerId =
        firstPlayer?.id || null;
}

function finishByShowdown(game) {
    const activePlayers = getActivePlayers(game);

    let winner = activePlayers[0];

    for (let i = 1; i < activePlayers.length; i += 1) {
        const comparison = compareHands(
            activePlayers[i].cards,
            winner.cards
        );

        if (comparison > 0) {
            winner = activePlayers[i];
        }
    }

    finishRound(game, winner);
}

function finishRound(game, winner) {
    winner.score += 1;

    const roundResult = {
        round: game.round,
        winnerId: winner.id,
        winnerUsername: winner.username,
        hand: evaluateHand(winner.cards),
        scores: game.players.map((player) => ({
            id: player.id,
            username: player.username,
            score: player.score,
        })),
    };

    game.lastRoundResult = roundResult;

    if (!Array.isArray(game.roundResults)) {
        game.roundResults = [];
    }

    game.roundResults.push(roundResult);

    // Final round ends the entire game.
    if (game.round >= game.totalRounds) {
        finishGame(game);
        return;
    }

    // IMPORTANT:
    // Stay on this round until a player explicitly starts
    // the next round.
    game.status = GAME_STATUS.ROUND_COMPLETE;
    game.currentPlayerId = null;
}

function finishGame(game) {
    const sortedPlayers = [...game.players].sort(
        (a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score;
            }

            return a.seat - b.seat;
        }
    );

    const winner = sortedPlayers[0];

    winner.status = PLAYER_STATUS.WINNER;

    game.status = GAME_STATUS.COMPLETE;
    game.winner = winner.id;

    game.result = {
        winnerId: winner.id,
        winnerUsername: winner.username,
        winnerScore: winner.score,
        totalRounds: game.totalRounds,
        scores: sortedPlayers.map((player) => ({
            id: player.id,
            username: player.username,
            score: player.score,
        })),
        rounds: game.roundResults,
    };

    game.currentPlayerId = null;
}

export function markPlayerDisconnected(
    game,
    playerId
) {
    const player = game?.players.find(
        (item) => item.id === playerId
    );

    if (!player) {
        return game;
    }

    player.connected = false;

    if (player.status === PLAYER_STATUS.ACTIVE) {
        player.status = PLAYER_STATUS.DISCONNECTED;
    }

    if (game.currentPlayerId === playerId) {
        const nextPlayer = game.players.find(
            (item) =>
                item.status === PLAYER_STATUS.ACTIVE
        );

        if (nextPlayer) {
            game.currentPlayerId = nextPlayer.id;
        }
    }

    return game;
}

export function reconnectPlayer(game, playerId) {
    const player = game?.players.find(
        (item) => item.id === playerId
    );

    if (!player) {
        return game;
    }

    player.connected = true;

    if (
        player.status === PLAYER_STATUS.DISCONNECTED
    ) {
        player.status = PLAYER_STATUS.ACTIVE;
    }

    return game;
}

export function getPublicGameState(game) {
    return {
        roomCode: game.roomCode,
        gameId: game.gameId,
        status: game.status,

        players: game.players.map((player) => ({
            id: player.id,
            username: player.username,
            seat: player.seat,
            connected: player.connected,
            status: player.status,
            cardCount: player.cards.length,
            score: player.score,
        })),

        currentPlayerId: game.currentPlayerId,
        dealerId: game.dealerId,

        round: game.round,
        totalRounds: game.totalRounds,
        lastRoundResult: game.lastRoundResult,
        roundResults: game.roundResults || [],

        winner: game.winner,

        result:
            game.status === GAME_STATUS.COMPLETE
                ? game.result
                : null,
    };
}

export function getPrivateGameState(game, playerId) {
    const publicState = getPublicGameState(game);

    const player = game.players.find(
        (item) => item.id === playerId
    );

    return {
        ...publicState,

        cards: player?.cards || [],

        legalActions:
            game.status === GAME_STATUS.PLAYING &&
                game.currentPlayerId === playerId &&
                player?.status === PLAYER_STATUS.ACTIVE
                ? [
                    ACTIONS.PLAY,
                    ACTIONS.FOLD,
                ]
                : game.status === GAME_STATUS.ROUND_COMPLETE &&
                    player?.connected &&
                    game.round < game.totalRounds
                    ? [
                        ACTIONS.NEXT_ROUND,
                    ]
                    : [],
    };
}