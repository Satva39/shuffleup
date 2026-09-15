import {
    GAME_ID,
    SEATS,
    NEXT_SEAT,
    PARTNERSHIP,
    TEAM_LABEL,
    SEAT_LABEL,
    SUITS,
    SUIT_SYMBOL,
    SUIT_LABEL,
    RANKS,
    CARD_POINTS,
    MIN_BID,
    MAX_BID,
    INITIAL_CARDS,
    HAND_SIZE,
    TRICKS_PER_HAND,
    TARGET_SCORE,
    legalBids,
    isValidBid,
    legalCardsForHand,
    validateCardPlay,
    resolveTrick,
    calculateTeamCardPoints,
    contractResult,
    determineGameWinner,
} from "./twentyNineRules.js";

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

export function createDeck() {
    const deck = [];
    for (const suit of SUITS) {
        for (const rank of RANKS) {
            deck.push({ id: `${rank}${suit}`, rank, suit, points: CARD_POINTS[rank] });
        }
    }
    return deck;
}

export function shuffleDeck(deck, random = Math.random) {
    const result = [...deck];
    for (let index = result.length - 1; index > 0; index -= 1) {
        const j = Math.floor(random() * (index + 1));
        [result[index], result[j]] = [result[j], result[index]];
    }
    return result;
}

function seatForIndex(index) {
    return SEATS[((index % SEATS.length) + SEATS.length) % SEATS.length];
}

function playerForSeat(game, seat) {
    return game.players.find((player) => player.seat === seat) || null;
}

function sortHand(hand) {
    const suitOrder = { C: 0, D: 1, H: 2, S: 3 };
    const rankOrder = Object.fromEntries(RANKS.map((rank, index) => [rank, index]));
    return [...hand].sort((a, b) => suitOrder[a.suit] - suitOrder[b.suit] || rankOrder[a.rank] - rankOrder[b.rank]);
}

function dealCards(game) {
    const hands = Object.fromEntries(game.players.map((player) => [player.id, []]));
    const dealStartSeat = NEXT_SEAT[game.dealer];
    const totalToDeal = INITIAL_CARDS * game.players.length;
    for (let index = 0; index < totalToDeal; index += 1) {
        const seat = seatForIndex(SEATS.indexOf(dealStartSeat) + index);
        const player = playerForSeat(game, seat);
        hands[player.id].push(game.deck[index]);
    }
    for (const player of game.players) player.hand = sortHand(hands[player.id]);
    game.dealIndex = totalToDeal;
}

function dealRemainingCards(game) {
    const dealStartSeat = NEXT_SEAT[game.dealer];
    const remaining = game.deck.slice(game.dealIndex);
    for (let index = 0; index < remaining.length; index += 1) {
        const seat = seatForIndex(SEATS.indexOf(dealStartSeat) + index);
        const player = playerForSeat(game, seat);
        player.hand.push(remaining[index]);
    }
    for (const player of game.players) player.hand = sortHand(player.hand);
    game.dealIndex = game.deck.length;
}

function resetHand(game, random = Math.random) {
    game.phase = "bidding";
    game.status = "playing";
    game.handNumber += 1;
    game.dealer = seatForIndex(game.handNumber - 1);
    game.leaderSeat = NEXT_SEAT[game.dealer];
    game.currentSeat = game.leaderSeat;
    game.turnActorId = playerForSeat(game, game.currentSeat)?.id || null;
    game.deck = shuffleDeck(createDeck(), random);
    game.dealIndex = 0;
    game.trick = [];
    game.completedTricks = [];
    game.lastTrickWinner = null;
    game.handResult = null;
    game.winnerTeam = null;
    game.highestBid = null;
    game.bidderId = null;
    game.bidTeam = null;
    game.auctionPasses = 0;
    game.auctionHistory = [];
    game.trumpSuit = null;
    game.trumpRevealed = false;
    game.pendingTrumpFor = null;
    game.tricks = { A: 0, B: 0 };
    dealCards(game);
    for (const player of game.players) {
        player.bid = null;
        player.tricksWon = 0;
    }
}

export function createTwentyNineGame(room, random = Math.random) {
    if (!room || room.gameId !== GAME_ID) throw new Error("Invalid Twenty-Nine room.");
    if (!Array.isArray(room.players) || room.players.length !== 4) throw new Error("Twenty-Nine requires exactly four players.");

    const players = room.players.map((player, index) => {
        const seat = SEATS[index];
        return {
            id: player.id,
            username: player.username,
            seat,
            seatLabel: SEAT_LABEL[seat],
            team: PARTNERSHIP[seat],
            teamLabel: TEAM_LABEL[PARTNERSHIP[seat]],
            socketId: player.socketId || null,
            connected: player.connected !== false,
            hand: [],
            bid: null,
            tricksWon: 0,
        };
    });

    const game = {
        roomCode: String(room.code).toUpperCase(),
        gameId: GAME_ID,
        status: "playing",
        phase: "bidding",
        players,
        handNumber: 0,
        dealer: "N",
        leaderSeat: "E",
        currentSeat: "E",
        turnActorId: null,
        deck: [],
        dealIndex: 0,
        trick: [],
        completedTricks: [],
        lastTrickWinner: null,
        highestBid: null,
        bidderId: null,
        bidTeam: null,
        auctionPasses: 0,
        auctionHistory: [],
        trumpSuit: null,
        trumpRevealed: false,
        pendingTrumpFor: null,
        scores: { A: 0, B: 0 },
        tricks: { A: 0, B: 0 },
        handResult: null,
        winnerTeam: null,
        targetScore: TARGET_SCORE,
        createdAt: Date.now(),
    };

    resetHand(game, random);
    return game;
}

export function getGamePlayer(game, playerId) {
    return game.players.find((player) => player.id === playerId) || null;
}

export function markPlayerConnection(game, playerId, connected, socketId = null) {
    const player = getGamePlayer(game, playerId);
    if (!player) return null;
    player.connected = connected;
    if (socketId) player.socketId = socketId;
    return player;
}

function ensureSocketIdentity(game, playerId) {
    const player = getGamePlayer(game, playerId);
    if (!player) throw new Error("You are not part of this Twenty-Nine game.");
    return player;
}

function advanceAuction(game, seat) {
    let nextSeat = NEXT_SEAT[seat];
    for (let index = 0; index < SEATS.length; index += 1) {
        const nextPlayer = playerForSeat(game, nextSeat);
        if (nextPlayer && nextPlayer.bid !== "pass") {
            game.currentSeat = nextSeat;
            game.turnActorId = nextPlayer.id;
            return;
        }
        nextSeat = NEXT_SEAT[nextSeat];
    }
    game.currentSeat = seat;
    game.turnActorId = playerForSeat(game, seat)?.id || null;
}

function completeAuction(game, bidderId, bid, forced = false) {
    const bidder = getGamePlayer(game, bidderId);
    game.highestBid = bid;
    game.bidderId = bidderId;
    game.bidTeam = bidder.team;
    game.pendingTrumpFor = bidderId;
    game.phase = "trump-selection";
    game.currentSeat = bidder.seat;
    game.turnActorId = bidderId;
    game.auctionPasses = 0;
    game.auctionHistory.push({ type: forced ? "forced-bid" : "auction-complete", playerId: bidderId, seat: bidder.seat, bid });
}

export function submitBid(game, playerId, bidOrPass) {
    if (game.phase !== "bidding") throw new Error("Bidding is already complete.");
    const player = ensureSocketIdentity(game, playerId);
    if (playerId !== game.turnActorId) throw new Error("It is not your turn to bid.");
    if (player.bid === "pass") throw new Error("You have already passed in this auction.");
    const isPass = bidOrPass === null || bidOrPass === undefined || bidOrPass === "pass";
    if (isPass) {
        player.bid = "pass";
        game.auctionPasses += 1;
        const entry = { type: "pass", playerId, seat: player.seat };
        game.auctionHistory.push(entry);

        const bidder = game.bidderId ? getGamePlayer(game, game.bidderId) : null;
        if (!bidder && game.auctionPasses === 3) {
            const dealer = playerForSeat(game, game.dealer);
            if (!dealer) throw new Error("Dealer is unavailable.");
            dealer.bid = MIN_BID;
            completeAuction(game, dealer.id, MIN_BID, true);
            return { type: "auction-complete", entry, forced: true };
        }

        if (bidder && game.auctionPasses >= 3) {
            completeAuction(game, bidder.id, game.highestBid, false);
            return { type: "auction-complete", entry, forced: false };
        }

        advanceAuction(game, player.seat);
        return { type: "pass", entry };
    }

    const bid = Number(bidOrPass);
    if (!Number.isInteger(bid)) throw new Error("Bid must be a whole number.");
    const opening = game.highestBid === null;
    if (!isValidBid(bid, game.highestBid, opening)) {
        throw new Error(`Bid must be ${opening ? `${MIN_BID}` : `above ${game.highestBid}`} through ${MAX_BID}.`);
    }

    player.bid = bid;
    game.highestBid = bid;
    game.bidderId = player.id;
    game.bidTeam = player.team;
    game.auctionPasses = 0;
    const entry = { type: "bid", playerId, seat: player.seat, bid };
    game.auctionHistory.push(entry);
    advanceAuction(game, player.seat);
    return { type: "bid", entry };
}

export function getLegalBidsForPlayer(game, playerId) {
    if (game.phase !== "bidding" || game.turnActorId !== playerId) return [];
    return legalBids(game.highestBid);
}

export function selectTrump(game, playerId, suit) {
    if (game.phase !== "trump-selection") throw new Error("Trump can only be selected after the auction.");
    const player = ensureSocketIdentity(game, playerId);
    if (playerId !== game.pendingTrumpFor) throw new Error("Only the winning bidder can select trump.");
    if (!SUITS.includes(suit)) throw new Error("Invalid trump suit.");

    game.trumpSuit = suit;
    game.trumpRevealed = false;
    game.phase = "trick-play";
    game.leaderSeat = NEXT_SEAT[game.dealer];
    game.currentSeat = game.leaderSeat;
    game.turnActorId = playerForSeat(game, game.currentSeat).id;
    game.pendingTrumpFor = null;
    dealRemainingCards(game);
    return { bidderId: player.id, suit, nextActorId: game.turnActorId };
}

export function revealTrump(game) {
    if (!game.trumpSuit) throw new Error("Trump has not been selected.");
    game.trumpRevealed = true;
    return game.trumpSuit;
}

export function getLegalCardIds(game, playerId) {
    const player = getGamePlayer(game, playerId);
    if (!player || game.phase !== "trick-play" || game.turnActorId !== playerId) return [];
    return legalCardsForHand(player.hand, game.trick);
}

function finalizeHand(game) {
    game.phase = "hand-complete";
    const playerById = Object.fromEntries(game.players.map((player) => [player.id, player]));
    const teamCardPoints = calculateTeamCardPoints(game.completedTricks, playerById);
    const contract = contractResult(game.bidTeam, game.highestBid, teamCardPoints);
    game.scores[game.bidTeam] += contract.delta;

    const winner = determineGameWinner(game.scores, game.targetScore);
    if (winner) {
        game.winnerTeam = winner;
        game.status = "game-complete";
        game.phase = "game-complete";
    }

    game.handResult = {
        handNumber: game.handNumber,
        dealer: game.dealer,
        bidderId: game.bidderId,
        contract: clone(contract),
        teamCardPoints: clone(teamCardPoints),
        tricks: clone(game.tricks),
        scores: clone(game.scores),
        winnerTeam: game.winnerTeam,
    };
}

export function playCard(game, playerId, cardId) {
    if (game.phase !== "trick-play") throw new Error("Twenty-Nine is not in trick-play phase.");
    if (game.turnActorId !== playerId) throw new Error("It is not your turn.");
    const player = ensureSocketIdentity(game, playerId);
    const cardIndex = player.hand.findIndex((card) => card.id === cardId);
    if (cardIndex === -1) throw new Error("You do not own that card.");

    const card = player.hand[cardIndex];
    const ledSuit = game.trick.length > 0 ? game.trick[0].card.suit : null;
    const hasLedSuit = ledSuit ? player.hand.some((item) => item.suit === ledSuit) : false;

    if (game.trick.length === 0 && !game.trumpRevealed && card.suit === game.trumpSuit && player.hand.some((item) => item.suit !== game.trumpSuit)) {
        throw new Error("The hidden trump cannot be led before it is revealed.");
    }

    const validation = validateCardPlay(player.hand, card, game.trick);
    if (!validation.ok) throw new Error(validation.message);

    const wasHidden = !game.trumpRevealed;
    if (!game.trumpRevealed && game.trick.length > 0 && !hasLedSuit) revealTrump(game);

    player.hand.splice(cardIndex, 1);
    const play = { playerId, seat: player.seat, card: clone(card) };
    game.trick.push(play);

    if (game.trick.length < 4) {
        game.currentSeat = NEXT_SEAT[player.seat];
        game.turnActorId = playerForSeat(game, game.currentSeat).id;
        return {
            type: "card-played",
            card: clone(card),
            playerId,
            sourceSeat: player.seat,
            trickComplete: false,
            trumpRevealed: !game.trumpRevealed ? false : true,
            trumpJustRevealed: wasHidden && game.trumpRevealed,
        };
    }

    const winningPlay = resolveTrick(game.trick, game.trumpSuit, game.trumpRevealed);
    const winner = playerForSeat(game, winningPlay.seat);
    winner.tricksWon += 1;
    game.tricks[winner.team] += 1;
    game.lastTrickWinner = winner.seat;
    const completed = clone(game.trick);
    game.completedTricks.push({
        winnerPlayerId: winner.id,
        winnerSeat: winner.seat,
        winnerTeam: winner.team,
        plays: completed,
    });
    game.trick = [];

    const handComplete = game.completedTricks.length === TRICKS_PER_HAND;
    if (handComplete) finalizeHand(game);
    else {
        game.currentSeat = winner.seat;
        game.turnActorId = winner.id;
    }

    return {
        type: "card-played",
        card: clone(card),
        playerId,
        sourceSeat: player.seat,
        trickComplete: true,
        winnerSeat: winner.seat,
        winnerTeam: winner.team,
        completedTricks: game.completedTricks.length,
        handComplete,
        handResult: clone(game.handResult),
        gameWinner: game.winnerTeam,
        trumpRevealed: game.trumpRevealed,
        trumpJustRevealed: wasHidden && game.trumpRevealed,
    };
}

export function startNextHand(game, playerId, random = Math.random) {
    if (game.phase !== "hand-complete") throw new Error("The current hand is not complete.");
    if (game.status === "game-complete") throw new Error("The Twenty-Nine game is complete.");
    const player = ensureSocketIdentity(game, playerId);
    if (player.seat !== game.dealer) throw new Error("Only the dealer may start the next hand.");
    resetHand(game, random);
    return game;
}

function publicPlayer(player) {
    return {
        id: player.id,
        username: player.username,
        seat: player.seat,
        seatLabel: SEAT_LABEL[player.seat],
        team: player.team,
        teamLabel: TEAM_LABEL[player.team],
        connected: player.connected,
        cardCount: player.hand.length,
        bid: player.bid,
        tricksWon: player.tricksWon,
    };
}

function publicTrick(game) {
    return game.trick.map((play) => ({
        playerId: play.playerId,
        seat: play.seat,
        card: clone(play.card),
    }));
}

function publicCompletedTricks(game) {
    return game.completedTricks.map((trick) => ({
        winnerPlayerId: trick.winnerPlayerId,
        winnerSeat: trick.winnerSeat,
        winnerTeam: trick.winnerTeam,
        plays: clone(trick.plays),
    }));
}

export function getPublicState(game) {
    return {
        roomCode: game.roomCode,
        gameId: GAME_ID,
        status: game.status,
        phase: game.phase,
        handNumber: game.handNumber,
        dealer: game.dealer,
        leaderSeat: game.leaderSeat,
        currentSeat: game.currentSeat,
        currentPlayerId: game.turnActorId,
        players: game.players.map(publicPlayer),
        highestBid: game.highestBid,
        bidderId: game.bidderId,
        bidTeam: game.bidTeam,
        contract: game.bidderId ? { bidderId: game.bidderId, bid: game.highestBid, team: game.bidTeam, teamLabel: TEAM_LABEL[game.bidTeam] } : null,
        auctionHistory: clone(game.auctionHistory),
        trump: game.trumpRevealed ? { suit: game.trumpSuit, label: SUIT_LABEL[game.trumpSuit], symbol: SUIT_SYMBOL[game.trumpSuit] } : null,
        trumpRevealed: game.trumpRevealed,
        trick: publicTrick(game),
        completedTricks: publicCompletedTricks(game),
        trickNumber: Math.min(game.completedTricks.length + 1, TRICKS_PER_HAND),
        tricks: clone(game.tricks),
        scores: clone(game.scores),
        handResult: clone(game.handResult),
        winnerTeam: game.winnerTeam,
        targetScore: game.targetScore,
        legalBidRange: game.phase === "bidding" && game.highestBid !== null ? { min: game.highestBid + 1, max: MAX_BID } : { min: MIN_BID, max: MAX_BID },
    };
}

export function getPrivateState(game, playerId) {
    const player = ensureSocketIdentity(game, playerId);
    const publicState = getPublicState(game);
    const hiddenTrumpForWinner = game.bidderId === playerId && game.trumpSuit ? {
        suit: game.trumpSuit,
        label: SUIT_LABEL[game.trumpSuit],
        symbol: SUIT_SYMBOL[game.trumpSuit],
    } : null;

    return {
        ...publicState,
        myPlayerId: playerId,
        mySeat: player.seat,
        myTeam: player.team,
        myHand: clone(player.hand),
        knownTrump: game.trumpRevealed ? publicState.trump : hiddenTrumpForWinner,
        legalCardIds: getLegalCardIds(game, playerId),
        legalBids: getLegalBidsForPlayer(game, playerId),
        isMyTurn: game.turnActorId === playerId,
        isDealer: game.dealer === player.seat,
        canSelectTrump: game.phase === "trump-selection" && game.pendingTrumpFor === playerId,
    };
}

export function getPrivateSnapshotWithoutMutation(game, playerId) {
    return getPrivateState(game, playerId);
}
