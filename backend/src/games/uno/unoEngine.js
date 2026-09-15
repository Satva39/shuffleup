import {
    ACTIONS,
    COLORS,
    GAME_TARGET_SCORE,
    MAX_PLAYERS,
    STARTING_HAND_SIZE,
    STATUS,
    TYPES,
    getCardPoints,
    isWild,
    validatePlayerCount,
} from "./unoRules.js";

function cloneCard(card) {
    return card ? { ...card } : null;
}

function cloneCards(cards = []) {
    return cards.map(cloneCard);
}

function createCard(id, type, color = null, value = null) {
    return { id, type, color, value };
}

export function createDeck() {
    const deck = [];
    let id = 1;

    for (const color of COLORS) {
        deck.push(createCard(`uno-${id++}`, TYPES.NUMBER, color, 0));
        for (let value = 1; value <= 9; value += 1) {
            deck.push(createCard(`uno-${id++}`, TYPES.NUMBER, color, value));
            deck.push(createCard(`uno-${id++}`, TYPES.NUMBER, color, value));
        }
        for (const type of [TYPES.SKIP, TYPES.REVERSE, TYPES.DRAW_TWO]) {
            deck.push(createCard(`uno-${id++}`, type, color));
            deck.push(createCard(`uno-${id++}`, type, color));
        }
    }

    for (let index = 0; index < 4; index += 1) {
        deck.push(createCard(`uno-${id++}`, TYPES.WILD));
        deck.push(createCard(`uno-${id++}`, TYPES.WILD_DRAW_FOUR));
    }

    if (deck.length !== 108) {
        throw new Error("Invalid UNO deck.");
    }

    return deck;
}

export function shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

function getPlayer(game, playerId) {
    return game.players.find((player) => player.id === playerId);
}

function getPlayerIndex(game, playerId) {
    return game.players.findIndex((player) => player.id === playerId);
}

function advanceIndex(game, fromIndex, steps = 1) {
    const length = game.players.length;
    let index = fromIndex;
    for (let step = 0; step < steps; step += 1) {
        index = (index + game.direction + length) % length;
    }
    return index;
}

function nextActivePlayerIndex(game, fromIndex, steps = 1) {
    const length = game.players.length;
    let index = fromIndex;
    let traversed = 0;
    let moves = 0;

    while (traversed < length * 2 && moves < steps) {
        index = (index + game.direction + length) % length;
        traversed += 1;
        const player = game.players[index];
        if (player?.connected !== false) {
            moves += 1;
        }
    }

    if (moves < steps) {
        throw new Error("No connected player can continue the game.");
    }

    return index;
}

function setCurrentPlayerByIndex(game, index) {
    game.currentPlayerId = game.players[index]?.id || null;
    game.turnNumber += 1;
}

function drawFromPile(game) {
    recycleDiscardIfNeeded(game);
    return game.drawPile.pop() || null;
}

export function recycleDiscardIfNeeded(game) {
    if (game.drawPile.length > 0) return;
    if (game.discardPile.length <= 1) {
        throw new Error("No cards available to draw.");
    }

    const top = game.discardPile[game.discardPile.length - 1];
    const recycled = game.discardPile
        .slice(0, -1)
        .map((card) => ({ ...card, activeColor: null }));

    shuffleDeck(recycled);
    game.discardPile = [top];
    game.drawPile = recycled;
}

function deal(game) {
    for (let round = 0; round < STARTING_HAND_SIZE; round += 1) {
        for (const player of game.players) {
            const card = drawFromPile(game);
            if (card) player.hand.push(card);
        }
    }
}

function startDiscard(game) {
    while (game.drawPile.length) {
        const card = drawFromPile(game);
        if (!card) throw new Error("Unable to create starting discard.");

        if (card.type === TYPES.WILD || card.type === TYPES.WILD_DRAW_FOUR) {
            game.drawPile.unshift(card);
            shuffleDeck(game.drawPile);
            continue;
        }

        game.discardPile.push(card);
        game.activeColor = card.color;
        return card;
    }

    throw new Error("Unable to select starting discard.");
}

function resolveStartingCard(game, card, firstIndex) {
    let currentIndex = firstIndex;

    if (card.type === TYPES.REVERSE) {
        if (game.players.length > 2) game.direction *= -1;
        currentIndex = nextActivePlayerIndex(game, firstIndex, 1);
    } else if (card.type === TYPES.SKIP) {
        currentIndex = nextActivePlayerIndex(game, firstIndex, 2);
    } else if (card.type === TYPES.DRAW_TWO) {
        const targetIndex = nextActivePlayerIndex(game, firstIndex, 1);
        const target = game.players[targetIndex];
        for (let index = 0; index < 2; index += 1) {
            const drawn = drawFromPile(game);
            if (drawn) target.hand.push(drawn);
        }
        currentIndex = nextActivePlayerIndex(game, targetIndex, 1);
    }

    game.currentPlayerId = game.players[currentIndex]?.id || null;
    game.turnNumber = 1;
}

function createPlayers(room) {
    return room.players.map((player, seat) => ({
        id: player.id,
        username: player.username,
        seat,
        connected: player.connected !== false,
        socketId: player.socketId || null,
        hand: [],
        score: 0,
        roundScore: 0,
        status: player.connected === false ? "disconnected" : "active",
        unoDeclared: false,
    }));
}

function chooseStartingPlayer(game) {
    const first = game.players.findIndex((player) => player.connected !== false);
    return first >= 0 ? first : 0;
}

export function createUnoGame(room) {
    const players = createPlayers(room);
    validatePlayerCount(players.length);

    if (players.length > MAX_PLAYERS) {
        throw new Error("Too many players for UNO.");
    }

    const game = {
        roomCode: room.code,
        gameId: "uno",
        status: STATUS.PLAYING,
        round: 1,
        turnNumber: 1,
        direction: 1,
        currentPlayerId: null,
        activeColor: null,
        drawPile: shuffleDeck(createDeck()),
        discardPile: [],
        players,
        pendingColorChoice: null,
        pendingUno: null,
        winner: null,
        result: null,
        createdAt: Date.now(),
    };

    deal(game);
    const startingPlayer = chooseStartingPlayer(game);
    game.currentPlayerId = game.players[startingPlayer]?.id || null;
    const openingCard = startDiscard(game);
    resolveStartingCard(game, openingCard, startingPlayer);

    return game;
}

function getCardInHand(player, cardId) {
    return player.hand.find((card) => card.id === cardId);
}

function getTopCard(game) {
    return game.discardPile[game.discardPile.length - 1] || null;
}

function isPlayableCard(game, card, player, { ignoreWildDrawFourRestriction = false } = {}) {
    if (!card || !player) return false;

    if (card.type === TYPES.WILD) return true;

    if (card.type === TYPES.WILD_DRAW_FOUR) {
        if (ignoreWildDrawFourRestriction) return true;
        return !player.hand.some(
            (candidate) =>
                candidate.id !== card.id &&
                candidate.color === game.activeColor
        );
    }

    const topCard = getTopCard(game);
    if (!topCard) return false;

    // A normal card is playable only when it matches the active color,
    // matches the same symbol/action, or (for number cards) matches the value.
    // Do not compare NUMBER cards by type alone because every number card
    // shares the same type.
    if (card.color === game.activeColor) return true;

    if (card.type === TYPES.NUMBER) {
        return topCard.type === TYPES.NUMBER && card.value === topCard.value;
    }

    return card.type === topCard.type;
}

function clearPendingUno(game) {
    game.pendingUno = null;
}

function applySpecialEffect(game, card) {
    const currentIndex = getPlayerIndex(game, game.currentPlayerId);

    if (card.type === TYPES.REVERSE) {
        if (game.players.length === 2) {
            const next = nextActivePlayerIndex(game, currentIndex, 1);
            setCurrentPlayerByIndex(game, next);
            return;
        }
        game.direction *= -1;
        const next = nextActivePlayerIndex(game, currentIndex, 1);
        setCurrentPlayerByIndex(game, next);
        return;
    }

    if (card.type === TYPES.SKIP) {
        const next = nextActivePlayerIndex(game, currentIndex, 2);
        setCurrentPlayerByIndex(game, next);
        return;
    }

    if (card.type === TYPES.DRAW_TWO) {
        const targetIndex = nextActivePlayerIndex(game, currentIndex, 1);
        const target = game.players[targetIndex];
        for (let index = 0; index < 2; index += 1) {
            const drawn = drawFromPile(game);
            if (drawn) target.hand.push(drawn);
        }
        target.unoDeclared = false;
        const next = nextActivePlayerIndex(game, targetIndex, 1);
        setCurrentPlayerByIndex(game, next);
        return;
    }

    if (card.type === TYPES.WILD || card.type === TYPES.WILD_DRAW_FOUR) {
        game.pendingColorChoice = {
            playerId: game.currentPlayerId,
            cardId: card.id,
            penalty: card.type === TYPES.WILD_DRAW_FOUR ? 4 : 0,
        };
        return;
    }

    const next = nextActivePlayerIndex(game, currentIndex, 1);
    setCurrentPlayerByIndex(game, next);
}

function getRoundScore(game, winnerId) {
    return game.players
        .filter((player) => player.id !== winnerId)
        .reduce(
            (total, player) =>
                total + player.hand.reduce((sum, card) => sum + getCardPoints(card), 0),
            0
        );
}

function finalizeRound(game, winnerId) {
    const roundScore = getRoundScore(game, winnerId);
    const winner = getPlayer(game, winnerId);
    winner.roundScore = roundScore;
    winner.score += roundScore;

    for (const player of game.players) {
        if (player.id !== winnerId) {
            player.roundScore = 0;
        }
        player.status = player.id === winnerId ? "winner" : "finished";
    }

    game.winner = winnerId;
    game.status = winner.score >= GAME_TARGET_SCORE ? STATUS.GAME_COMPLETE : STATUS.ROUND_COMPLETE;
    game.result = {
        winnerId,
        winnerUsername: winner.username,
        roundScore,
        gameComplete: game.status === STATUS.GAME_COMPLETE,
        targetScore: GAME_TARGET_SCORE,
        scores: game.players.map((player) => ({
            id: player.id,
            username: player.username,
            roundScore: player.roundScore,
            totalScore: player.score,
            remainingCards: player.hand.length,
        })),
    };
}

function verifyTurn(game, playerId) {
    if (game.status !== STATUS.PLAYING) throw new Error("Game is not active.");
    if (game.pendingColorChoice) throw new Error("Choose a color before continuing.");
    if (game.currentPlayerId !== playerId) throw new Error("It is not your turn.");
}

function maybeClearPendingUno(game, actingPlayerId) {
    if (game.pendingUno && game.pendingUno.playerId !== actingPlayerId) {
        clearPendingUno(game);
    }
}

function playCard(game, playerId, cardId) {
    const player = getPlayer(game, playerId);
    if (!player) throw new Error("You are not part of this game.");
    verifyTurn(game, playerId);

    const cardIndex = player.hand.findIndex((card) => card.id === cardId);
    if (cardIndex < 0) throw new Error("That card is not in your hand.");

    const card = player.hand[cardIndex];
    if (!isPlayableCard(game, card, player)) {
        throw new Error("That card cannot be played now.");
    }

    player.hand.splice(cardIndex, 1);
    game.discardPile.push(card);
    player.unoDeclared = false;
    game.pendingUno = null;

    if (player.hand.length === 0) {
        finalizeRound(game, playerId);
        return {
            type: "round-complete",
            card: cloneCard(card),
            playerId,
        };
    }

    if (player.hand.length === 1) {
        game.pendingUno = {
            playerId,
            turnNumber: game.turnNumber,
            deadlinePlayerId: null,
            declared: false,
        };
    }

    game.activeColor = isWild(card) ? null : card.color;
    if (isWild(card)) {
        game.pendingColorChoice = {
            playerId,
            cardId: card.id,
            penalty: card.type === TYPES.WILD_DRAW_FOUR ? 4 : 0,
        };
    } else {
        applySpecialEffect(game, card);
    }

    if (card.type === TYPES.WILD || card.type === TYPES.WILD_DRAW_FOUR) {
        return {
            type: "color-required",
            card: cloneCard(card),
            playerId,
        };
    }

    return { type: "card-played", card: cloneCard(card), playerId };
}

function chooseColor(game, playerId, color) {
    if (!COLORS.includes(color)) throw new Error("Invalid color.");
    const pending = game.pendingColorChoice;
    if (!pending || pending.playerId !== playerId) {
        throw new Error("No color selection is pending for you.");
    }

    game.activeColor = color;
    game.pendingColorChoice = null;

    if (pending.penalty > 0) {
        const currentIndex = getPlayerIndex(game, playerId);
        const targetIndex = nextActivePlayerIndex(game, currentIndex, 1);
        const target = game.players[targetIndex];
        for (let index = 0; index < pending.penalty; index += 1) {
            const drawn = drawFromPile(game);
            if (drawn) target.hand.push(drawn);
        }
        target.unoDeclared = false;
        const nextIndex = nextActivePlayerIndex(game, targetIndex, 1);
        setCurrentPlayerByIndex(game, nextIndex);
    } else {
        const currentIndex = getPlayerIndex(game, playerId);
        const nextIndex = nextActivePlayerIndex(game, currentIndex, 1);
        setCurrentPlayerByIndex(game, nextIndex);
    }

    return { type: "color-chosen", playerId, color };
}

function drawCard(game, playerId) {
    const player = getPlayer(game, playerId);
    if (!player) throw new Error("You are not part of this game.");
    verifyTurn(game, playerId);
    maybeClearPendingUno(game, playerId);

    const drawn = drawFromPile(game);
    if (!drawn) throw new Error("Unable to draw a card.");
    player.hand.push(drawn);

    if (isPlayableCard(game, drawn, player)) {
        return { type: "card-drawn-playable", card: cloneCard(drawn), playerId, canPlayDrawn: true };
    }

    const currentIndex = getPlayerIndex(game, playerId);
    const nextIndex = nextActivePlayerIndex(game, currentIndex, 1);
    setCurrentPlayerByIndex(game, nextIndex);
    return { type: "card-drawn", card: cloneCard(drawn), playerId, canPlayDrawn: false };
}

function declareUno(game, playerId) {
    const player = getPlayer(game, playerId);
    if (!player) throw new Error("You are not part of this game.");
    if (player.hand.length !== 1) throw new Error("UNO can only be declared with one card remaining.");
    if (!game.pendingUno || game.pendingUno.playerId !== playerId) throw new Error("There is no active UNO declaration to confirm.");

    player.unoDeclared = true;
    game.pendingUno.declared = true;
    return { type: "uno-declared", playerId };
}

function callUno(game, callerId, targetId) {
    const caller = getPlayer(game, callerId);
    const target = getPlayer(game, targetId);
    if (!caller) throw new Error("You are not part of this game.");
    if (!target) throw new Error("Target player not found.");
    if (target.hand.length !== 1) throw new Error("That player is not currently on UNO.");
    if (!game.pendingUno || game.pendingUno.playerId !== targetId) throw new Error("That UNO call is no longer valid.");
    if (target.unoDeclared) throw new Error("That player has already declared UNO.");
    if (callerId === targetId) throw new Error("You cannot call yourself.");

    const penaltyCards = [];
    for (let index = 0; index < 2; index += 1) {
        const drawn = drawFromPile(game);
        if (drawn) {
            target.hand.push(drawn);
            penaltyCards.push(cloneCard(drawn));
        }
    }

    clearPendingUno(game);
    target.unoDeclared = false;
    return { type: "uno-called", callerId, targetId, penaltyCount: penaltyCards.length };
}

export function applyAction(game, playerId, action, payload = {}) {
    switch (action) {
        case ACTIONS.PLAY_CARD:
            return playCard(game, playerId, payload.cardId);
        case ACTIONS.DRAW_CARD:
            return drawCard(game, playerId);
        case ACTIONS.CHOOSE_COLOR:
            return chooseColor(game, playerId, payload.color);
        case ACTIONS.DECLARE_UNO:
            return declareUno(game, playerId);
        case ACTIONS.CALL_UNO:
            return callUno(game, playerId, payload.targetId);
        default:
            throw new Error("Invalid UNO action.");
    }
}

function getPublicPlayer(player) {
    return {
        id: player.id,
        username: player.username,
        seat: player.seat,
        connected: player.connected,
        cardCount: player.hand.length,
        status: player.status,
        score: player.score,
        roundScore: player.roundScore,
        unoDeclared: player.unoDeclared && player.hand.length === 1,
    };
}

export function getPublicGameState(game) {
    return {
        roomCode: game.roomCode,
        gameId: game.gameId,
        status: game.status,
        round: game.round,
        turnNumber: game.turnNumber,
        direction: game.direction,
        currentPlayerId: game.currentPlayerId,
        activeColor: game.activeColor,
        discardTop: cloneCard(getTopCard(game)),
        players: game.players.map(getPublicPlayer),
        pendingColorChoice: game.pendingColorChoice ? { playerId: game.pendingColorChoice.playerId } : null,
        pendingUno: game.pendingUno
            ? {
                playerId: game.pendingUno.playerId,
                declared: game.pendingUno.declared,
            }
            : null,
        winner: game.winner,
        result: game.result,
    };
}

export function getPrivateGameState(game, playerId) {
    const player = getPlayer(game, playerId);
    if (!player) return null;

    const legalActions = [];
    const playableCardIds = [];
    const canDraw = game.status === STATUS.PLAYING &&
        !game.pendingColorChoice &&
        game.currentPlayerId === playerId;

    if (canDraw) {
        for (const card of player.hand) {
            if (isPlayableCard(game, card, player)) {
                playableCardIds.push(card.id);
            }
        }
        legalActions.push(ACTIONS.DRAW_CARD);
        if (playableCardIds.length) legalActions.push(ACTIONS.PLAY_CARD);
    }

    if (game.pendingColorChoice?.playerId === playerId) {
        legalActions.push(ACTIONS.CHOOSE_COLOR);
    }

    if (player.hand.length === 1 && game.pendingUno?.playerId === playerId && !player.unoDeclared) {
        legalActions.push(ACTIONS.DECLARE_UNO);
    }

    return {
        ...getPublicGameState(game),
        playerId,
        hand: cloneCards(player.hand),
        playableCardIds,
        legalActions,
        canCallUno: Boolean(
            game.pendingUno &&
            game.pendingUno.playerId !== playerId &&
            game.pendingUno.declared === false &&
            getPlayer(game, game.pendingUno.playerId)?.hand.length === 1
        ),
    };
}

export function markPlayerDisconnected(game, playerId) {
    const player = getPlayer(game, playerId);
    if (player) {
        player.connected = false;
        player.status = "disconnected";
    }
}

export function reconnectPlayer(game, playerId, socketId) {
    const player = getPlayer(game, playerId);
    if (!player) throw new Error("You are not part of this game.");
    player.connected = true;
    player.status = game.winner === playerId ? "winner" : game.status === STATUS.PLAYING ? "active" : "finished";
    player.socketId = socketId;
}

export function startNextRound(game) {
    if (game.status !== STATUS.ROUND_COMPLETE) {
        throw new Error("The current round is not ready to restart.");
    }

    game.round += 1;
    game.status = STATUS.PLAYING;
    game.turnNumber = 1;
    game.direction = 1;
    game.currentPlayerId = null;
    game.activeColor = null;
    game.drawPile = shuffleDeck(createDeck());
    game.discardPile = [];
    game.pendingColorChoice = null;
    game.pendingUno = null;
    game.winner = null;
    game.result = null;

    for (const player of game.players) {
        player.hand = [];
        player.roundScore = 0;
        player.unoDeclared = false;
        player.status = player.connected ? "active" : "disconnected";
    }

    deal(game);
    const startingPlayer = chooseStartingPlayer(game);
    game.currentPlayerId = game.players[startingPlayer]?.id || null;
    const openingCard = startDiscard(game);
    resolveStartingCard(game, openingCard, startingPlayer);
}

export { getPlayer };
