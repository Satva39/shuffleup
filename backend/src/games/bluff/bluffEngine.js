import crypto from "node:crypto";
import {
    CHALLENGE_WINDOW_MS,
    GAME_ID,
    MAX_CARDS_PER_CLAIM,
    MAX_PLAYERS,
    MIN_PLAYERS,
    PHASE,
    RANKS,
    STATUS,
    SUITS,
    isValidClaimCount,
    nextRank,
    validatePlayerCount,
} from "./bluffRules.js";

function clone(value) {
    if (value === undefined) return undefined;
    return JSON.parse(JSON.stringify(value));
}

function createDeck() {
    return RANKS.flatMap((rank) =>
        SUITS.map((suit) => ({
            id: `${rank}${suit.code}`,
            rank,
            suit: suit.code,
            symbol: suit.symbol,
            color: suit.color,
        }))
    );
}

function shuffle(deck) {
    for (let i = deck.length - 1; i > 0; i -= 1) {
        const j = crypto.randomInt(i + 1);
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

function dealDeck(deck, players) {
    let cursor = 0;
    while (cursor < deck.length) {
        const player = players[cursor % players.length];
        player.hand.push(deck[cursor]);
        cursor += 1;
    }
}

function sanitizeCard(card) {
    return {
        id: card.id,
        rank: card.rank,
        suit: card.suit,
        symbol: card.symbol,
        color: card.color,
    };
}

function findPlayer(game, playerId) {
    return game.players.find((player) => player.id === playerId) || null;
}

function playerByIndex(game, index) {
    return game.players[index] || null;
}

function nextActiveIndex(game, startIndex) {
    for (let step = 1; step <= game.players.length; step += 1) {
        const index = (startIndex + step) % game.players.length;
        const player = game.players[index];
        if (player && !player.eliminated) return index;
    }
    return startIndex;
}

function createClaim(game, player, cards) {
    const claim = {
        id: crypto.randomUUID(),
        playerId: player.id,
        rank: game.requiredRank,
        count: cards.length,
        cardIds: cards.map((card) => card.id),
        startedAt: Date.now(),
        expiresAt: Date.now() + CHALLENGE_WINDOW_MS,
        finalAttempt: player.hand.length === 0,
    };

    game.currentClaim = claim;
    game.claimHistory.push({
        id: claim.id,
        playerId: claim.playerId,
        rank: claim.rank,
        count: claim.count,
        createdAt: claim.startedAt,
    });
    game.phase = claim.finalAttempt ? PHASE.FINAL_CHALLENGE : PHASE.CHALLENGE;
    return claim;
}

function recordPenaltyResult(game, payload) {
    game.lastChallenge = {
        ...payload,
        resolvedAt: Date.now(),
    };

    const history = game.claimHistory.find((item) => item.id === payload.claimId);
    if (history) {
        history.result = payload.result;
        history.challengerId = payload.challengerId;
        history.penaltyRecipientId = payload.penaltyRecipientId;
    }
}

function transferPile(game, player) {
    player.hand.push(...game.pile.map((entry) => entry.card));
    game.pile = [];
}

function finishGame(game, winnerId) {
    game.status = STATUS.COMPLETE;
    game.phase = PHASE.PLAY;
    game.winnerId = winnerId;
    game.currentPlayerId = winnerId;
    game.turnActorId = winnerId;
    game.currentClaim = null;
    game.challengeExpiresAt = null;
}

export function createBluffGame(room) {
    const players = (room.players || []).map((player, index) => ({
        id: player.id,
        username: player.username,
        seat: index,
        connected: player.connected !== false,
        socketId: player.socketId || null,
        hand: [],
        eliminated: false,
    }));

    if (!validatePlayerCount(players.length)) {
        throw new Error(`Bluff requires ${MIN_PLAYERS}-${MAX_PLAYERS} players.`);
    }

    shuffle(createDeck()).forEach((card, index) => {
        players[index % players.length].hand.push(card);
    });

    const firstPlayer = players[0];

    return {
        roomCode: String(room.code).toUpperCase(),
        gameId: GAME_ID,
        status: STATUS.PLAYING,
        phase: PHASE.PLAY,
        players,
        requiredRank: RANKS[0],
        currentClaim: null,
        claimHistory: [],
        pile: [],
        challengeExpiresAt: null,
        lastChallenge: null,
        currentPlayerId: firstPlayer.id,
        turnActorId: firstPlayer.id,
        winnerId: null,
        startedAt: Date.now(),
    };
}

export function getGamePlayer(game, playerId) {
    return findPlayer(game, playerId);
}

export function markPlayerConnection(game, playerId, connected, socketId = null) {
    const player = findPlayer(game, playerId);
    if (!player) return false;
    player.connected = connected;
    if (socketId) player.socketId = socketId;
    return true;
}

export function playCards(game, playerId, cardIds) {
    if (game.status !== STATUS.PLAYING) throw new Error("The Bluff game is complete.");
    if (game.phase !== PHASE.PLAY) throw new Error("The current claim must be resolved first.");
    if (game.currentPlayerId !== playerId) throw new Error("It is not your turn.");

    const player = findPlayer(game, playerId);
    if (!player) throw new Error("Player not found.");
    if (!Array.isArray(cardIds)) throw new Error("Select one or more cards.");
    if (!isValidClaimCount(cardIds.length) || cardIds.length > MAX_CARDS_PER_CLAIM) {
        throw new Error(`You can play 1-${MAX_CARDS_PER_CLAIM} cards per claim.`);
    }

    const uniqueIds = new Set(cardIds);
    if (uniqueIds.size !== cardIds.length) throw new Error("A card cannot be played twice.");

    const selected = cardIds.map((cardId) => player.hand.find((card) => card.id === cardId));
    if (selected.some((card) => !card)) throw new Error("One or more selected cards are not in your hand.");

    const selectedIdSet = new Set(cardIds);
    player.hand = player.hand.filter((card) => !selectedIdSet.has(card.id));

    selected.forEach((card) => {
        game.pile.push({
            card,
            claimId: null,
            playerId,
            rank: game.requiredRank,
            order: game.pile.length,
        });
    });

    const claim = createClaim(game, player, selected);
    selected.forEach((entry) => {
        const pileEntry = game.pile[game.pile.length - selected.length + selected.indexOf(entry)];
        pileEntry.claimId = claim.id;
    });

    game.challengeExpiresAt = claim.expiresAt;
    game.turnActorId = playerId;

    return {
        claim,
        player,
    };
}

export function resolveChallenge(game, challengerId) {
    if (game.status !== STATUS.PLAYING) throw new Error("The Bluff game is complete.");
    if (![PHASE.CHALLENGE, PHASE.FINAL_CHALLENGE].includes(game.phase)) {
        throw new Error("There is no active claim to challenge.");
    }

    const challenger = findPlayer(game, challengerId);
    if (!challenger) throw new Error("Player not found.");
    if (!game.currentClaim) throw new Error("There is no claim to challenge.");
    if (game.currentClaim.playerId === challengerId) throw new Error("You cannot challenge your own claim.");

    const claim = game.currentClaim;
    const claimant = findPlayer(game, claim.playerId);
    if (!claimant) throw new Error("Claiming player not found.");

    const relevantEntries = game.pile.filter((entry) => entry.claimId === claim.id);
    const revealedCards = relevantEntries.map((entry) => sanitizeCard(entry.card));
    const truthful = relevantEntries.length === claim.count && relevantEntries.every((entry) => entry.card.rank === claim.rank);
    const result = truthful ? "TRUTH" : "BLUFF";
    const penaltyRecipient = truthful ? challenger : claimant;

    transferPile(game, penaltyRecipient);

    recordPenaltyResult(game, {
        claimId: claim.id,
        claimantId: claimant.id,
        challengerId: challenger.id,
        claimantUsername: claimant.username,
        challengerUsername: challenger.username,
        claimedRank: claim.rank,
        claimedCount: claim.count,
        revealedCards,
        result,
        penaltyRecipientId: penaltyRecipient.id,
        penaltyRecipientUsername: penaltyRecipient.username,
    });

    const nextRequiredRank = nextRank(claim.rank);

    if (truthful && claim.finalAttempt && claimant.hand.length === 0) {
        finishGame(game, claimant.id);
        return game.lastChallenge;
    }

    if (result === "BLUFF") {
        game.currentPlayerId = claimant.id;
    } else {
        game.currentPlayerId = challenger.id;
    }

    game.turnActorId = game.currentPlayerId;
    game.requiredRank = nextRequiredRank;
    game.currentClaim = null;
    game.phase = PHASE.PLAY;
    game.challengeExpiresAt = null;

    return game.lastChallenge;
}

export function expireChallengeWindow(game, claimId, now = Date.now()) {
    if (game.status !== STATUS.PLAYING) return { advanced: false, completed: false, expired: false };
    if (![PHASE.CHALLENGE, PHASE.FINAL_CHALLENGE].includes(game.phase)) {
        return { advanced: false, completed: false, expired: false };
    }
    if (!game.currentClaim || game.currentClaim.id !== claimId) {
        return { advanced: false, completed: false, expired: false };
    }
    if (!game.challengeExpiresAt || now < game.challengeExpiresAt) {
        return { advanced: false, completed: false, expired: false };
    }

    const result = advanceAfterChallengeWindow(game, claimId);
    return { ...result, expired: true };
}

export function advanceAfterChallengeWindow(game, claimId) {
    if (game.status !== STATUS.PLAYING) return { advanced: false, completed: false };
    if (![PHASE.CHALLENGE, PHASE.FINAL_CHALLENGE].includes(game.phase)) return { advanced: false, completed: false };
    if (!game.currentClaim || game.currentClaim.id !== claimId) return { advanced: false, completed: false };

    const claim = game.currentClaim;
    const claimant = findPlayer(game, claim.playerId);
    if (!claimant) throw new Error("Claiming player not found.");

    if (claim.finalAttempt && claimant.hand.length === 0) {
        finishGame(game, claimant.id);
        return { advanced: true, completed: true };
    }

    const currentIndex = game.players.findIndex((player) => player.id === claimant.id);
    const nextIndex = nextActiveIndex(game, currentIndex);
    game.currentPlayerId = game.players[nextIndex]?.id || claimant.id;
    game.turnActorId = game.currentPlayerId;
    game.requiredRank = nextRank(claim.rank);
    game.currentClaim = null;
    game.phase = PHASE.PLAY;
    game.challengeExpiresAt = null;

    return { advanced: true, completed: false };
}

function publicPlayer(player) {
    return {
        id: player.id,
        username: player.username,
        seat: player.seat,
        connected: player.connected,
        cardCount: player.hand.length,
    };
}

function publicClaim(game) {
    if (!game.currentClaim) return null;
    const claimant = findPlayer(game, game.currentClaim.playerId);
    return {
        id: game.currentClaim.id,
        playerId: game.currentClaim.playerId,
        playerName: claimant?.username || "Player",
        rank: game.currentClaim.rank,
        count: game.currentClaim.count,
        expiresAt: game.currentClaim.expiresAt,
        finalAttempt: game.currentClaim.finalAttempt,
    };
}

function publicHistory(game) {
    return game.claimHistory.slice(-12).map((item) => {
        const player = findPlayer(game, item.playerId);
        const challenger = item.challengerId ? findPlayer(game, item.challengerId) : null;
        const penalty = item.penaltyRecipientId ? findPlayer(game, item.penaltyRecipientId) : null;
        return {
            id: item.id,
            playerId: item.playerId,
            playerName: player?.username || "Player",
            rank: item.rank,
            count: item.count,
            result: item.result || null,
            challengerId: item.challengerId || null,
            challengerName: challenger?.username || null,
            penaltyRecipientId: item.penaltyRecipientId || null,
            penaltyRecipientName: penalty?.username || null,
        };
    });
}

function basePublicState(game) {
    return {
        roomCode: game.roomCode,
        gameId: game.gameId,
        status: game.status,
        phase: game.phase,
        requiredRank: game.requiredRank,
        currentPlayerId: game.currentPlayerId,
        turnActorId: game.turnActorId,
        players: game.players.map(publicPlayer),
        pileCount: game.pile.length,
        currentClaim: publicClaim(game),
        challengeExpiresAt: game.challengeExpiresAt,
        claimHistory: publicHistory(game),
        lastChallenge: clone(game.lastChallenge),
        winnerId: game.winnerId,
    };
}

export function getPublicState(game) {
    return basePublicState(game);
}

export function getPrivateState(game, playerId) {
    const player = findPlayer(game, playerId);
    if (!player) throw new Error("You are not part of this Bluff game.");

    return {
        ...basePublicState(game),
        playerId,
        seat: player.seat,
        hand: player.hand.map(sanitizeCard),
        selectableCardIds: game.currentPlayerId === playerId && game.phase === PHASE.PLAY
            ? player.hand.map((card) => card.id)
            : [],
        canPlay: game.currentPlayerId === playerId && game.phase === PHASE.PLAY && game.status === STATUS.PLAYING,
        canChallenge: [PHASE.CHALLENGE, PHASE.FINAL_CHALLENGE].includes(game.phase)
            && game.status === STATUS.PLAYING
            && game.currentClaim?.playerId !== playerId,
    };
}

export function getDeckForTests() {
    return createDeck();
}
