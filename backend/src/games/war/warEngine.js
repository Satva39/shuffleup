import {
    DECK_SIZE,
    GAME_ID,
    MAX_PLAYERS,
    MIN_PLAYERS,
    PHASE,
    RANKS,
    STATUS,
    SUITS,
    WAR_FACE_DOWN_CARDS,
    rankValue,
} from "./warRules.js";

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
            id: `${rank}${suit.code}`,
            rank,
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
    };
}

function findPlayer(game, playerId) {
    return game.players.find((player) => player.id === playerId);
}

function activePlayers(game) {
    return game.players.filter((player) => player.cards.length > 0 || game.currentBattle?.tiedPlayerIds?.includes(player.id));
}

function currentFaceUpCards(game) {
    return game.battle.filter((entry) => !entry.faceDown && entry.stage === "comparison");
}

function eliminateIfEmpty(game) {
    game.players.forEach((player) => {
        if (player.cards.length === 0) player.eliminated = true;
    });
}

function setWinner(game, winnerId, reason = "card-count") {
    const winner = findPlayer(game, winnerId);
    game.status = STATUS.COMPLETE;
    game.phase = PHASE.BATTLE_RESULT;
    game.winnerId = winnerId;
    game.resultReason = reason;
    game.currentBattle.result = winner
        ? { winnerId, winnerName: winner.username, reason }
        : { winnerId: null, winnerName: null, reason };
    eliminateIfEmpty(game);
}

function collectBattle(game, winnerId) {
    const winner = findPlayer(game, winnerId);
    if (!winner) throw new Error("Battle winner not found.");

    const collected = game.battle.map((entry) => entry.card);
    const revealed = currentFaceUpCards(game);
    winner.cards.push(...shuffle(collected));
    game.currentBattle.faceUpCards = revealed;
    game.lastCollectedCount = collected.length;
    game.battle = [];
    eliminateIfEmpty(game);

    const remaining = game.players.filter((player) => !player.eliminated);
    if (remaining.length === 1) {
        setWinner(game, remaining[0].id, "last-player-standing");
        return remaining[0].id;
    }

    if (remaining.length === 0) {
        game.status = STATUS.COMPLETE;
        game.phase = PHASE.BATTLE_RESULT;
        game.winnerId = null;
        game.resultReason = "draw-by-exhaustion";
        return null;
    }

    game.phase = PHASE.BATTLE_RESULT;
    return winnerId;
}

function startComparison(game, participants) {
    game.currentBattle.comparisonPlayerIds = participants.map((player) => player.id);
    game.currentBattle.faceUpCards = game.battle
        .filter((entry) => !entry.faceDown && entry.stage === "comparison" && participants.some((player) => player.id === entry.playerId))
        .map((entry) => ({ playerId: entry.playerId, card: sanitizeCard(entry.card) }));
}

export function createWarGame(room, random = Math.random) {
    if (!room || room.gameId !== GAME_ID) throw new Error("Invalid War room.");
    if (!Number.isInteger(room.players?.length) || room.players.length < MIN_PLAYERS || room.players.length > MAX_PLAYERS) {
        throw new Error(`War supports exactly ${MIN_PLAYERS} players.`);
    }

    const deck = shuffle(createDeck(), random);
    const players = room.players.map((player, index) => ({
        id: player.id,
        username: player.username,
        seat: index + 1,
        socketId: player.socketId || null,
        connected: player.connected !== false,
        cards: deck.slice(index * (DECK_SIZE / 2), (index + 1) * (DECK_SIZE / 2)),
        eliminated: false,
    }));

    return {
        roomCode: String(room.code).toUpperCase(),
        gameId: GAME_ID,
        status: STATUS.PLAYING,
        phase: PHASE.READY,
        players,
        battle: [],
        currentBattle: {
            number: 0,
            warDepth: 0,
            tiedPlayerIds: [],
            comparisonPlayerIds: [],
            faceUpCards: [],
            warFaceDownCount: 0,
            result: null,
        },
        lastCollectedCount: 0,
        winnerId: null,
        resultReason: null,
        nextBattleAt: null,
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

export function canAdvance(game) {
    return (game.status === STATUS.PLAYING && (game.phase === PHASE.READY || game.phase === PHASE.BATTLE_RESULT) && game.players.every((player) => player.connected));
}

export function startBattle(game) {
    if (game.status !== STATUS.PLAYING) throw new Error("The War game is complete.");
    if (![PHASE.READY, PHASE.BATTLE_RESULT].includes(game.phase)) throw new Error("The current battle must finish first.");

    const available = game.players.filter((player) => player.cards.length > 0);
    if (available.length <= 1) {
        if (available.length === 1) setWinner(game, available[0].id, "last-player-standing");
        return null;
    }

    game.currentBattle = {
        number: game.currentBattle.number + 1,
        warDepth: 0,
        tiedPlayerIds: [],
        comparisonPlayerIds: available.map((player) => player.id),
        faceUpCards: [],
        warFaceDownCount: 0,
        result: null,
    };
    game.lastCollectedCount = 0;
    game.nextBattleAt = null;
    game.battle = [];

    available.forEach((player) => {
        const card = player.cards.pop();
        game.battle.push({
            card,
            playerId: player.id,
            faceDown: false,
            stage: "comparison",
        });
    });

    startComparison(game, available);
    game.phase = PHASE.BATTLE_REVEAL;

    return clone(game.currentBattle.faceUpCards);
}

export function resolveBattle(game) {
    if (game.status !== STATUS.PLAYING) throw new Error("The War game is complete.");
    if (game.phase !== PHASE.BATTLE_REVEAL) throw new Error("There is no battle waiting to resolve.");

    const cards = currentFaceUpCards(game);
    if (cards.length !== game.currentBattle.comparisonPlayerIds.length) {
        throw new Error("The battle reveal is incomplete.");
    }

    const high = Math.max(...cards.map((entry) => rankValue(entry.card.rank)));
    const tiedPlayerIds = cards.filter((entry) => rankValue(entry.card.rank) === high).map((entry) => entry.playerId);

    if (tiedPlayerIds.length === 1) {
        const winnerId = tiedPlayerIds[0];
        game.currentBattle.tiedPlayerIds = [];
        const winnerCard = cards.find((entry) => entry.playerId === winnerId)?.card || null;
        collectBattle(game, winnerId);
        const winner = findPlayer(game, winnerId);
        game.currentBattle.result = {
            winnerId,
            winnerName: winner?.username || "Winner",
            winnerCard: sanitizeCard(winnerCard),
            reason: "higher-card",
        };
        return { type: "win", winnerId, winnerCard };
    }

    game.currentBattle.tiedPlayerIds = tiedPlayerIds;
    game.currentBattle.warDepth += 1;
    game.currentBattle.warFaceDownCount = 0;
    game.currentBattle.faceUpCards = cards;
    game.phase = PHASE.WAR;
    return { type: "war", tiedPlayerIds };
}

export function playWarFaceDown(game) {
    if (game.status !== STATUS.PLAYING) throw new Error("The War game is complete.");
    if (game.phase !== PHASE.WAR) throw new Error("War is not active.");

    const tiedPlayers = game.currentBattle.tiedPlayerIds.map((id) => findPlayer(game, id)).filter(Boolean);
    if (tiedPlayers.length < 2) throw new Error("War requires two tied players.");

    game.currentBattle.faceUpCards = [];
    tiedPlayers.forEach((player) => {
        if (player.cards.length > 0 && game.currentBattle.warFaceDownCount < WAR_FACE_DOWN_CARDS * tiedPlayers.length) {
            const card = player.cards.pop();
            game.battle.push({ card, playerId: player.id, faceDown: true, stage: "war" });
            game.currentBattle.warFaceDownCount += 1;
        }
    });

    game.phase = PHASE.WAR_REVEAL;
    return {
        faceDownCount: game.currentBattle.warFaceDownCount,
        tiedPlayerIds: [...game.currentBattle.tiedPlayerIds],
    };
}

export function resolveWar(game) {
    if (game.status !== STATUS.PLAYING) throw new Error("The War game is complete.");
    if (game.phase !== PHASE.WAR_REVEAL) throw new Error("War is not waiting for a reveal.");

    const tiedPlayers = game.currentBattle.tiedPlayerIds.map((id) => findPlayer(game, id)).filter(Boolean);
    const faceUp = [];

    for (const player of tiedPlayers) {
        if (player.cards.length <= 0) continue;
        const card = player.cards.pop();
        game.battle.push({ card, playerId: player.id, faceDown: false, stage: "comparison" });
        faceUp.push({ playerId: player.id, card: sanitizeCard(card) });
    }

    game.currentBattle.faceUpCards = faceUp;
    const ableToRevealIds = faceUp.map((entry) => entry.playerId);

    if (ableToRevealIds.length === 1) {
        const winnerId = ableToRevealIds[0];
        const winnerCard = faceUp[0].card;
        collectBattle(game, winnerId);
        const winner = findPlayer(game, winnerId);
        game.currentBattle.result = {
            winnerId,
            winnerName: winner?.username || "Winner",
            winnerCard: sanitizeCard(winnerCard),
            reason: "opponent-exhausted",
        };
        return { type: "win-by-exhaustion", winnerId, winnerCard };
    }

    if (ableToRevealIds.length === 0) {
        game.status = STATUS.COMPLETE;
        game.phase = PHASE.BATTLE_RESULT;
        game.winnerId = null;
        game.resultReason = "draw-by-exhaustion";
        game.currentBattle.result = {
            winnerId: null,
            winnerName: null,
            reason: "draw-by-exhaustion",
        };
        eliminateIfEmpty(game);
        return { type: "draw", winnerId: null };
    }

    const high = Math.max(...faceUp.map((entry) => rankValue(entry.card.rank)));
    const winners = faceUp.filter((entry) => rankValue(entry.card.rank) === high).map((entry) => entry.playerId);

    if (winners.length === 1) {
        const winnerId = winners[0];
        const winnerCard = faceUp.find((entry) => entry.playerId === winnerId)?.card || null;
        collectBattle(game, winnerId);
        const winner = findPlayer(game, winnerId);
        game.currentBattle.result = {
            winnerId,
            winnerName: winner?.username || "Winner",
            winnerCard: sanitizeCard(winnerCard),
            reason: "higher-card",
        };
        return { type: "win", winnerId, winnerCard };
    }

    game.currentBattle.tiedPlayerIds = winners;
    game.currentBattle.warDepth += 1;
    game.currentBattle.warFaceDownCount = 0;
    game.phase = PHASE.WAR;
    return { type: "war", tiedPlayerIds: winners };
}

function publicPlayer(player) {
    return {
        id: player.id,
        username: player.username,
        seat: player.seat,
        connected: player.connected,
        cardCount: player.cards.length,
        eliminated: player.eliminated,
    };
}

function publicState(game) {
    const comparisonCards = game.phase === PHASE.BATTLE_RESULT && game.currentBattle.faceUpCards.length
        ? game.currentBattle.faceUpCards
        : game.battle
            .filter((entry) => !entry.faceDown && entry.stage === "comparison")
            .map((entry) => ({ playerId: entry.playerId, card: sanitizeCard(entry.card) }));

    return {
        roomCode: game.roomCode,
        gameId: game.gameId,
        status: game.status,
        phase: game.phase,
        players: game.players.map(publicPlayer),
        battleCount: game.currentBattle.number,
        warDepth: game.currentBattle.warDepth,
        tiedPlayerIds: [...game.currentBattle.tiedPlayerIds],
        revealedCards: comparisonCards,
        faceDownCount: game.battle.filter((entry) => entry.faceDown).length,
        battlePileCount: game.battle.length,
        lastCollectedCount: game.lastCollectedCount,
        winnerId: game.winnerId,
        resultReason: game.resultReason,
        result: clone(game.currentBattle.result),
        nextBattleAt: game.nextBattleAt || null,
    };
}

export function getPublicState(game) {
    return publicState(game);
}

export function getPrivateState(game, playerId) {
    const player = findPlayer(game, playerId);
    if (!player) throw new Error("You are not part of this War game.");

    return {
        ...publicState(game),
        playerId,
        yourCardCount: player.cards.length,
    };
}

export function getDeckForTests() {
    return createDeck();
}

export function getAllCardsForTests(game) {
    return [
        ...game.players.flatMap((player) => player.cards),
        ...game.battle.map((entry) => entry.card),
    ];
}
