import {
    RANKS,
    SUITS,
    getTotalRounds,
    getTrumpInfo,
    isValidBid,
    canPlayCard,
    determineTrickWinner,
    calculateRoundScore,
} from "./kachufulRules.js";

function createDeck() {
    const deck = [];

    for (const suit of SUITS) {
        for (const rank of RANKS) {
            deck.push({
                id: `${suit}-${rank}`,
                suit,
                rank,
            });
        }
    }

    return deck;
}

function shuffleDeck(deck) {
    const shuffled = [...deck];

    for (let i = shuffled.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));

        [shuffled[i], shuffled[j]] = [
            shuffled[j],
            shuffled[i],
        ];
    }

    return shuffled;
}

// function createPlayers(roomPlayers) {
//     return roomPlayers.map((player, index) => ({
//         id: player.id,
//         username: player.username,
//         seat: index,
//         connected: player.connected !== false,
//         cards: [],
//         bid: null,
//         tricksWon: 0,
//         score: 0,
//         roundScore: 0,
//     }));
// }

function createPlayers(roomPlayers) {
    return roomPlayers.map((player, index) => ({
        id: player.id,
        username: player.username,
        seat: index,
        socketId: player.socketId || null,
        connected: player.connected !== false,
        cards: [],
        bid: null,
        tricksWon: 0,
        score: 0,
        roundScore: 0,
    }));
}

function createGame(room) {
    const playerCount = room.players.length;

    const players = createPlayers(room.players);

    return {
        roomCode: room.code,
        gameId: "kachuful",

        status: "bidding",

        round: 1,
        totalRounds: getTotalRounds(playerCount),
        cardsPerPlayer: 1,

        dealerIndex: 0,
        currentPlayerIndex: 0,

        trump: getTrumpInfo(1),

        players,

        bidsRevealed: false,
        allBidsSubmitted: false,

        currentTrick: [],
        completedTricks: [],
        lastCompletedTrick: null,

        deck: [],
        usedCards: [],

        roundStartedAt: Date.now(),
        updatedAt: Date.now(),
    };
}

function resetRoundPlayers(game) {
    for (const player of game.players) {
        player.cards = [];
        player.bid = null;
        player.tricksWon = 0;
        player.roundScore = 0;
    }
}

function dealRound(game) {
    resetRoundPlayers(game);

    const deck = shuffleDeck(createDeck());

    game.deck = deck;
    game.usedCards = [];

    for (let i = 0; i < game.cardsPerPlayer; i += 1) {
        for (const player of game.players) {
            const card = game.deck.pop();

            if (!card) {
                throw new Error("Not enough cards.");
            }

            player.cards.push(card);
            game.usedCards.push(card.id);
        }
    }

    game.currentTrick = [];
    game.completedTricks = [];
    game.lastCompletedTrick = null;

    game.trump = getTrumpInfo(game.round);

    game.status = "bidding";
    game.bidsRevealed = false;
    game.allBidsSubmitted = false;

    game.currentPlayerIndex =
        (game.dealerIndex + 1) %
        game.players.length;

    game.updatedAt = Date.now();
}

function startGame(game) {
    dealRound(game);
    return game;
}

function getPlayer(game, playerId) {
    return game.players.find(
        (player) => player.id === playerId
    );
}

function submitBid(game, playerId, bid) {
    if (game.status !== "bidding") {
        throw new Error("Bidding is not active.");
    }

    const player = getPlayer(game, playerId);

    if (!player) {
        throw new Error("Player not found.");
    }

    if (player.bid !== null) {
        throw new Error("You have already submitted your bid.");
    }

    if (!isValidBid(bid, game.cardsPerPlayer)) {
        throw new Error(
            `Bid must be between 0 and ${game.cardsPerPlayer}.`
        );
    }

    player.bid = bid;

    const allSubmitted = game.players.every(
        (item) => item.bid !== null
    );

    if (allSubmitted) {
        game.allBidsSubmitted = true;
        game.bidsRevealed = true;
        game.status = "playing";
    }

    game.updatedAt = Date.now();

    return {
        allSubmitted,
        player,
    };
}

function playCard(game, playerId, cardId) {
    if (game.status !== "playing") {
        throw new Error("Card play is not active.");
    }

    const currentPlayer =
        game.players[game.currentPlayerIndex];

    if (!currentPlayer) {
        throw new Error("Current player not found.");
    }

    if (currentPlayer.id !== playerId) {
        throw new Error("It is not your turn.");
    }

    const result = canPlayCard(
        currentPlayer.cards,
        cardId,
        game.currentTrick
    );

    if (!result.valid) {
        throw new Error(result.reason);
    }

    const card = result.card;

    currentPlayer.cards =
        currentPlayer.cards.filter(
            (item) => item.id !== cardId
        );

    game.currentTrick.push({
        playerId,
        card,
    });

    const trickComplete =
        game.currentTrick.length === game.players.length;

    if (trickComplete) {
        resolveTrick(game);
    } else {
        game.currentPlayerIndex =
            (game.currentPlayerIndex + 1) %
            game.players.length;
    }

    game.updatedAt = Date.now();

    return {
        card,
        trickComplete,
    };
}

function resolveTrick(game) {
    const winningPlayerId = determineTrickWinner(
        game.currentTrick,
        game.trump.suit
    );

    const winner = getPlayer(
        game,
        winningPlayerId
    );

    if (!winner) {
        throw new Error("Trick winner not found.");
    }

    winner.tricksWon += 1;

    const completedTrick = {
        cards: [...game.currentTrick],
        winnerId: winningPlayerId,
    };

    game.completedTricks.push(completedTrick);
    game.lastCompletedTrick = completedTrick;

    game.currentTrick = [];

    const allCardsPlayed = game.players.every(
        (player) => player.cards.length === 0
    );

    if (allCardsPlayed) {
        finishRound(game);
        return {
            winnerId: winningPlayerId,
            roundComplete: true,
        };
    }

    game.currentPlayerIndex =
        game.players.findIndex(
            (player) => player.id === winningPlayerId
        );

    return {
        winnerId: winningPlayerId,
        roundComplete: false,
    };
}

function finishRound(game) {
    for (const player of game.players) {
        player.roundScore = calculateRoundScore(
            player.bid,
            player.tricksWon
        );

        player.score += player.roundScore;
    }

    game.status = "round-complete";
    game.updatedAt = Date.now();
}

function startNextRound(game) {
    if (game.status !== "round-complete") {
        throw new Error("The current round is not complete.");
    }

    if (game.round >= game.totalRounds) {
        game.status = "game-complete";
        game.updatedAt = Date.now();
        return false;
    }

    game.round += 1;
    game.cardsPerPlayer += 1;

    game.dealerIndex =
        (game.dealerIndex + 1) %
        game.players.length;

    dealRound(game);

    return true;
}

function markPlayerConnection(
    game,
    playerId,
    connected,
    socketId = null
) {
    const player = game.players.find(
        (item) => item.id === playerId
    );

    if (!player) return;

    player.connected = connected;

    if (socketId) {
        player.socketId = socketId;
    }

    game.updatedAt = Date.now();
}


function getWinner(game) {
    return [...game.players].sort(
        (a, b) => b.score - a.score
    )[0] || null;
}


function getPublicState(game, viewerId) {
    return {
        roomCode: game.roomCode,
        gameId: game.gameId,

        status: game.status,

        round: game.round,
        totalRounds: game.totalRounds,
        cardsPerPlayer: game.cardsPerPlayer,

        trump: game.trump,

        currentPlayerId:
            game.players[game.currentPlayerIndex]?.id || null,

        dealerId:
            game.players[game.dealerIndex]?.id || null,

        players: game.players.map((player) => ({
            id: player.id,
            username: player.username,
            seat: player.seat,
            connected: player.connected,
            cardCount: player.cards.length,
            bid: game.bidsRevealed
                ? player.bid
                : player.id === viewerId
                    ? player.bid
                    : null,
            tricksWon: player.tricksWon,
            roundScore: player.roundScore,
            score: player.score,
        })),

        yourCards:
            game.players.find(
                (player) => player.id === viewerId
            )?.cards || [],

        yourBid:
            game.players.find(
                (player) => player.id === viewerId
            )?.bid ?? null,

        currentTrick: game.currentTrick.map(
            (play) => ({
                playerId: play.playerId,
                card: play.card,
            })
        ),

        completedTricks: game.completedTricks.map(
            (trick) => ({
                winnerId: trick.winnerId,
                cards: trick.cards,
            })
        ),

        lastCompletedTrick: game.lastCompletedTrick
            ? {
                winnerId: game.lastCompletedTrick.winnerId,
                cards: game.lastCompletedTrick.cards,
            }
            : null,

        bidsRevealed: game.bidsRevealed,
        allBidsSubmitted: game.allBidsSubmitted,

        winner:
            game.status === "game-complete"
                ? getWinner(game)
                : null,

        updatedAt: game.updatedAt,
    };
}

export {
    createGame,
    startGame,
    submitBid,
    playCard,
    getWinner,
    startNextRound,
    markPlayerConnection,
    getPublicState,
};