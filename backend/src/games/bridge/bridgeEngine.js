import {
    RANKS,
    RANK_VALUE,
    SEATS,
    NEXT_SEAT,
    PREV_SEAT,
    PARTNERSHIP,
    SUIT_ORDER,
    isBidHigher,
    isVulnerable,
    vulnerabilityLabel,
    calculateContractScore,
    contractLabel,
} from "./bridgeRules.js";

const RANK_POINTS = Object.fromEntries(RANKS.map((rank, index) => [rank, index + 2]));

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

export function createDeck() {
    const suits = ["C", "D", "H", "S"];
    const deck = [];
    for (const suit of suits) {
        for (const rank of RANKS) {
            deck.push({ id: `${rank}${suit}`, rank, suit });
        }
    }
    return deck;
}

export function shuffleDeck(deck, random = Math.random) {
    const result = [...deck];
    for (let i = result.length - 1; i > 0; i -= 1) {
        const j = Math.floor(random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

function seatFromIndex(index) {
    return SEATS[((index % SEATS.length) + SEATS.length) % SEATS.length];
}

function seatIndex(seat) {
    return SEATS.indexOf(seat);
}

function nextSeat(seat) {
    return NEXT_SEAT[seat];
}

function partnership(seat) {
    return PARTNERSHIP[seat];
}

function playerForSeat(game, seat) {
    return game.players.find((player) => player.seat === seat);
}

function playerForId(game, playerId) {
    return game.players.find((player) => player.id === playerId);
}

function oppositeSeat(seat) {
    return nextSeat(nextSeat(seat));
}

function rightOfDeclarer(seat) {
    return PREV_SEAT[seat];
}

function leftOfDeclarer(seat) {
    return NEXT_SEAT[seat];
}

function sortHand(hand) {
    const suitOrder = { S: 0, H: 1, D: 2, C: 3 };
    return hand.sort((a, b) => {
        if (suitOrder[a.suit] !== suitOrder[b.suit]) return suitOrder[a.suit] - suitOrder[b.suit];
        return RANK_VALUE[b.rank] - RANK_VALUE[a.rank];
    });
}

function dealCards(game) {
    const deck = shuffleDeck(createDeck());
    game.players.forEach((player) => {
        player.hand = [];
    });
    deck.forEach((card, index) => {
        game.players[index % 4].hand.push(card);
    });
    game.players.forEach((player) => sortHand(player.hand));
}

function resetAuction(game) {
    game.phase = "auction";
    game.auction = [];
    game.highestBid = null;
    game.contractDouble = 0;
    game.lastContractBidderId = null;
    game.currentSeat = game.dealer;
    game.consecutivePasses = 0;
}

function initializeDeal(game) {
    game.status = "playing";
    game.phase = "auction";
    game.dealNumber += 1;
    game.dealer = SEATS[(game.dealNumber - 1) % 4];
    game.vulnerability = vulnerabilityLabel(game.dealNumber);
    game.players.forEach((player) => {
        player.tricksWon = 0;
        player.hand = [];
        player.status = "active";
    });
    game.contract = null;
    game.dummyRevealed = false;
    game.trick = [];
    game.completedTricks = [];
    game.lastTrickWinner = null;
    game.result = null;
    game.openingLeader = null;
    game.turnActorId = null;
    game.nextRoundReady = false;
    dealCards(game);
    resetAuction(game);
}

export function createBridgeGame(room) {
    if (!room || room.players.length !== 4) {
        throw new Error("Bridge requires exactly four players.");
    }

    const players = room.players.map((player, index) => ({
        id: player.id,
        username: player.username,
        socketId: player.socketId || null,
        connected: player.connected !== false,
        seat: SEATS[index],
        partner: SEATS[(index + 2) % 4],
        hand: [],
        tricksWon: 0,
    }));

    const game = {
        roomCode: room.code.toUpperCase(),
        gameId: "bridge",
        status: "playing",
        phase: "auction",
        dealNumber: 0,
        dealer: "N",
        vulnerability: "None",
        players,
        auction: [],
        highestBid: null,
        contractDouble: 0,
        lastContractBidderId: null,
        consecutivePasses: 0,
        contract: null,
        openingLeader: null,
        currentSeat: null,
        turnActorId: null,
        dummyRevealed: false,
        trick: [],
        completedTricks: [],
        lastTrickWinner: null,
        result: null,
        createdAt: Date.now(),
    };

    initializeDeal(game);
    return game;
}

export function markPlayerConnection(game, playerId, connected, socketId = null) {
    const player = playerForId(game, playerId);
    if (!player) throw new Error("Player not found.");
    player.connected = connected;
    if (socketId) player.socketId = socketId;
}

function actionSide(game, playerId) {
    const player = playerForId(game, playerId);
    return player ? partnership(player.seat) : null;
}

function canDouble(game, playerId) {
    if (!game.highestBid || !game.lastContractBidderId) return false;
    if (game.contractDouble !== 0) return false;
    return actionSide(game, playerId) !== actionSide(game, game.lastContractBidderId);
}

function canRedouble(game, playerId) {
    if (!game.highestBid || game.contractDouble !== 1 || !game.lastContractBidderId) return false;
    return actionSide(game, playerId) === actionSide(game, game.lastContractBidderId);
}

function completeAuction(game) {
    const finalBid = game.highestBid;
    if (!finalBid) {
        game.phase = "deal-complete";
        game.status = "round-complete";
        game.result = {
            passedOut: true,
            dealNumber: game.dealNumber,
            scores: [
                { partnership: "NS", score: 0, made: 0 },
                { partnership: "EW", score: 0, made: 0 },
            ],
        };
        return;
    }

    const winningSide = actionSide(game, game.lastContractBidderId);
    const firstBidder = game.auction.find(
        (entry) => entry.type === "bid" && entry.bid.strain === finalBid.strain && actionSide(game, entry.playerId) === winningSide
    );
    const declarer = playerForId(game, firstBidder.playerId);
    const dummy = playerForSeat(game, oppositeSeat(declarer.seat));
    const leader = playerForSeat(game, leftOfDeclarer(declarer.seat));

    game.contract = {
        level: finalBid.level,
        strain: finalBid.strain,
        doubled: game.contractDouble,
        declarer: declarer.seat,
        declarerId: declarer.id,
        dummy: dummy.seat,
        dummyId: dummy.id,
        defenders: game.players.filter((player) => partnership(player.seat) !== winningSide).map((player) => player.seat),
    };
    game.openingLeader = leader.seat;
    game.phase = "opening-lead";
    game.currentSeat = leader.seat;
    game.turnActorId = leader.id;
    game.dummyRevealed = false;
}

export function submitBid(game, playerId, action) {
    if (game.phase !== "auction") throw new Error("The auction is not active.");
    if (playerForId(game, playerId)?.seat !== game.currentSeat) throw new Error("It is not your turn to bid.");

    const player = playerForId(game, playerId);
    if (!player) throw new Error("Player not found.");

    const type = action?.type || "pass";
    let normalized = { type, playerId, seat: player.seat };

    if (type === "bid") {
        const level = Number(action.level);
        const strain = action.strain;
        if (!Number.isInteger(level) || level < 1 || level > 7 || !SUIT_ORDER.hasOwnProperty(strain)) {
            throw new Error("Invalid bid.");
        }
        const bid = { level, strain };
        if (!isBidHigher(bid, game.highestBid)) throw new Error("Bid must be higher than the current bid.");
        game.highestBid = bid;
        game.lastContractBidderId = playerId;
        game.contractDouble = 0;
        game.consecutivePasses = 0;
        normalized.bid = bid;
    } else if (type === "double") {
        if (!canDouble(game, playerId)) throw new Error("Double is not legal now.");
        game.contractDouble = 1;
        game.consecutivePasses = 0;
    } else if (type === "redouble") {
        if (!canRedouble(game, playerId)) throw new Error("Redouble is not legal now.");
        game.contractDouble = 2;
        game.consecutivePasses = 0;
    } else if (type === "pass") {
        game.consecutivePasses += 1;
        if (game.consecutivePasses >= 3 && game.highestBid) {
            game.auction.push(normalized);
            completeAuction(game);
            return { type: "auction-complete", entry: normalized };
        }
        if (game.consecutivePasses >= 4 && !game.highestBid) {
            game.auction.push(normalized);
            completeAuction(game);
            return { type: "auction-complete", entry: normalized };
        }
    } else {
        throw new Error("Invalid auction action.");
    }

    game.auction.push(normalized);
    game.currentSeat = nextSeat(game.currentSeat);
    game.turnActorId = playerForSeat(game, game.currentSeat).id;
    return { type: "bid-submitted", entry: normalized };
}

function cardInHand(player, cardId) {
    return player.hand.find((card) => card.id === cardId);
}

function removeCardFromHand(player, cardId) {
    const index = player.hand.findIndex((card) => card.id === cardId);
    if (index < 0) return null;
    return player.hand.splice(index, 1)[0];
}

function followSuitLegal(game, player, card) {
    if (!game.trick.length) return true;
    const ledSuit = game.trick[0].card.suit;
    if (card.suit === ledSuit) return true;
    return !player.hand.some((candidate) => candidate.suit === ledSuit);
}

function trickWinner(game, trick) {
    const ledSuit = trick[0].card.suit;
    const trump = game.contract?.strain === "NT" ? null : game.contract?.strain;
    let winner = trick[0];

    for (const played of trick.slice(1)) {
        const a = winner.card;
        const b = played.card;
        const aTrump = trump && a.suit === trump;
        const bTrump = trump && b.suit === trump;
        if (bTrump && !aTrump) winner = played;
        else if (bTrump && aTrump && RANK_VALUE[b.rank] > RANK_VALUE[a.rank]) winner = played;
        else if (!aTrump && !bTrump && a.suit !== b.suit && b.suit === ledSuit) winner = played;
        else if (!aTrump && !bTrump && a.suit === b.suit && RANK_VALUE[b.rank] > RANK_VALUE[a.rank]) winner = played;
    }
    return winner.seat;
}

function advanceAfterPlay(game, playedSeat) {
    const next = nextSeat(playedSeat);
    game.currentSeat = next;
    const dummySeat = game.contract?.dummy;
    const declarerSeat = game.contract?.declarer;

    if (dummySeat && next === dummySeat) {
        game.turnActorId = playerForSeat(game, declarerSeat).id;
    } else {
        game.turnActorId = playerForSeat(game, next).id;
    }
}

function finishTrick(game) {
    const winnerSeat = trickWinner(game, game.trick);
    playerForSeat(game, winnerSeat).tricksWon += 1;
    game.completedTricks.push(clone(game.trick));
    game.lastTrickWinner = winnerSeat;
    game.trick = [];

    if (game.completedTricks.length === 13) {
        finalizeDeal(game);
        return;
    }

    game.currentSeat = winnerSeat;
    const dummySeat = game.contract.dummy;
    game.turnActorId = winnerSeat === dummySeat
        ? playerForSeat(game, game.contract.declarer).id
        : playerForSeat(game, winnerSeat).id;
}

function finalizeDeal(game) {
    const declarer = playerForSeat(game, game.contract.declarer);
    const declarerSide = partnership(declarer.seat);
    const madeTricks = game.players
        .filter((player) => partnership(player.seat) === declarerSide)
        .reduce((sum, player) => sum + player.tricksWon, 0);
    const vulnerable = isVulnerable(game.dealNumber, declarerSide);
    const score = calculateContractScore({
        level: game.contract.level,
        strain: game.contract.strain,
        doubled: game.contract.doubled,
        madeTricks,
        vulnerable,
    });
    const target = game.contract.level + 6;

    game.result = {
        passedOut: false,
        dealNumber: game.dealNumber,
        contract: clone(game.contract),
        contractLabel: contractLabel(game.contract),
        declarerSide,
        vulnerable,
        madeTricks,
        requiredTricks: target,
        score,
        made: madeTricks >= target,
        tricksBySeat: Object.fromEntries(game.players.map((player) => [player.seat, player.tricksWon])),
        nsScore: declarerSide === "NS" ? score : -score,
        ewScore: declarerSide === "EW" ? score : -score,
    };
    game.phase = "deal-complete";
    game.status = "round-complete";
}

export function playCard(game, playerId, cardId, sourceSeat = null) {
    if (!game.contract) throw new Error("No contract exists.");
    if (!playerForId(game, playerId)) throw new Error("Player not found.");

    const requestedSeat = sourceSeat || playerForId(game, playerId).seat;
    const seatPlayer = playerForSeat(game, requestedSeat);
    if (!seatPlayer) throw new Error("Invalid card source.");

    const isDummy = requestedSeat === game.contract.dummy;
    const isDeclarer = game.contract.declarer === requestedSeat;
    const isDefender = game.contract.defenders.includes(requestedSeat);

    if (game.phase === "opening-lead") {
        if (playerId !== seatPlayer.id) throw new Error("Only the opening leader may play the opening card.");
        if (requestedSeat !== game.openingLeader) throw new Error("Invalid opening leader.");
    } else if (game.phase !== "trick-play") {
        throw new Error("Card play is not active.");
    } else {
        if (isDummy) {
            if (!game.dummyRevealed || playerId !== game.contract.declarerId) throw new Error("Only the declarer can play dummy.");
            if (game.currentSeat !== requestedSeat) throw new Error("It is not dummy's turn.");
        } else if (isDeclarer || isDefender) {
            if (playerId !== seatPlayer.id) throw new Error("You can only play from your own hand.");
            if (game.currentSeat !== requestedSeat) throw new Error("It is not your turn.");
        }
    }

    const card = cardInHand(seatPlayer, cardId);
    if (!card) throw new Error("That card is not in the selected hand.");
    if (!followSuitLegal(game, seatPlayer, card)) throw new Error("You must follow suit.");

    const played = removeCardFromHand(seatPlayer, cardId);
    game.trick.push({
        playerId: seatPlayer.id,
        seat: requestedSeat,
        card: played,
    });

    if (game.phase === "opening-lead") {
        game.dummyRevealed = true;
        game.phase = "trick-play";
    }

    if (game.trick.length === 4) {
        finishTrick(game);
    } else {
        advanceAfterPlay(game, requestedSeat);
    }

    return { card: played, sourceSeat: requestedSeat };
}

function nextDeal(game) {
    initializeDeal(game);
}

export function startNextDeal(game) {
    if (game.status !== "round-complete") throw new Error("The current deal is not complete.");
    nextDeal(game);
}

function sanitizeCard(card) {
    return card ? { id: card.id, rank: card.rank, suit: card.suit } : null;
}

export function getPrivateState(game, playerId) {
    const viewer = playerForId(game, playerId);
    if (!viewer) throw new Error("Player not found.");

    const contract = game.contract ? clone(game.contract) : null;
    const visiblePlayers = game.players.map((player) => {
        const canSeeHand = player.id === playerId || (game.dummyRevealed && contract?.dummyId === player.id);
        return {
            id: player.id,
            username: player.username,
            seat: player.seat,
            partner: player.partner,
            connected: player.connected,
            tricksWon: player.tricksWon,
            cardCount: player.hand.length,
            hand: canSeeHand ? player.hand.map(sanitizeCard) : [],
        };
    });

    return {
        roomCode: game.roomCode,
        gameId: game.gameId,
        status: game.status,
        phase: game.phase,
        dealNumber: game.dealNumber,
        dealer: game.dealer,
        vulnerability: game.vulnerability,
        players: visiblePlayers,
        auction: clone(game.auction),
        highestBid: clone(game.highestBid),
        contractDouble: game.contractDouble,
        contract,
        dummyRevealed: game.dummyRevealed,
        currentSeat: game.currentSeat,
        turnActorId: game.turnActorId,
        openingLeader: game.openingLeader,
        trick: game.trick.map((entry) => ({
            playerId: entry.playerId,
            seat: entry.seat,
            card: sanitizeCard(entry.card),
        })),
        completedTricks: game.completedTricks.length,
        lastTrickWinner: game.lastTrickWinner,
        result: clone(game.result),
        you: {
            id: viewer.id,
            seat: viewer.seat,
            partnership: partnership(viewer.seat),
        },
        canDouble: canDouble(game, playerId),
        canRedouble: canRedouble(game, playerId),
        legalBidOptions: game.phase === "auction" && viewer.seat === game.currentSeat
            ? getLegalBidOptions(game)
            : [],
    };
}

export function getPublicState(game) {
    return {
        roomCode: game.roomCode,
        status: game.status,
        phase: game.phase,
        dealNumber: game.dealNumber,
        dealer: game.dealer,
        vulnerability: game.vulnerability,
        highestBid: clone(game.highestBid),
        contract: clone(game.contract),
        dummyRevealed: game.dummyRevealed,
        currentSeat: game.currentSeat,
        turnActorId: game.turnActorId,
        openingLeader: game.openingLeader,
        auction: clone(game.auction),
        players: game.players.map((player) => ({
            id: player.id,
            username: player.username,
            seat: player.seat,
            partnership: partnership(player.seat),
            connected: player.connected,
            cardCount: player.hand.length,
            tricksWon: player.tricksWon,
        })),
        trick: game.trick.map((entry) => ({
            playerId: entry.playerId,
            seat: entry.seat,
            card: sanitizeCard(entry.card),
        })),
        completedTricks: game.completedTricks.length,
        lastTrickWinner: game.lastTrickWinner,
        result: clone(game.result),
    };
}

export function getGamePlayer(game, playerId) {
    return playerForId(game, playerId);
}

export function getLegalBidOptions(game) {
    const options = [];
    for (let level = 1; level <= 7; level += 1) {
        for (const strain of ["C", "D", "H", "S", "NT"]) {
            const bid = { level, strain };
            if (isBidHigher(bid, game.highestBid)) options.push(bid);
        }
    }
    return options;
}

export function getSeatLabel(seat) {
    return { N: "North", E: "East", S: "South", W: "West" }[seat] || seat;
}

export function getVisibleDummyHand(game) {
    if (!game.contract || !game.dummyRevealed) return [];
    const dummy = playerForSeat(game, game.contract.dummy);
    return dummy?.hand.map(sanitizeCard) || [];
}
