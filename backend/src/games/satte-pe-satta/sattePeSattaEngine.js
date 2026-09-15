import {
    CARD_POINTS,
    MAX_PLAYERS,
    MIN_PLAYERS,
    TARGET_SCORE,
    RANKS,
    RANK_VALUES,
    STARTER_CARD_ID,
    STATUS,
    SUITS,
    SUIT_SYMBOLS,
} from "./sattePeSattaRules.js";

function normalizeRoomCode(roomCode) {
    return String(roomCode || "").toUpperCase();
}

function assertRoomPlayers(room) {
    const count = room?.players?.length || 0;
    if (count < MIN_PLAYERS || count > MAX_PLAYERS) {
        throw new Error(`Satte Pe Satta supports ${MIN_PLAYERS}-${MAX_PLAYERS} players.`);
    }
}

export function createDeck() {
    return SUITS.flatMap((suit) =>
        RANKS.map((rank, rankIndex) => ({
            id: `${rank}-${suit}`,
            rank,
            suit,
            value: rankIndex + 1,
        }))
    );
}

export function shuffleDeck(cards, rng = Math.random) {
    const deck = [...cards];
    for (let index = deck.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(rng() * (index + 1));
        [deck[index], deck[swapIndex]] = [deck[swapIndex], deck[index]];
    }
    return deck;
}

export function dealDeck(deck, players) {
    if (!Array.isArray(players) || players.length === 0) {
        throw new Error("At least one player is required to deal.");
    }

    const hands = new Map(players.map((player) => [player.id, []]));
    deck.forEach((card, index) => {
        const player = players[index % players.length];
        hands.get(player.id).push(card);
    });
    return hands;
}

function rankIndex(rank) {
    return RANKS.indexOf(rank);
}

function cardAtBoundary(game, suit, direction) {
    const placed = game.layout[suit];
    if (!placed.opened) return null;
    return direction === "down" ? placed.lowest : placed.highest;
}

export function isCardPlaced(game, cardId) {
    return SUITS.some((suit) => game.layout[suit].cards.some((card) => card.id === cardId));
}

export function getLegalMoves(game, playerId) {
    const player = getPlayer(game, playerId);
    if (!player || game.status !== STATUS.PLAYING || game.currentPlayerId !== playerId) return [];

    return player.hand.filter((card) => {
        if (card.id === STARTER_CARD_ID && !isCardPlaced(game, card.id)) return true;

        const row = game.layout[card.suit];
        const cardRank = rankIndex(card.rank);
        if (!row.opened) return card.rank === "7";

        const lowestIndex = rankIndex(row.lowest.rank);
        const highestIndex = rankIndex(row.highest.rank);
        return cardRank === lowestIndex - 1 || cardRank === highestIndex + 1;
    });
}

function removeCardFromHand(player, cardId) {
    const index = player.hand.findIndex((card) => card.id === cardId);
    if (index === -1) return null;
    return player.hand.splice(index, 1)[0];
}

function placeCardOnLayout(game, card) {
    const row = game.layout[card.suit];
    const cardIndex = rankIndex(card.rank);

    if (!row.opened) {
        if (card.rank !== "7") throw new Error("That suit must start with its 7.");
        row.opened = true;
        row.lowest = card;
        row.highest = card;
    } else {
        const lowestIndex = rankIndex(row.lowest.rank);
        const highestIndex = rankIndex(row.highest.rank);
        if (cardIndex === lowestIndex - 1) row.lowest = card;
        else if (cardIndex === highestIndex + 1) row.highest = card;
        else throw new Error("That card is not adjacent to the current sequence.");
    }

    row.cards.push(card);
    row.cards.sort((a, b) => rankIndex(a.rank) - rankIndex(b.rank));
}

function advanceTurn(game) {
    const currentIndex = game.players.findIndex((player) => player.id === game.currentPlayerId);
    for (let offset = 1; offset <= game.players.length; offset += 1) {
        const player = game.players[(currentIndex + offset) % game.players.length];
        if (player.status === "active") {
            game.currentPlayerId = player.id;
            return player.id;
        }
    }
    game.currentPlayerId = null;
    return null;
}

function calculatePenalty(player) {
    return player.hand.reduce((total, card) => total + (CARD_POINTS[card.rank] || RANK_VALUES[card.rank]), 0);
}

function getRanking(game) {
    return [...game.players].sort((a, b) =>
        a.score - b.score || a.seat - b.seat
    );
}

function completeRound(game, roundWinnerId) {
    const roundWinner = getPlayer(game, roundWinnerId);
    const roundPenalties = new Map();

    for (const player of game.players) {
        const penalty = player.id === roundWinnerId ? 0 : calculatePenalty(player);
        roundPenalties.set(player.id, penalty);
        player.score += penalty;
        player.roundScore = penalty;
        player.status = "finished";
    }

    const ranking = getRanking(game);
    const targetReached = game.players.some((player) => player.score >= TARGET_SCORE);

    game.status = targetReached ? STATUS.COMPLETE : STATUS.ROUND_COMPLETE;
    game.winnerId = targetReached ? ranking[0]?.id || null : null;
    game.currentPlayerId = null;
    game.result = {
        roundWinnerId,
        roundWinnerUsername: roundWinner?.username || "",
        winnerId: game.winnerId,
        gameWinnerUsername: getPlayer(game, game.winnerId)?.username || "",
        targetScore: TARGET_SCORE,
        targetReached,
        ranking: ranking.map((player, index) => ({
            rank: index + 1,
            id: player.id,
            username: player.username,
            roundPenaltyPoints: roundPenalties.get(player.id) || 0,
            totalPoints: player.score,
            remainingCards: player.hand.length,
        })),
    };
}

export function startNextRound(game) {
    if (game.status !== STATUS.ROUND_COMPLETE) {
        throw new Error("The current round is not complete.");
    }

    const deck = shuffleDeck(createDeck());
    const hands = dealDeck(deck, game.players);

    for (const player of game.players) {
        player.hand = hands.get(player.id) || [];
        player.roundScore = 0;
        player.status = "active";
    }

    game.layout = {
        spades: { opened: false, lowest: null, highest: null, cards: [] },
        hearts: { opened: false, lowest: null, highest: null, cards: [] },
        diamonds: { opened: false, lowest: null, highest: null, cards: [] },
        clubs: { opened: false, lowest: null, highest: null, cards: [] },
    };

    const starterHolder = game.players.find((player) => player.hand.some((card) => card.id === STARTER_CARD_ID));
    if (!starterHolder) throw new Error("The opening 7♥ was not dealt.");

    const starterCard = removeCardFromHand(starterHolder, STARTER_CARD_ID);
    placeCardOnLayout(game, starterCard);

    const starterIndex = game.players.findIndex((player) => player.id === starterHolder.id);
    game.currentPlayerId = game.players[(starterIndex + 1) % game.players.length]?.id || null;
    game.status = STATUS.PLAYING;
    game.winnerId = null;
    game.result = null;
    game.turnNumber = 1;
    game.roundNumber += 1;
    game.lastActionAt = Date.now();

    return game;
}

export function createGame(room) {
    assertRoomPlayers(room);

    const players = room.players.map((player, seat) => ({
        id: player.id,
        username: player.username,
        seat,
        connected: player.connected !== false,
        socketId: player.socketId || null,
        hand: [],
        score: 0,
        roundScore: 0,
        status: "active",
    }));

    const game = {
        roomCode: normalizeRoomCode(room.code),
        gameId: "satte-pe-satta",
        status: STATUS.PLAYING,
        players,
        layout: {
            spades: { opened: false, lowest: null, highest: null, cards: [] },
            hearts: { opened: false, lowest: null, highest: null, cards: [] },
            diamonds: { opened: false, lowest: null, highest: null, cards: [] },
            clubs: { opened: false, lowest: null, highest: null, cards: [] },
        },
        currentPlayerId: null,
        winnerId: null,
        result: null,
        turnNumber: 1,
        roundNumber: 1,
        createdAt: Date.now(),
        lastActionAt: Date.now(),
    };

    const deck = shuffleDeck(createDeck());
    const hands = dealDeck(deck, players);
    for (const player of players) player.hand = hands.get(player.id);

    const starterHolder = players.find((player) => player.hand.some((card) => card.id === STARTER_CARD_ID));
    if (!starterHolder) throw new Error("The opening 7♥ was not dealt.");

    const starterCard = removeCardFromHand(starterHolder, STARTER_CARD_ID);
    placeCardOnLayout(game, starterCard);

    starterHolder.status = starterHolder.hand.length === 0 ? "winner" : "active";
    const starterIndex = players.findIndex((player) => player.id === starterHolder.id);
    game.currentPlayerId = players[(starterIndex + 1) % players.length]?.id || null;

    return game;
}

export function getPlayer(game, playerId) {
    return game?.players?.find((player) => player.id === playerId) || null;
}

export function markPlayerConnection(game, playerId, connected, socketId = null) {
    const player = getPlayer(game, playerId);
    if (!player) throw new Error("Player not found.");
    player.connected = connected;
    if (socketId) player.socketId = socketId;
    return player;
}

export function playCard(game, playerId, cardId) {
    if (game.status !== STATUS.PLAYING) throw new Error("The game is already complete.");
    if (game.currentPlayerId !== playerId) throw new Error("It is not your turn.");

    const player = getPlayer(game, playerId);
    if (!player) throw new Error("Player not found.");
    if (!player.hand.some((card) => card.id === cardId)) throw new Error("That card is not in your hand.");

    const legalMoves = getLegalMoves(game, playerId);
    if (!legalMoves.some((card) => card.id === cardId)) {
        throw new Error("That card cannot be played right now.");
    }

    const card = removeCardFromHand(player, cardId);
    if (!card) throw new Error("That card could not be removed from your hand.");

    placeCardOnLayout(game, card);
    game.lastActionAt = Date.now();
    game.turnNumber += 1;

    if (player.hand.length === 0) {
        completeRound(game, player.id);
        return {
            type: game.status === STATUS.COMPLETE ? "game-complete" : "round-complete",
            card,
            nextPlayerId: null,
            result: game.result,
        };
    }

    const nextPlayerId = advanceTurn(game);
    return {
        type: "play",
        card,
        nextPlayerId,
    };
}

export function passTurn(game, playerId) {
    if (game.status !== STATUS.PLAYING) throw new Error("The game is already complete.");
    if (game.currentPlayerId !== playerId) throw new Error("It is not your turn.");

    const legalMoves = getLegalMoves(game, playerId);
    if (legalMoves.length > 0) throw new Error("You must play a legal card when one is available.");

    const player = getPlayer(game, playerId);
    game.turnNumber += 1;
    game.lastActionAt = Date.now();
    const nextPlayerId = advanceTurn(game);

    return {
        type: "pass",
        playerId: player.id,
        nextPlayerId,
    };
}

export function getPublicState(game) {
    return {
        gameId: game.gameId,
        roomCode: game.roomCode,
        status: game.status,
        turnNumber: game.turnNumber,
        roundNumber: game.roundNumber,
        targetScore: TARGET_SCORE,
        currentPlayerId: game.currentPlayerId,
        winnerId: game.winnerId,
        layout: Object.fromEntries(
            SUITS.map((suit) => [suit, {
                opened: game.layout[suit].opened,
                cards: game.layout[suit].cards.map((card) => ({
                    id: card.id,
                    rank: card.rank,
                    suit: card.suit,
                    value: card.value,
                })),
            }])
        ),
        players: game.players.map((player) => ({
            id: player.id,
            username: player.username,
            seat: player.seat,
            connected: player.connected,
            cardCount: player.hand.length,
            score: player.score,
            roundScore: player.roundScore,
            status: player.status,
        })),
        result: game.result,
    };
}

export function getPrivateState(game, playerId) {
    const player = getPlayer(game, playerId);
    if (!player) throw new Error("Player not found.");

    return {
        ...getPublicState(game),
        me: {
            id: player.id,
            username: player.username,
            hand: player.hand.map((card) => ({
                id: card.id,
                rank: card.rank,
                suit: card.suit,
                value: card.value,
            })),
            legalMoves: getLegalMoves(game, playerId).map((card) => card.id),
        },
    };
}

export function getDebugSummary(game) {
    return {
        status: game.status,
        currentPlayerId: game.currentPlayerId,
        hands: Object.fromEntries(game.players.map((player) => [player.id, player.hand.length])),
        placed: SUITS.reduce((total, suit) => total + game.layout[suit].cards.length, 0),
    };
}

export const helpers = {
    rankIndex,
    cardAtBoundary,
    getPlayer,
    calculatePenalty,
    suitSymbol: (suit) => SUIT_SYMBOLS[suit] || "",
};
