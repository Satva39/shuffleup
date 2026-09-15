import {
    RANKS,
    SUITS,
    SEATS,
    NEXT_SEAT,
    PARTNERSHIP,
    TEAM_SEATS,
    TEAM_LABEL,
    SEAT_LABEL,
    isValidBid,
    legalCardsForHand,
    validateCardPlay,
    resolveTrick,
    calculateTeamRoundScore,
    gameWinner,
} from "./spadesRules.js";

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

export function createDeck() {
    const deck = [];
    for (const suit of SUITS) {
        for (const rank of RANKS) {
            deck.push({ id: `${rank}${suit}`, rank, suit });
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
    return SEATS[index % SEATS.length];
}

function playerForSeat(game, seat) {
    return game.players.find((player) => player.seat === seat);
}

export function getGamePlayer(game, playerId) {
    return game.players.find((player) => player.id === playerId) || null;
}

function sortHand(hand) {
    const suitOrder = { C: 0, D: 1, H: 2, S: 3 };
    const rankIndex = Object.fromEntries(RANKS.map((rank, index) => [rank, index]));
    return [...hand].sort((a, b) => suitOrder[a.suit] - suitOrder[b.suit] || rankIndex[a.rank] - rankIndex[b.rank]);
}

function resetHand(game) {
    game.phase = "bidding";
    game.handNumber += 1;
    game.dealer = seatForIndex((game.handNumber - 1) % SEATS.length);
    game.leaderSeat = NEXT_SEAT[game.dealer];
    game.currentSeat = game.leaderSeat;
    game.turnActorId = playerForSeat(game, game.currentSeat)?.id || null;
    game.deck = shuffleDeck(createDeck());
    game.trick = [];
    game.completedTricks = [];
    game.lastTrickWinner = null;
    game.spadesBroken = false;
    game.handResult = null;

    const hands = Object.fromEntries(game.players.map((player) => [player.id, []]));
    for (let index = 0; index < game.deck.length; index += 1) {
        const seat = seatForIndex(index % 4);
        const player = playerForSeat(game, seat);
        hands[player.id].push(game.deck[index]);
    }
    for (const player of game.players) {
        player.hand = sortHand(hands[player.id]);
        player.bid = null;
        player.tricksWon = 0;
    }
}

export function createSpadesGame(room) {
    if (!room || room.gameId !== "spades") throw new Error("Invalid Spades room.");
    if (!Array.isArray(room.players) || room.players.length !== 4) {
        throw new Error("Spades requires exactly four players.");
    }

    const players = room.players.map((player, index) => {
        const seat = SEATS[index];
        return {
            id: player.id,
            username: player.username,
            seat,
            team: PARTNERSHIP[seat],
            socketId: player.socketId || null,
            connected: player.connected !== false,
            hand: [],
            bid: null,
            tricksWon: 0,
        };
    });

    const game = {
        roomCode: String(room.code).toUpperCase(),
        gameId: "spades",
        status: "playing",
        phase: "bidding",
        players,
        handNumber: 0,
        dealer: "N",
        leaderSeat: "E",
        currentSeat: "E",
        turnActorId: null,
        deck: [],
        trick: [],
        completedTricks: [],
        lastTrickWinner: null,
        spadesBroken: false,
        scores: { A: 0, B: 0 },
        bags: { A: 0, B: 0 },
        handResult: null,
        winnerTeam: null,
        targetScore: 500,
        createdAt: Date.now(),
    };

    resetHand(game);
    return game;
}

export function markPlayerConnection(game, playerId, connected, socketId = null) {
    const player = getGamePlayer(game, playerId);
    if (!player) return null;
    player.connected = connected;
    if (socketId) player.socketId = socketId;
    return player;
}

function ensureCurrentPlayer(game, playerId) {
    if (game.phase !== "trick-play") throw new Error("Spades is not in trick-play phase.");
    if (game.turnActorId !== playerId) throw new Error("It is not your turn.");
}

export function submitBid(game, playerId, bid) {
    if (game.phase !== "bidding") throw new Error("Bidding is already complete.");
    const player = getGamePlayer(game, playerId);
    if (!player) throw new Error("Player is not in this Spades game.");
    if (player.bid !== null) throw new Error("You have already submitted a bid.");
    if (!isValidBid(bid)) throw new Error("Bid must be an integer from 0 through 13.");
    if (player.id !== game.turnActorId) throw new Error("It is not your turn to bid.");

    player.bid = bid;
    const entry = { playerId, seat: player.seat, bid };
    const allSubmitted = game.players.every((item) => item.bid !== null);
    if (allSubmitted) {
        game.phase = "trick-play";
        game.currentSeat = game.leaderSeat;
        game.turnActorId = playerForSeat(game, game.currentSeat).id;
        return { type: "bidding-complete", entry };
    }

    game.currentSeat = NEXT_SEAT[player.seat];
    game.turnActorId = playerForSeat(game, game.currentSeat).id;
    return { type: "bid", entry };
}

export function getLegalCardIds(game, playerId) {
    const player = getGamePlayer(game, playerId);
    if (!player || game.phase !== "trick-play" || game.turnActorId !== playerId) return [];
    return legalCardsForHand(player.hand, game.trick, game.spadesBroken);
}

export function playCard(game, playerId, cardId) {
    ensureCurrentPlayer(game, playerId);
    const player = getGamePlayer(game, playerId);
    if (!player) throw new Error("Player is not in this Spades game.");

    const cardIndex = player.hand.findIndex((card) => card.id === cardId);
    if (cardIndex === -1) throw new Error("You do not own that card.");
    const card = player.hand[cardIndex];
    const validation = validateCardPlay(player.hand, card, game.trick, game.spadesBroken);
    if (!validation.ok) throw new Error(validation.message);

    const ledSuit = game.trick.length > 0 ? game.trick[0].card.suit : null;
    player.hand.splice(cardIndex, 1);
    game.trick.push({ playerId, seat: player.seat, card: clone(card) });

    let brokeSpades = false;
    if (card.suit === "S" && !game.spadesBroken && game.trick.length > 0 && game.trick.length < 4 && ledSuit !== "S") {
        game.spadesBroken = true;
        brokeSpades = true;
    }

    if (game.trick.length < 4) {
        game.currentSeat = NEXT_SEAT[player.seat];
        game.turnActorId = playerForSeat(game, game.currentSeat).id;
        return {
            card: clone(card),
            playerId,
            sourceSeat: player.seat,
            trickComplete: false,
            brokeSpades,
        };
    }

    const winningPlay = resolveTrick(game.trick);
    const winner = playerForSeat(game, winningPlay.seat);
    winner.tricksWon += 1;
    game.lastTrickWinner = winner.seat;
    const completed = clone(game.trick);
    game.completedTricks.push({ winnerSeat: winner.seat, plays: completed });
    game.trick = [];

    const handComplete = game.completedTricks.length === 13;
    if (handComplete) {
        finalizeHand(game);
    } else {
        game.currentSeat = winner.seat;
        game.turnActorId = winner.id;
    }

    return {
        card: clone(card),
        playerId,
        sourceSeat: player.seat,
        trickComplete: true,
        winnerSeat: winner.seat,
        completedTricks: game.completedTricks.length,
        handComplete,
        brokeSpades,
        handResult: clone(game.handResult),
        winnerTeam: game.winnerTeam,
    };
}

function finalizeHand(game) {
    game.phase = "hand-complete";
    const result = {
        handNumber: game.handNumber,
        teams: {},
    };

    for (const team of ["A", "B"]) {
        const teamPlayers = game.players.filter((player) => player.team === team);
        const bidTotal = teamPlayers.reduce((sum, player) => sum + player.bid, 0);
        const tricksTaken = teamPlayers.reduce((sum, player) => sum + player.tricksWon, 0);
        const nilPlayers = teamPlayers.filter((player) => player.bid === 0).map((player) => ({
            playerId: player.id,
            seat: player.seat,
            tricksTaken: player.tricksWon,
        }));
        const teamScore = calculateTeamRoundScore({
            previousBags: game.bags[team],
            bidTotal,
            tricksTaken,
            nilPlayers,
        });
        game.bags[team] = teamScore.bags;
        game.scores[team] += teamScore.total;
        result.teams[team] = teamScore;
    }

    const winner = gameWinner(game.scores.A, game.scores.B, game.targetScore);
    if (winner) {
        game.winnerTeam = winner;
        game.status = "game-complete";
        game.phase = "game-complete";
    }
    game.handResult = {
        ...result,
        scores: clone(game.scores),
        bags: clone(game.bags),
        winnerTeam: game.winnerTeam,
    };
}

export function startNextHand(game, playerId) {
    if (game.phase !== "hand-complete") throw new Error("The current hand is not complete.");
    if (game.status === "game-complete") throw new Error("The Spades game is complete.");
    const player = getGamePlayer(game, playerId);
    if (!player || player.seat !== game.dealer) throw new Error("Only the dealer may start the next hand.");
    resetHand(game);
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
    return game.trick.map((play) => ({ playerId: play.playerId, seat: play.seat, card: clone(play.card) }));
}

export function getPublicState(game) {
    return {
        roomCode: game.roomCode,
        gameId: game.gameId,
        status: game.status,
        phase: game.phase,
        handNumber: game.handNumber,
        dealer: game.dealer,
        leaderSeat: game.leaderSeat,
        currentSeat: game.currentSeat,
        turnActorId: game.turnActorId,
        spadesBroken: game.spadesBroken,
        players: game.players.map(publicPlayer),
        trick: publicTrick(game),
        completedTricks: game.completedTricks.map((item) => ({ winnerSeat: item.winnerSeat, plays: item.plays })),
        trickCount: game.completedTricks.length,
        scores: clone(game.scores),
        bags: clone(game.bags),
        handResult: clone(game.handResult),
        winnerTeam: game.winnerTeam,
        targetScore: game.targetScore,
    };
}

export function getPrivateState(game, playerId) {
    const player = getGamePlayer(game, playerId);
    if (!player) throw new Error("You are not part of this Spades game.");
    return {
        ...getPublicState(game),
        playerId,
        seat: player.seat,
        team: player.team,
        hand: clone(player.hand),
        legalCardIds: getLegalCardIds(game, playerId),
        bidOptions: game.phase === "bidding" && game.turnActorId === playerId ? Array.from({ length: 14 }, (_, index) => index) : [],
        dealerPlayerId: playerForSeat(game, game.dealer)?.id || null,
        canStartNextHand: game.phase === "hand-complete" && player.seat === game.dealer && game.status !== "game-complete",
    };
}

export function startHandForTests(game) {
    resetHand(game);
    return game;
}
