import {
    DECK_SIZE,
    DRAW_COUNT,
    FOUNDATION_PILES,
    GAME_ID,
    MAX_PLAYERS,
    MIN_PLAYERS,
    PLAYER_STATUS,
    RANKS,
    STATUS,
    SUITS,
    TABLEAU_COLUMNS,
    isSameColor,
    rankValue,
} from "./solitaireRules.js";

const games = new Map();

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

function shuffle(cards, random = Math.random) {
    const result = [...cards];

    for (let index = result.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(random() * (index + 1));
        [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
    }

    return result;
}

function createDeck() {
    return SUITS.flatMap((suit) =>
        RANKS.map((rank) => ({
            id: `${rank.rank}${suit.code}`,
            rank: rank.rank,
            suit: suit.code,
            symbol: suit.symbol,
            color: suit.color,
        }))
    );
}

function sanitizeCard(card) {
    if (!card) return null;

    return {
        id: card.id,
        rank: card.rank,
        suit: card.suit,
        symbol: card.symbol,
        color: card.color,
        faceUp: Boolean(card.faceUp),
    };
}

function publicCard(card) {
    if (!card) return null;

    return {
        id: card.id,
        rank: card.rank,
        suit: card.suit,
        symbol: card.symbol,
        color: card.color,
        faceUp: true,
    };
}

function findPlayer(game, playerId) {
    return game.players.find((player) => player.id === playerId);
}

function normalizeRoomCode(roomCode) {
    return String(roomCode || "").toUpperCase();
}

function getElapsedSeconds(player) {
    if (player.completedAt) {
        return Math.max(
            0,
            Math.floor((player.completedAt - player.startedAt) / 1000)
        );
    }

    return Math.max(
        0,
        Math.floor((Date.now() - player.startedAt) / 1000)
    );
}

function foundationTotal(player) {
    return Object.values(player.foundations).reduce(
        (total, pile) => total + pile.length,
        0
    );
}

function publicPlayer(player) {
    return {
        id: player.id,
        username: player.username,
        seat: player.seat,
        connected: player.connected,
        status: player.completed
            ? PLAYER_STATUS.COMPLETE
            : player.connected
                ? PLAYER_STATUS.PLAYING
                : PLAYER_STATUS.DISCONNECTED,
        foundationCount: foundationTotal(player),
        foundationBySuit: {
            S: player.foundations.S.length,
            H: player.foundations.H.length,
            D: player.foundations.D.length,
            C: player.foundations.C.length,
        },
        progress: foundationTotal(player),
        totalCards: DECK_SIZE,
        score: player.completed
            ? player.score
            : calculateScore(player),
        completionTime: player.completedAt
            ? Math.max(0, Math.floor((player.completedAt - player.startedAt) / 1000))
            : null,
        moves: player.moves,
    };
}

function rankPlayers(game) {
    return [...game.players]
        .sort((left, right) => {
            if (left.completed !== right.completed) {
                return left.completed ? -1 : 1;
            }

            if (left.completed && right.completed) {
                const timeDelta = (left.completionSeconds ?? Infinity) -
                    (right.completionSeconds ?? Infinity);

                if (timeDelta !== 0) return timeDelta;
                return left.moves - right.moves;
            }

            const progressDelta =
                foundationTotal(right) - foundationTotal(left);

            if (progressDelta !== 0) return progressDelta;
            return left.moves - right.moves;
        })
        .map((player, index) => ({
            rank: index + 1,
            id: player.id,
            username: player.username,
            status: player.completed
                ? PLAYER_STATUS.COMPLETE
                : player.connected
                    ? PLAYER_STATUS.PLAYING
                    : PLAYER_STATUS.DISCONNECTED,
            progress: foundationTotal(player),
            score: player.completed
                ? player.score
                : calculateScore(player),
            completionTime: player.completionSeconds,
            moves: player.moves,
        }));
}

function calculateScore(player) {
    const progress = foundationTotal(player);

    if (!player.completed) {
        return Math.max(
            0,
            progress * 100 -
            getElapsedSeconds(player) -
            player.moves
        );
    }

    return Math.max(
        1,
        10000 -
        (player.completionSeconds * 10) -
        player.moves
    );
}

function markComplete(player) {
    if (player.completed) return;

    player.completed = true;
    player.completedAt = Date.now();
    player.completionSeconds = getElapsedSeconds(player);
    player.score = calculateScore(player);
}

function maybeFinishGame(game) {
    if (game.players.length > 0 && game.players.every((player) => player.completed)) {
        game.status = STATUS.COMPLETE;
        game.completedAt = Date.now();
    }
}

function allCardsInPlayerState(player) {
    return [
        ...player.tableau.flat(),
        ...player.stock,
        ...player.waste,
        ...player.foundations.S,
        ...player.foundations.H,
        ...player.foundations.D,
        ...player.foundations.C,
    ];
}

function validatePlayerCardConservation(player) {
    const ids = allCardsInPlayerState(player).map((card) => card.id);

    if (ids.length !== DECK_SIZE || new Set(ids).size !== DECK_SIZE) {
        throw new Error("Solitaire state lost or duplicated a card.");
    }
}

function checkSequence(cards) {
    if (!cards?.length) return false;

    for (let index = 0; index < cards.length; index += 1) {
        if (!cards[index].faceUp) return false;

        if (index === cards.length - 1) continue;

        const current = cards[index];
        const next = cards[index + 1];

        if (rankValue(current.rank) !== rankValue(next.rank) + 1) {
            return false;
        }

        if (isSameColor(current.suit, next.suit)) {
            return false;
        }
    }

    return true;
}

function revealTopCard(column) {
    const top = column[column.length - 1];

    if (top && !top.faceUp) {
        top.faceUp = true;
        return true;
    }

    return false;
}

function canPlaceOnTableau(card, destinationColumn) {
    if (!destinationColumn.length) {
        return card.rank === "K";
    }

    const destination = destinationColumn[destinationColumn.length - 1];

    if (!destination.faceUp) {
        return false;
    }

    return (
        rankValue(destination.rank) === rankValue(card.rank) + 1 &&
        !isSameColor(destination.suit, card.suit)
    );
}

function canPlaceOnFoundation(card, foundation) {
    if (!card) return false;

    if (!foundation.length) {
        return card.rank === "A";
    }

    const top = foundation[foundation.length - 1];

    return (
        top.suit === card.suit &&
        rankValue(card.rank) === rankValue(top.rank) + 1
    );
}

function getSourceCards(player, from) {
    if (!from?.type) {
        throw new Error("A move source is required.");
    }

    if (from.type === "waste") {
        if (!player.waste.length) {
            throw new Error("The waste pile is empty.");
        }

        return [player.waste[player.waste.length - 1]];
    }

    if (from.type === "tableau") {
        const columnIndex = Number(from.columnIndex);
        const cardIndex = Number(from.cardIndex);
        const column = player.tableau[columnIndex];

        if (!Number.isInteger(columnIndex) || !Number.isInteger(cardIndex) || !column) {
            throw new Error("Invalid tableau source.");
        }

        const card = column[cardIndex];

        if (!card || !card.faceUp) {
            throw new Error("That card cannot be moved.");
        }

        const cards = column.slice(cardIndex);

        if (!checkSequence(cards)) {
            throw new Error("That tableau sequence is not valid.");
        }

        return cards;
    }

    throw new Error("Invalid move source.");
}

function removeSourceCards(player, from, count) {
    if (from.type === "waste") {
        player.waste.splice(player.waste.length - count, count);
        return;
    }

    const column = player.tableau[from.columnIndex];
    column.splice(from.cardIndex, count);
    revealTopCard(column);
}

function applyMove(player, { from, to }) {
    const sourceCards = getSourceCards(player, from);

    if (!to?.type) {
        throw new Error("A move destination is required.");
    }

    if (to.type === "tableau") {
        const columnIndex = Number(to.columnIndex);

        if (!Number.isInteger(columnIndex) || !player.tableau[columnIndex]) {
            throw new Error("Invalid tableau destination.");
        }

        if (from.type === "tableau" && Number(from.columnIndex) === columnIndex) {
            throw new Error("The card is already in that tableau column.");
        }

        if (!canPlaceOnTableau(sourceCards[0], player.tableau[columnIndex])) {
            throw new Error("Illegal tableau move.");
        }

        removeSourceCards(player, from, sourceCards.length);
        player.tableau[columnIndex].push(...sourceCards);
    } else if (to.type === "foundation") {
        if (sourceCards.length !== 1) {
            throw new Error("Only one card can be moved to a foundation.");
        }

        const suit = sourceCards[0].suit;

        if (!player.foundations[suit]) {
            throw new Error("Invalid foundation.");
        }

        if (!canPlaceOnFoundation(sourceCards[0], player.foundations[suit])) {
            throw new Error("Illegal foundation move.");
        }

        removeSourceCards(player, from, 1);
        player.foundations[suit].push(sourceCards[0]);
    } else {
        throw new Error("Invalid move destination.");
    }

    player.moves += 1;

    if (foundationTotal(player) === DECK_SIZE) {
        markComplete(player);
    }

    validatePlayerCardConservation(player);
}

function drawFromStock(player) {
    if (player.stock.length) {
        const drawn = player.stock.pop();
        drawn.faceUp = true;
        player.waste.push(drawn);
        player.moves += 1;
        return { type: "draw", card: publicCard(drawn) };
    }

    if (!player.waste.length) {
        throw new Error("The stock and waste are empty.");
    }

    player.stock = player.waste
        .reverse()
        .map((card) => ({ ...card, faceUp: false }));

    player.waste = [];
    player.redeals += 1;
    player.moves += 1;

    return {
        type: "redeal",
        card: null,
        redeals: player.redeals,
    };
}

function createPlayerState(roomPlayer, index, shuffledDeck, startedAt) {
    const player = {
        id: roomPlayer.id,
        username: roomPlayer.username,
        seat: index + 1,
        socketId: roomPlayer.socketId || null,
        connected: roomPlayer.connected !== false,
        tableau: Array.from({ length: TABLEAU_COLUMNS }, () => []),
        stock: [],
        waste: [],
        foundations: { S: [], H: [], D: [], C: [] },
        moves: 0,
        redeals: 0,
        completed: false,
        startedAt,
        completedAt: null,
        completionSeconds: null,
        score: 0,
    };

    let deckIndex = 0;

    for (let columnIndex = 0; columnIndex < TABLEAU_COLUMNS; columnIndex += 1) {
        for (let row = 0; row <= columnIndex; row += 1) {
            const card = {
                ...shuffledDeck[deckIndex],
                faceUp: row === columnIndex,
            };

            player.tableau[columnIndex].push(card);
            deckIndex += 1;
        }
    }

    player.stock = shuffledDeck
        .slice(deckIndex)
        .map((card) => ({ ...card, faceUp: false }));

    validatePlayerCardConservation(player);

    return player;
}

export function createSolitaireGame(room, random = Math.random) {
    if (!room || room.gameId !== GAME_ID) {
        throw new Error("Invalid Solitaire room.");
    }

    if (
        !Number.isInteger(room.players?.length) ||
        room.players.length < MIN_PLAYERS ||
        room.players.length > MAX_PLAYERS
    ) {
        throw new Error(
            `Solitaire supports ${MIN_PLAYERS}-${MAX_PLAYERS} players.`
        );
    }

    const startedAt = Date.now();

    const players = room.players.map((roomPlayer, index) => {
        const deck = shuffle(createDeck(), random);
        return createPlayerState(roomPlayer, index, deck, startedAt);
    });

    return {
        roomCode: normalizeRoomCode(room.code),
        gameId: GAME_ID,
        status: STATUS.PLAYING,
        startedAt,
        completedAt: null,
        players,
    };
}

export function getGame(roomCode) {
    return games.get(normalizeRoomCode(roomCode)) || null;
}

export function setGame(roomCode, game) {
    games.set(normalizeRoomCode(roomCode), game);
    return game;
}

export function ensureGame(room, random = Math.random) {
    const roomCode = normalizeRoomCode(room.code);
    const existing = getGame(roomCode);

    if (existing) return existing;

    const game = createSolitaireGame(room, random);
    setGame(roomCode, game);
    return game;
}

export function removeGame(roomCode) {
    games.delete(normalizeRoomCode(roomCode));
}

export function getGamePlayer(game, playerId) {
    return findPlayer(game, playerId);
}

export function markPlayerConnection(game, playerId, connected, socketId = null) {
    const player = findPlayer(game, playerId);

    if (!player) return false;

    player.connected = connected;

    if (socketId) {
        player.socketId = socketId;
    }

    return true;
}

export function applyPlayerMove(game, playerId, move) {
    if (game.status !== STATUS.PLAYING) {
        throw new Error("The Solitaire game is complete.");
    }

    const player = findPlayer(game, playerId);

    if (!player) {
        throw new Error("You are not part of this Solitaire game.");
    }

    if (player.completed) {
        throw new Error("Your Solitaire board is already complete.");
    }

    if (!player.connected) {
        throw new Error("Reconnect before making moves.");
    }

    applyMove(player, move);
    maybeFinishGame(game);

    return {
        ...getPrivateState(game, playerId),
        moveType: "move",
    };
}

export function drawStock(game, playerId) {
    if (game.status !== STATUS.PLAYING) {
        throw new Error("The Solitaire game is complete.");
    }

    const player = findPlayer(game, playerId);

    if (!player) {
        throw new Error("You are not part of this Solitaire game.");
    }

    if (player.completed) {
        throw new Error("Your Solitaire board is already complete.");
    }

    const result = drawFromStock(player);
    validatePlayerCardConservation(player);

    return {
        ...getPrivateState(game, playerId),
        drawResult: result,
    };
}

function privatePlayerState(player) {
    return {
        id: player.id,
        username: player.username,
        seat: player.seat,
        connected: player.connected,
        status: player.completed
            ? PLAYER_STATUS.COMPLETE
            : player.connected
                ? PLAYER_STATUS.PLAYING
                : PLAYER_STATUS.DISCONNECTED,
        tableau: player.tableau.map((column) =>
            column.map(sanitizeCard)
        ),
        stockCount: player.stock.length,
        stock: player.stock.map((card) => ({
            id: card.id,
            faceUp: false,
        })),
        waste: player.waste.map(sanitizeCard),
        foundations: {
            S: player.foundations.S.map(sanitizeCard),
            H: player.foundations.H.map(sanitizeCard),
            D: player.foundations.D.map(sanitizeCard),
            C: player.foundations.C.map(sanitizeCard),
        },
        progress: foundationTotal(player),
        moves: player.moves,
        redeals: player.redeals,
        score: player.score,
        startedAt: player.startedAt,
        completedAt: player.completedAt,
        completionSeconds: player.completionSeconds,
        elapsedSeconds: getElapsedSeconds(player),
    };
}

export function getPublicState(game) {
    return {
        roomCode: game.roomCode,
        gameId: game.gameId,
        status: game.status,
        startedAt: game.startedAt,
        completedAt: game.completedAt,
        players: game.players.map(publicPlayer),
        rankings: rankPlayers(game),
    };
}

export function getPrivateState(game, playerId) {
    const player = findPlayer(game, playerId);

    if (!player) {
        throw new Error("You are not part of this Solitaire game.");
    }

    return {
        ...getPublicState(game),
        playerId,
        player: privatePlayerState(player),
    };
}

export function completeIfNeeded(game) {
    maybeFinishGame(game);
    return game.status === STATUS.COMPLETE;
}

export function getDeckForTests(random = Math.random) {
    return shuffle(createDeck(), random);
}

export function createPlayerStateForTests(roomPlayer, index, deck, startedAt = Date.now()) {
    return createPlayerState(roomPlayer, index, deck, startedAt);
}

export function validateStateForTests(player) {
    validatePlayerCardConservation(player);
    return true;
}
