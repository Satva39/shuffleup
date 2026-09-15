import {
    GAME_ID,
    MAX_PLAYERS,
    MIN_PLAYERS,
    PLAYER_STATUS,
    RANKS,
    REMOVED_CARD,
    STATUS,
    SUITS,
    TURN_TIMEOUT_MS,
    sameRank,
    validatePlayerCount,
} from "./jackThiefRules.js";

function cloneCard(card) {
    return { ...card };
}

function clonePlayers(players) {
    return players.map((player) => ({
        ...player,
        cards: player.cards.map(cloneCard),
    }));
}

function shuffle(items) {
    const cards = [...items];
    for (let index = cards.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [cards[index], cards[swapIndex]] = [cards[swapIndex], cards[index]];
    }
    return cards;
}

export function createDeck() {
    const deck = [];
    for (const rank of RANKS) {
        for (const suit of SUITS) {
            const id = `${rank}${suit.code}`;
            if (id === REMOVED_CARD) continue;
            deck.push({
                id,
                rank,
                suit: suit.code,
                symbol: suit.symbol,
                color: suit.color,
            });
        }
    }
    return deck;
}

function findPairsInHand(cards) {
    const used = new Set();
    const pairs = [];
    const byRank = new Map();

    cards.forEach((card, index) => {
        if (!byRank.has(card.rank)) byRank.set(card.rank, []);
        byRank.get(card.rank).push({ card, index });
    });

    for (const entries of byRank.values()) {
        for (let index = 0; index + 1 < entries.length; index += 2) {
            const first = entries[index];
            const second = entries[index + 1];
            if (!sameRank(first.card, second.card)) continue;
            used.add(first.index);
            used.add(second.index);
            pairs.push([first.card, second.card]);
        }
    }

    return {
        pairs,
        remaining: cards.filter((_, index) => !used.has(index)),
    };
}

function removePairsFromAllHands(game) {
    const removedPairs = [];
    for (const player of game.players) {
        const result = findPairsInHand(player.cards);
        player.cards = result.remaining;
        for (const pair of result.pairs) {
            removedPairs.push({
                playerId: player.id,
                cards: pair.map(cloneCard),
            });
        }
    }
    return removedPairs;
}

function nextActiveIndex(game, fromIndex) {
    const total = game.players.length;
    for (let offset = 1; offset <= total; offset += 1) {
        const index = (fromIndex + offset) % total;
        const player = game.players[index];
        if (player.status === PLAYER_STATUS.ACTIVE && player.cards.length > 0) {
            return index;
        }
    }
    return -1;
}

function markFinishedIfNeeded(game, player) {
    if (player.status === PLAYER_STATUS.ACTIVE && player.cards.length === 0) {
        player.status = PLAYER_STATUS.FINISHED;
        player.finishedAt = Date.now();
        player.eliminationPlace = game.eliminationOrder.length + 1;
        game.eliminationOrder.push(player.id);
        return true;
    }
    return false;
}

function checkCompletion(game) {
    const remainingCards = game.players.flatMap((player) => player.cards);
    if (remainingCards.length !== 1) return false;

    const finalCard = remainingCards[0];
    if (finalCard.rank !== "J") return false;

    const loser = game.players.find((player) => player.cards.some((card) => card.id === finalCard.id));
    if (!loser) return false;

    loser.status = PLAYER_STATUS.LOSER;
    game.loserId = loser.id;
    game.finalJack = cloneCard(finalCard);
    game.status = STATUS.COMPLETE;
    game.currentPlayerId = null;
    game.targetPlayerId = null;
    game.turnStartedAt = null;
    game.turnDeadline = null;
    return true;
}

export function createJackThiefGame(room) {
    const playerCount = room.players.length;
    if (!validatePlayerCount(playerCount)) {
        throw new Error(`Jack Thief supports ${MIN_PLAYERS}-${MAX_PLAYERS} players.`);
    }

    const players = room.players.map((player, seat) => ({
        id: player.id,
        username: player.username,
        seat,
        connected: Boolean(player.connected),
        socketId: player.socketId || null,
        status: PLAYER_STATUS.ACTIVE,
        cards: [],
        finishedAt: null,
        eliminationPlace: null,
    }));

    return {
        roomCode: room.code,
        gameId: GAME_ID,
        status: STATUS.WAITING,
        players,
        deck: [],
        currentPlayerId: null,
        targetPlayerId: null,
        direction: "clockwise",
        round: 1,
        eliminationOrder: [],
        loserId: null,
        finalJack: null,
        removedPairs: [],
        turnStartedAt: null,
        turnDeadline: null,
        started: false,
        autoDrawTimers: new Map(),
    };
}

export function startJackThief(game) {
    if (game.started) return game;
    if (!validatePlayerCount(game.players.length)) {
        throw new Error(`Jack Thief supports ${MIN_PLAYERS}-${MAX_PLAYERS} players.`);
    }

    const deck = shuffle(createDeck());
    game.deck = [];

    deck.forEach((card, index) => {
        game.players[index % game.players.length].cards.push(cloneCard(card));
    });

    game.removedPairs = removePairsFromAllHands(game);
    game.started = true;
    game.status = STATUS.PLAYING;

    for (const player of game.players) {
        markFinishedIfNeeded(game, player);
    }

    const firstIndex = game.players.findIndex(
        (player) => player.status === PLAYER_STATUS.ACTIVE && player.cards.length > 0
    );
    if (firstIndex === -1 || checkCompletion(game)) return game;

    game.currentPlayerId = game.players[firstIndex].id;
    setTurnDeadline(game);
    return game;
}

function setTurnDeadline(game) {
    if (!game.currentPlayerId) return;
    game.turnStartedAt = Date.now();
    game.turnDeadline = game.turnStartedAt + TURN_TIMEOUT_MS;
}

export function getPlayer(game, playerId) {
    return game.players.find((player) => player.id === playerId) || null;
}

export function markConnected(game, playerId, socketId) {
    const player = getPlayer(game, playerId);
    if (!player) throw new Error("Player not found in Jack Thief game.");
    player.connected = true;
    player.socketId = socketId;
    if (player.status === PLAYER_STATUS.DISCONNECTED) player.status = PLAYER_STATUS.ACTIVE;
    return player;
}

export function markDisconnected(game, playerId, socketId) {
    const player = getPlayer(game, playerId);
    if (!player) return null;
    if (player.socketId && socketId && player.socketId !== socketId) return player;
    player.connected = false;
    player.socketId = null;
    if (player.status === PLAYER_STATUS.ACTIVE) player.status = PLAYER_STATUS.DISCONNECTED;
    return player;
}

export function reconnectPlayer(game, playerId, socketId) {
    const player = markConnected(game, playerId, socketId);
    const timer = game.autoDrawTimers.get(playerId);
    if (timer) {
        clearTimeout(timer);
        game.autoDrawTimers.delete(playerId);
    }
    if (game.started && game.status === STATUS.PLAYING && player.status === PLAYER_STATUS.ACTIVE) {
        setTurnDeadline(game);
    }
    return player;
}

function assertPlayableTurn(game, playerId) {
    if (!game.started || game.status !== STATUS.PLAYING) throw new Error("Jack Thief is not currently playing.");
    if (game.currentPlayerId !== playerId) throw new Error("It is not your turn.");
    const player = getPlayer(game, playerId);
    if (!player || player.status !== PLAYER_STATUS.ACTIVE) throw new Error("You are not an active player.");
    return player;
}

function resolveAfterAction(game, actingIndex) {
    const player = game.players[actingIndex];
    markFinishedIfNeeded(game, player);

    if (checkCompletion(game)) return;

    const nextIndex = nextActiveIndex(game, actingIndex);
    if (nextIndex === -1) {
        if (!checkCompletion(game)) throw new Error("No eligible player remains.");
        return;
    }

    const nextPlayer = game.players[nextIndex];
    game.currentPlayerId = nextPlayer.id;
    game.targetPlayerId = null;
    setTurnDeadline(game);
}

export function drawCard(game, playerId, targetPlayerId, cardIndex) {
    const actor = assertPlayableTurn(game, playerId);
    const actorIndex = game.players.findIndex((player) => player.id === playerId);
    const targetIndex = game.players.findIndex((player) => player.id === targetPlayerId);
    if (targetIndex === -1) throw new Error("Target player not found.");

    const target = game.players[targetIndex];
    const expectedTargetIndex = nextActiveIndex(game, actorIndex);
    if (expectedTargetIndex === -1 || targetIndex !== expectedTargetIndex) {
        throw new Error("You may only draw from the next active player.");
    }
    if (target.id === actor.id) throw new Error("You cannot draw from yourself.");
    if (!Number.isInteger(cardIndex) || cardIndex < 0 || cardIndex >= target.cards.length) {
        throw new Error("That hidden card position is no longer available.");
    }

    const [drawnCard] = target.cards.splice(cardIndex, 1);
    actor.cards.push(drawnCard);

    const pairResult = findPairsInHand(actor.cards);
    actor.cards = pairResult.remaining;
    game.removedPairs.push(...pairResult.pairs.map((cards) => ({
        playerId: actor.id,
        cards: cards.map(cloneCard),
    })));

    resolveAfterAction(game, actorIndex);

    return {
        drawnCard: cloneCard(drawnCard),
        formedPairs: pairResult.pairs.map((cards) => cards.map(cloneCard)),
        targetPlayerId: target.id,
    };
}

export function autoDraw(game, playerId) {
    if (game.status !== STATUS.PLAYING || game.currentPlayerId !== playerId) return null;
    const actor = getPlayer(game, playerId);
    if (!actor || actor.status !== PLAYER_STATUS.DISCONNECTED) return null;

    const actorIndex = game.players.findIndex((player) => player.id === playerId);
    const targetIndex = nextActiveIndex(game, actorIndex);
    if (targetIndex === -1) return null;

    const target = game.players[targetIndex];
    if (!target.cards.length) return null;

    const randomIndex = Math.floor(Math.random() * target.cards.length);
    const result = drawCard(game, playerId, target.id, randomIndex);
    return { ...result, automatic: true };
}

export function scheduleDisconnectAutoDraw(game, playerId, callback) {
    if (game.status !== STATUS.PLAYING || game.currentPlayerId !== playerId) return;
    const existing = game.autoDrawTimers.get(playerId);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(() => {
        game.autoDrawTimers.delete(playerId);
        callback();
    }, TURN_TIMEOUT_MS);

    game.autoDrawTimers.set(playerId, timer);
}

function safeCards(cards) {
    return cards.map(cloneCard);
}

export function getPublicGameState(game) {
    return {
        roomCode: game.roomCode,
        gameId: game.gameId,
        status: game.status,
        started: game.started,
        currentPlayerId: game.currentPlayerId,
        targetPlayerId: game.currentPlayerId
            ? getTargetPlayerId(game, game.currentPlayerId)
            : null,
        direction: game.direction,
        round: game.round,
        turnDeadline: game.turnDeadline,
        players: game.players.map((player) => ({
            id: player.id,
            username: player.username,
            seat: player.seat,
            connected: player.connected,
            status: player.status,
            cardCount: player.cards.length,
            eliminationPlace: player.eliminationPlace,
        })),
        eliminationOrder: [...game.eliminationOrder],
        loserId: game.loserId,
        finalJack: game.finalJack ? cloneCard(game.finalJack) : null,
    };
}

function getTargetPlayerId(game, playerId) {
    const index = game.players.findIndex((player) => player.id === playerId);
    if (index === -1) return null;
    const targetIndex = nextActiveIndex(game, index);
    return targetIndex === -1 ? null : game.players[targetIndex].id;
}

export function getPrivateGameState(game, playerId) {
    const privatePlayer = getPlayer(game, playerId);
    if (!privatePlayer) throw new Error("Player not found in Jack Thief game.");

    return {
        ...getPublicGameState(game),
        playerId,
        hand: safeCards(privatePlayer.cards),
        legalActions:
            game.status === STATUS.PLAYING &&
                game.currentPlayerId === playerId &&
                privatePlayer.status === PLAYER_STATUS.ACTIVE
                ? ["draw-card"]
                : [],
    };
}

export function inspectGame(game) {
    return {
        roomCode: game.roomCode,
        status: game.status,
        players: clonePlayers(game.players),
        currentPlayerId: game.currentPlayerId,
        targetPlayerId: getTargetPlayerId(game, game.currentPlayerId),
        eliminationOrder: [...game.eliminationOrder],
        loserId: game.loserId,
        finalJack: game.finalJack ? cloneCard(game.finalJack) : null,
    };
}

export const JACK_THIEF_CONFIG = Object.freeze({
    minPlayers: MIN_PLAYERS,
    maxPlayers: MAX_PLAYERS,
    removedCard: REMOVED_CARD,
    turnTimeoutMs: TURN_TIMEOUT_MS,
});
