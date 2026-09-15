import crypto from "crypto";

import {
    ACTIONS,
    GAME_STATUS,
    HAND_SIZE,
    MAX_PENALTY,
    PLAYER_STATUS,
    RANKS,
    RANK_VALUES,
    SUITS,
    validatePlayerCount,
} from "./indianRummyRules.js";

function createDeck() {
    const deck = [];

    for (const deckNumber of [1, 2]) {
        for (const suit of SUITS) {
            for (const rank of RANKS) {
                deck.push({
                    id: `${deckNumber}-${rank}-${suit}`,
                    rank,
                    suit,
                    value: RANK_VALUES[rank],
                    printedJoker: false,
                });
            }
        }
    }

    deck.push(
        { id: "joker-1", rank: "JOKER", suit: null, value: 0, printedJoker: true },
        { id: "joker-2", rank: "JOKER", suit: null, value: 0, printedJoker: true },
    );

    return deck;
}

function shuffleDeck(deck) {
    const shuffled = [...deck];

    for (let i = shuffled.length - 1; i > 0; i -= 1) {
        const randomBytes = crypto.randomBytes(4);
        const j = randomBytes.readUInt32BE(0) % (i + 1);
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
}

function cardIsJoker(card, wildJokerRank) {
    return Boolean(card?.printedJoker) || card?.rank === wildJokerRank;
}

function chooseWildJoker(deck) {
    const eligible = deck.filter((card) => !card.printedJoker);
    return eligible[crypto.randomBytes(4).readUInt32BE(0) % eligible.length].rank;
}

function rotatePlayers(roomPlayers) {
    return roomPlayers.map((player, index) => ({
        id: player.id,
        username: player.username,
        seat: index,
        socketId: player.socketId || null,
        connected: player.connected !== false,
        status: PLAYER_STATUS.ACTIVE,
        score: 0,
        cards: [],
        hasDrawn: false,
        hasDiscarded: false,
    }));
}

function buildGroups(cards, wildJokerRank) {
    const groups = [];
    const wildcards = cards.filter((card) => cardIsJoker(card, wildJokerRank));
    const natural = cards.filter((card) => !cardIsJoker(card, wildJokerRank));

    // Sets: same rank, different suits. Wildcards can complete the set.
    const byRank = new Map();
    for (const card of natural) {
        if (!byRank.has(card.rank)) byRank.set(card.rank, []);
        byRank.get(card.rank).push(card);
    }

    for (const [rank, rankCards] of byRank.entries()) {
        if (rankCards.length + wildcards.length < 3) continue;
        const uniqueSuits = new Set(rankCards.map((card) => card.suit));
        if (uniqueSuits.size !== rankCards.length) continue;
        const size = Math.min(4, rankCards.length + wildcards.length);
        groups.push({
            type: "set",
            cards: [...rankCards, ...wildcards.slice(0, Math.max(0, size - rankCards.length))],
            pure: false,
        });
    }

    for (const suit of SUITS) {
        const suitCards = natural.filter((card) => card.suit === suit);
        const rankIndex = new Map(RANKS.map((rank, index) => [rank, index]));
        const sorted = [...suitCards].sort((a, b) => rankIndex.get(a.rank) - rankIndex.get(b.rank));

        // Generate natural contiguous runs, plus A-2-3 and Q-K-A.
        for (let start = 0; start < sorted.length; start += 1) {
            let run = [sorted[start]];
            for (let end = start + 1; end < sorted.length; end += 1) {
                const prev = rankIndex.get(run[run.length - 1].rank);
                const current = rankIndex.get(sorted[end].rank);
                if (current === prev + 1) {
                    run.push(sorted[end]);
                } else {
                    break;
                }
            }
            if (run.length >= 3) groups.push({ type: "sequence", cards: run, pure: true });
        }

        const ace = suitCards.find((card) => card.rank === "A");
        const two = suitCards.find((card) => card.rank === "2");
        const three = suitCards.find((card) => card.rank === "3");
        if (ace && two && three) groups.push({ type: "sequence", cards: [ace, two, three], pure: true });

        const queen = suitCards.find((card) => card.rank === "Q");
        const king = suitCards.find((card) => card.rank === "K");
        if (queen && king && ace) groups.push({ type: "sequence", cards: [queen, king, ace], pure: true });
    }

    // Impure sequences with wildcards. We keep these candidates compact and let the partition search decide.
    for (const suit of SUITS) {
        const suitCards = natural.filter((card) => card.suit === suit);
        const rankIndex = new Map(RANKS.map((rank, index) => [rank, index]));
        const present = new Set(suitCards.map((card) => rankIndex.get(card.rank)));

        for (let start = 0; start < RANKS.length; start += 1) {
            for (let length = 3; length <= 13 && start + length <= RANKS.length; length += 1) {
                const needed = [];
                const members = [];
                for (let offset = 0; offset < length; offset += 1) {
                    const index = start + offset;
                    const rank = RANKS[index];
                    const card = suitCards.find((candidate) => candidate.rank === rank);
                    if (card) members.push(card);
                    else needed.push(index);
                }
                if (needed.length > 0 && needed.length <= wildcards.length && members.length >= 2) {
                    groups.push({
                        type: "sequence",
                        cards: [...members, ...wildcards.slice(0, needed.length)],
                        pure: false,
                    });
                }
            }
        }

        // A-2-3 and Q-K-A variants with jokers.
        for (const target of [["A", "2", "3"], ["Q", "K", "A"]]) {
            const members = [];
            let missing = 0;
            for (const rank of target) {
                const card = suitCards.find((candidate) => candidate.rank === rank);
                if (card) members.push(card); else missing += 1;
            }
            if (missing > 0 && missing <= wildcards.length && members.length >= 2) {
                groups.push({
                    type: "sequence",
                    cards: [...members, ...wildcards.slice(0, missing)],
                    pure: false,
                });
            }
        }
    }

    return dedupeGroups(groups);
}

function dedupeGroups(groups) {
    const seen = new Set();
    return groups.filter((group) => {
        const key = `${group.type}:${group.cards.map((card) => card.id).sort().join(",")}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function isValidSequenceCards(cards, wildJokerRank) {
    if (cards.length < 3) return false;
    const jokers = cards.filter((card) => cardIsJoker(card, wildJokerRank));
    const natural = cards.filter((card) => !cardIsJoker(card, wildJokerRank));
    if (natural.length === 0) return false;
    if (new Set(natural.map((card) => card.suit)).size !== 1) return false;
    if (new Set(natural.map((card) => card.rank)).size !== natural.length) return false;

    const indexes = natural.map((card) => RANKS.indexOf(card.rank)).sort((a, b) => a - b);
    const gaps = indexes.slice(1).reduce((total, value, index) => total + Math.max(0, value - indexes[index] - 1), 0);
    const totalGap = gaps + Math.max(0, cards.length - 1 - (indexes[indexes.length - 1] - indexes[0]));

    if (indexes[0] === 0 && indexes.includes(1) && indexes.includes(2) && natural.length >= 2) {
        if (cards.length === 3) return true;
    }
    if (natural.some((card) => card.rank === "Q") && natural.some((card) => card.rank === "K") && natural.some((card) => card.rank === "A")) {
        return true;
    }

    return totalGap <= jokers.length;
}

function isValidSetCards(cards, wildJokerRank) {
    if (cards.length < 3 || cards.length > 4) return false;
    const natural = cards.filter((card) => !cardIsJoker(card, wildJokerRank));
    if (natural.length === 0) return false;
    if (new Set(natural.map((card) => card.rank)).size !== 1) return false;
    return new Set(natural.map((card) => card.suit)).size === natural.length;
}

export function findWinningGrouping(cards, wildJokerRank) {
    const groups = buildGroups(cards, wildJokerRank);
    const byId = new Map(cards.map((card) => [card.id, card]));
    const fullMask = (1 << cards.length) - 1;
    const indexByCardId = new Map(cards.map((card, index) => [card.id, index]));
    const candidates = groups
        .filter((group) => group.cards.every((card) => byId.has(card.id)))
        .filter((group) => group.type === "sequence" ? isValidSequenceCards(group.cards, wildJokerRank) : isValidSetCards(group.cards, wildJokerRank))
        .map((group) => {
            let mask = 0;
            for (const card of group.cards) mask |= 1 << indexByCardId.get(card.id);
            return { ...group, mask };
        });

    const memo = new Map();
    function search(mask, pureCount, sequenceCount) {
        const key = `${mask}|${pureCount}|${sequenceCount}`;
        if (memo.has(key)) return memo.get(key);
        if (mask === fullMask) {
            return pureCount >= 1 && sequenceCount >= 2 ? [] : null;
        }

        const firstBit = mask === 0 ? 1 : ((fullMask ^ mask) & -(fullMask ^ mask));
        const firstIndex = Math.log2(firstBit);
        const options = candidates.filter((candidate) => {
            const candidateFirst = candidate.mask & firstBit;
            return candidateFirst && (candidate.mask & mask) === 0;
        });

        for (const candidate of options) {
            const next = search(
                mask | candidate.mask,
                pureCount + (candidate.pure ? 1 : 0),
                sequenceCount + (candidate.type === "sequence" ? 1 : 0),
            );
            if (next) {
                const result = [candidate, ...next];
                memo.set(key, result);
                return result;
            }
        }

        memo.set(key, null);
        return null;
    }

    return search(0, 0, 0);
}

export function validateDeclaration(cards, wildJokerRank) {
    if (cards.length !== HAND_SIZE) {
        return { valid: false, reason: `A declaration requires ${HAND_SIZE} cards.` };
    }
    const grouping = findWinningGrouping(cards, wildJokerRank);
    if (!grouping) {
        return { valid: false, reason: "Invalid declaration. You need at least one pure sequence and two sequences." };
    }
    return { valid: true, groups: grouping };
}

export function calculatePenalty(cards, wildJokerRank) {
    const grouping = findBestPartialGrouping(cards, wildJokerRank);
    const used = new Set(grouping.flatMap((group) => group.cards.map((card) => card.id)));
    const deadwood = cards.filter((card) => !used.has(card.id));
    const points = deadwood.reduce((total, card) => total + (cardIsJoker(card, wildJokerRank) ? 0 : card.value), 0);
    return {
        points: Math.min(MAX_PENALTY, points),
        groups: grouping,
        deadwood,
    };
}

function findBestPartialGrouping(cards, wildJokerRank) {
    const groups = buildGroups(cards, wildJokerRank);
    const index = new Map(cards.map((card, i) => [card.id, i]));
    const candidates = groups.map((group) => ({
        ...group,
        mask: group.cards.reduce((mask, card) => mask | (1 << index.get(card.id)), 0),
    }));
    const memo = new Map();

    function search(mask) {
        if (memo.has(mask)) return memo.get(mask);
        let best = [];
        for (const candidate of candidates) {
            if ((candidate.mask & mask) !== 0) continue;
            const rest = search(mask | candidate.mask);
            if (candidate.cards.length + rest.reduce((n, g) => n + g.cards.length, 0) > best.reduce((n, g) => n + g.cards.length, 0)) {
                best = [candidate, ...rest];
            }
        }
        memo.set(mask, best);
        return best;
    }

    return search(0);
}

export function createIndianRummyGame(room) {
    validatePlayerCount(room.players.length);
    const deck = shuffleDeck(createDeck());
    const wildJoker = chooseWildJoker(deck);
    const players = rotatePlayers(room.players);
    let cursor = 0;

    for (let round = 0; round < HAND_SIZE; round += 1) {
        for (const player of players) {
            player.cards.push(deck[cursor]);
            cursor += 1;
        }
    }

    const discardPile = [deck[cursor]];
    cursor += 1;

    return {
        roomCode: room.code,
        gameId: "indian-rummy",
        status: GAME_STATUS.PLAYING,
        players,
        drawPile: deck.slice(cursor),
        discardPile,
        currentPlayerId: players[0].id,
        wildJoker,
        winner: null,
        round: 1,
        turnNumber: 1,
        lastAction: "deal",
        result: null,
    };
}

function getPlayer(game, userId) {
    const player = game.players.find((item) => item.id === userId);
    if (!player) throw new Error("You are not part of this game.");
    return player;
}

function ensureTurn(game, userId) {
    if (game.status !== GAME_STATUS.PLAYING) throw new Error("This game has already finished.");
    if (game.currentPlayerId !== userId) throw new Error("It is not your turn.");
}

function nextActivePlayer(game, userId) {
    const index = game.players.findIndex((player) => player.id === userId);
    for (let step = 1; step <= game.players.length; step += 1) {
        const player = game.players[(index + step) % game.players.length];
        if (player.status !== PLAYER_STATUS.DECLARED) return player;
    }
    return null;
}

export function applyAction(game, userId, action, cardId = null) {
    const player = getPlayer(game, userId);
    ensureTurn(game, userId);

    if (action === ACTIONS.DRAW_CLOSED) {
        if (player.hasDrawn) throw new Error("You have already drawn this turn.");
        if (game.drawPile.length === 0) throw new Error("The closed deck is empty.");
        player.cards.push(game.drawPile.pop());
        player.hasDrawn = true;
        game.lastAction = "draw-closed";
        return;
    }

    if (action === ACTIONS.DRAW_DISCARD) {
        if (player.hasDrawn) throw new Error("You have already drawn this turn.");
        if (game.discardPile.length === 0) throw new Error("The discard pile is empty.");
        player.cards.push(game.discardPile.pop());
        player.hasDrawn = true;
        game.lastAction = "draw-discard";
        return;
    }

    if (action === ACTIONS.DISCARD) {
        if (!player.hasDrawn) throw new Error("Draw a card before discarding.");
        if (player.hasDiscarded) throw new Error("You have already discarded this turn.");
        if (player.cards.length !== HAND_SIZE + 1) throw new Error("Your hand is not ready to discard.");
        const cardIndex = player.cards.findIndex((card) => card.id === cardId);
        if (cardIndex === -1) throw new Error("That card is not in your hand.");
        const [card] = player.cards.splice(cardIndex, 1);
        game.discardPile.push(card);
        player.hasDrawn = false;
        player.hasDiscarded = true;
        const next = nextActivePlayer(game, userId);
        if (!next) throw new Error("No active player is available.");
        game.currentPlayerId = next.id;
        game.turnNumber += 1;
        for (const item of game.players) {
            item.hasDrawn = false;
            item.hasDiscarded = false;
        }
        game.lastAction = "discard";
        return;
    }

    if (action === ACTIONS.DECLARE) {
        if (!player.hasDrawn) throw new Error("Draw a card before declaring.");
        if (player.cards.length !== HAND_SIZE + 1) throw new Error("Your hand must contain 14 cards before declaration.");
        const declarationCards = player.cards;
        const validation = validateDeclaration(declarationCards.slice().filter((card) => card.id !== cardId), game.wildJoker);
        if (!validation.valid) throw new Error(validation.reason);
        game.status = GAME_STATUS.COMPLETE;
        game.winner = userId;
        player.status = PLAYER_STATUS.WINNER;
        game.result = buildResult(game, userId, validation.groups);
        game.lastAction = "declare";
        return;
    }

    throw new Error("Unsupported Rummy action.");
}

function buildResult(game, winnerId, winningGroups) {
    const players = game.players.map((player) => {
        if (player.id === winnerId) {
            return { id: player.id, username: player.username, score: 0, status: "winner", groups: winningGroups };
        }
        const penalty = calculatePenalty(player.cards, game.wildJoker);
        player.score += penalty.points;
        return { id: player.id, username: player.username, score: player.score, status: "finished", groups: penalty.groups };
    });
    return { winnerId, players };
}

export function markPlayerDisconnected(game, userId) {
    const player = getPlayer(game, userId);
    player.connected = false;
    if (game.status === GAME_STATUS.PLAYING) player.status = PLAYER_STATUS.DISCONNECTED;
}

export function reconnectPlayer(game, userId) {
    const player = getPlayer(game, userId);
    player.connected = true;
    if (player.status === PLAYER_STATUS.DISCONNECTED) player.status = PLAYER_STATUS.ACTIVE;
}

function publicCard(card) {
    return {
        id: card.id,
        rank: card.rank,
        suit: card.suit,
        value: card.value,
        printedJoker: card.printedJoker,
    };
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
            hasDrawn: player.hasDrawn,
        })),
        currentPlayerId: game.currentPlayerId,
        wildJoker: game.wildJoker,
        discardTop: game.discardPile.length ? publicCard(game.discardPile[game.discardPile.length - 1]) : null,
        discardCount: game.discardPile.length,
        drawCount: game.drawPile.length,
        round: game.round,
        turnNumber: game.turnNumber,
        lastAction: game.lastAction,
        winner: game.winner,
        result: game.result,
    };
}

export function getPrivateGameState(game, userId) {
    const player = getPlayer(game, userId);
    return {
        ...getPublicGameState(game),
        you: {
            id: player.id,
            username: player.username,
            seat: player.seat,
            status: player.status,
            score: player.score,
            hasDrawn: player.hasDrawn,
            hasDiscarded: player.hasDiscarded,
            cards: player.cards.map(publicCard),
        },
    };
}
