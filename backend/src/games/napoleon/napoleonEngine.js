import {
    SUITS,
    RANKS,
    PLAYER_COUNT,
    CARDS_PER_PLAYER,
    BLIND_SIZE,
    MIN_BID,
    MAX_BID,
    TOTAL_ROUNDS,
    SUIT_VALUES,
    SUIT_NAMES,
    createCard,
    isValidBid,
    isScoringCard,
    canPlayCard,
    determineTrickWinner,
    calculateTeamResult,
    calculateScoreDeltas,
} from "./napoleonRules.js";

function createDeck() {
    return SUITS.flatMap((suit) =>
        RANKS.map((rank) => createCard(suit, rank))
    );
}

function shuffleDeck(deck) {
    const shuffled = [...deck];

    for (let i = shuffled.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
}

function createPlayers(roomPlayers) {
    return roomPlayers.map((player, index) => ({
        id: player.id,
        username: player.username,
        seat: index,
        socketId: player.socketId || null,
        connected: player.connected !== false,
        cards: [],
        score: 0,
        roundScore: 0,
        roundPoints: 0,
        tricksWon: 0,
        bid: null,
        passed: false,
    }));
}

function assertPlayerCount(players) {
    if (players.length !== PLAYER_COUNT) {
        throw new Error(
            `Napoleon requires exactly ${PLAYER_COUNT} players.`
        );
    }
}

function createGame(room) {
    assertPlayerCount(room.players);

    return {
        roomCode: room.code.toUpperCase(),
        gameId: "napoleon",
        status: "dealing",
        phase: "dealing",

        round: 1,
        totalRounds: TOTAL_ROUNDS,

        dealerIndex: 0,
        currentPlayerIndex: 1,

        highestBid: null,
        bidderId: null,
        passedPlayerIds: [],

        contract: null,
        trumpSuit: null,
        calledCard: null,
        napoleonId: null,
        partnerId: null,
        partnerRevealed: false,
        alone: false,

        blind: [],
        discardedCards: [],

        currentTrick: [],
        completedTricks: [],
        lastCompletedTrick: null,

        players: createPlayers(room.players),

        deck: [],
        roundStartedAt: Date.now(),
        updatedAt: Date.now(),
    };
}

function getPlayer(game, playerId) {
    return game.players.find((player) => player.id === playerId);
}

function getCurrentPlayer(game) {
    return game.players[game.currentPlayerIndex] || null;
}

function setStatus(game, status, phase = status) {
    game.status = status;
    game.phase = phase;
    game.updatedAt = Date.now();
}

function resetRoundState(game) {
    game.highestBid = null;
    game.bidderId = null;
    game.passedPlayerIds = [];
    game.contract = null;
    game.trumpSuit = null;
    game.calledCard = null;
    game.napoleonId = null;
    game.partnerId = null;
    game.partnerRevealed = false;
    game.alone = false;
    game.blind = [];
    game.discardedCards = [];
    game.currentTrick = [];
    game.completedTricks = [];
    game.lastCompletedTrick = null;

    for (const player of game.players) {
        player.cards = [];
        player.roundScore = 0;
        player.roundPoints = 0;
        player.tricksWon = 0;
        player.bid = null;
        player.passed = false;
    }
}

function dealRound(game) {
    resetRoundState(game);

    game.deck = shuffleDeck(createDeck());

    for (let i = 0; i < CARDS_PER_PLAYER; i += 1) {
        for (const player of game.players) {
            const card = game.deck.pop();
            player.cards.push(card);
        }
    }

    for (let i = 0; i < BLIND_SIZE; i += 1) {
        game.blind.push(game.deck.pop());
    }

    game.currentPlayerIndex =
        (game.dealerIndex + 1) % game.players.length;

    setStatus(game, "bidding", "bidding");
}

function startGame(game) {
    assertPlayerCount(game.players);
    dealRound(game);
    return game;
}

function getActiveBidderCount(game) {
    return game.players.filter(
        (player) => !player.passed
    ).length;
}

function advanceBidder(game) {
    for (let step = 1; step <= game.players.length; step += 1) {
        const index =
            (game.currentPlayerIndex + step) %
            game.players.length;

        const player = game.players[index];

        if (!player.passed && player.bid === null) {
            game.currentPlayerIndex = index;
            return;
        }
    }

    for (let step = 1; step <= game.players.length; step += 1) {
        const index =
            (game.currentPlayerIndex + step) %
            game.players.length;

        const player = game.players[index];

        if (!player.passed) {
            game.currentPlayerIndex = index;
            return;
        }
    }
}

function finishBidding(game) {
    if (!game.highestBid) {
        dealRound(game);
        return { redealt: true };
    }

    const winner = getPlayer(game, game.bidderId);

    game.napoleonId = winner.id;
    game.contract = {
        amount: game.highestBid.amount,
        suit: game.highestBid.suit,
        suitName: SUIT_NAMES[game.highestBid.suit].name,
        suitSymbol: SUIT_NAMES[game.highestBid.suit].symbol,
    };
    game.trumpSuit = game.highestBid.suit;

    game.currentPlayerIndex = game.players.findIndex(
        (player) => player.id === winner.id
    );

    setStatus(game, "contract", "contract");

    return { redealt: false };
}

function submitBid(game, playerId, bidInput) {
    if (game.phase !== "bidding") {
        throw new Error("Bidding is not active.");
    }

    const player = getPlayer(game, playerId);
    if (!player) throw new Error("Player not found.");

    if (getCurrentPlayer(game)?.id !== playerId) {
        throw new Error("It is not your turn to bid.");
    }

    if (player.passed) {
        throw new Error("You have passed and cannot re-enter.");
    }

    if (bidInput === null || bidInput === undefined) {
        throw new Error("A bid or pass is required.");
    }

    if (bidInput === "pass") {
        player.passed = true;
        game.passedPlayerIds.push(playerId);

        if (getActiveBidderCount(game) === 0) {
            return finishBidding(game);
        }

        if (getActiveBidderCount(game) === 1 && game.highestBid) {
            return finishBidding(game);
        }

        advanceBidder(game);
        game.updatedAt = Date.now();
        return { redealt: false };
    }

    const bid = {
        amount: Number(bidInput.amount),
        suit: bidInput.suit,
    };

    if (!Number.isInteger(bid.amount)) {
        throw new Error("Bid amount must be a whole number.");
    }

    if (!isValidBid(bid, game.highestBid)) {
        if (game.highestBid) {
            throw new Error(
                `Bid must beat ${game.highestBid.amount} ${SUIT_NAMES[game.highestBid.suit].name}.`
            );
        }

        throw new Error(
            `Bid must be between ${MIN_BID} and ${MAX_BID}.`
        );
    }

    player.bid = bid;
    game.highestBid = bid;
    game.bidderId = playerId;

    advanceBidder(game);

    if (
        getActiveBidderCount(game) === 1 &&
        game.highestBid
    ) {
        return finishBidding(game);
    }

    game.updatedAt = Date.now();
    return { redealt: false };
}

function validateNapoleon(game, playerId) {
    if (game.phase !== "contract") {
        throw new Error("Contract setup is not active.");
    }

    if (game.napoleonId !== playerId) {
        throw new Error("Only Napoleon can choose the contract.");
    }
}

function choosePartnerCard(game, playerId, card) {
    validateNapoleon(game, playerId);

    if (
        !card ||
        typeof card.suit !== "string" ||
        typeof card.rank !== "string" ||
        !SUITS.includes(card.suit) ||
        !RANKS.includes(card.rank)
    ) {
        throw new Error("Invalid called card.");
    }

    game.calledCard = {
        id: `${card.suit}-${card.rank}`,
        suit: card.suit,
        rank: card.rank,
    };

    const inOwnHand = getPlayer(game, playerId).cards.some(
        (item) => item.id === game.calledCard.id
    );

    const inBlind = game.blind.some(
        (item) => item.id === game.calledCard.id
    );

    if (!inOwnHand && !inBlind) {
        // The called card must exist somewhere in the dealt
        // 52-card round. Since the deck is in memory server-side,
        // this is a safe authoritative lookup.
        const exists =
            game.players.some((player) =>
                player.cards.some(
                    (item) => item.id === game.calledCard.id
                )
            ) || inBlind;

        if (!exists) {
            throw new Error("Called card does not exist.");
        }
    }

    setStatus(game, "blind", "blind");
}

function takeBlindAndDiscard(game, playerId, discardIds) {
    if (
        game.phase !== "blind" ||
        game.napoleonId !== playerId
    ) {
        throw new Error("Blind selection is not active.");
    }

    const napoleon = getPlayer(game, playerId);

    if (!Array.isArray(discardIds) || discardIds.length !== 2) {
        throw new Error("You must discard exactly two cards.");
    }

    const uniqueIds = new Set(discardIds);
    if (uniqueIds.size !== 2) {
        throw new Error("Discard cards must be different.");
    }

    const combined = [
        ...napoleon.cards,
        ...game.blind,
    ];

    const selected = discardIds.map(
        (cardId) =>
            combined.find((card) => card.id === cardId)
    );

    if (selected.some((card) => !card)) {
        throw new Error("You can only discard cards you hold.");
    }

    const discardSet = new Set(discardIds);

    napoleon.cards = combined.filter(
        (card) => !discardSet.has(card.id)
    );

    game.discardedCards = selected.map((card) => ({
        ...card,
        public: isScoringCard(card),
    }));

    game.blind = [];
    game.currentPlayerIndex = game.players.findIndex(
        (player) => player.id === game.napoleonId
    );

    setStatus(game, "playing", "playing");
}

function revealPartnerIfNeeded(game, playerId, card) {
    if (game.partnerRevealed || !game.calledCard) {
        return;
    }

    if (card.id !== game.calledCard.id) {
        return;
    }

    game.partnerRevealed = true;

    if (playerId === game.napoleonId) {
        game.alone = true;
        game.partnerId = null;
        return;
    }

    game.partnerId = playerId;
    game.alone = false;
}

function playCard(game, playerId, cardId) {
    if (game.phase !== "playing") {
        throw new Error("Card play is not active.");
    }

    const currentPlayer = getCurrentPlayer(game);

    if (!currentPlayer || currentPlayer.id !== playerId) {
        throw new Error("It is not your turn.");
    }

    const result = canPlayCard(
        currentPlayer.cards,
        cardId,
        game.currentTrick,
        game.trumpSuit,
        game.completedTricks.length + 1
    );

    if (!result.valid) {
        throw new Error(result.reason);
    }

    const card = result.card;

    currentPlayer.cards = currentPlayer.cards.filter(
        (item) => item.id !== cardId
    );

    revealPartnerIfNeeded(game, playerId, card);

    game.currentTrick.push({
        playerId,
        card,
    });

    if (game.currentTrick.length === game.players.length) {
        const trick = resolveTrick(game);
        game.updatedAt = Date.now();

        return {
            card,
            trickComplete: true,
            winnerId: trick.winnerId,
            roundComplete: trick.roundComplete,
        };
    }

    game.currentPlayerIndex =
        (game.currentPlayerIndex + 1) %
        game.players.length;

    game.updatedAt = Date.now();

    return {
        card,
        trickComplete: false,
        winnerId: null,
        roundComplete: false,
    };
}

function resolveTrick(game) {
    const trickNumber = game.completedTricks.length + 1;

    const winnerId = determineTrickWinner(
        game.currentTrick,
        game.trumpSuit,
        trickNumber
    );

    const winner = getPlayer(game, winnerId);
    if (!winner) {
        throw new Error("Trick winner not found.");
    }

    const trickPoints = game.currentTrick.reduce(
        (sum, play) => sum + play.card.pointValue,
        0
    );

    winner.tricksWon += 1;
    winner.roundPoints += trickPoints;

    const completed = {
        number: trickNumber,
        cards: [...game.currentTrick],
        winnerId,
        points: trickPoints,
    };

    game.completedTricks.push(completed);
    game.lastCompletedTrick = completed;
    game.currentTrick = [];

    const allPlayed = game.players.every(
        (player) => player.cards.length === 0
    );

    if (allPlayed) {
        finishRound(game);
        return {
            winnerId,
            roundComplete: true,
        };
    }

    game.currentPlayerIndex = game.players.findIndex(
        (player) => player.id === winnerId
    );

    game.updatedAt = Date.now();

    return {
        winnerId,
        roundComplete: false,
    };
}

function finishRound(game) {
    if (!game.partnerRevealed) {
        // If the called card was in the blind or Napoleon's own
        // hand, no external adjutant exists. Keep that fact private
        // during the hand and reveal it only when the round ends.
        game.alone = true;
        game.partnerId = null;
        game.partnerRevealed = true;
    }

    const napoleon = getPlayer(game, game.napoleonId);
    const partner = game.partnerId
        ? getPlayer(game, game.partnerId)
        : null;

    const teamPoints =
        napoleon.roundPoints +
        (partner ? partner.roundPoints : 0);

    const teamResult = calculateTeamResult(
        teamPoints,
        game.contract.amount
    );

    const deltas = calculateScoreDeltas({
        success: teamResult.success,
        bidAmount: game.contract.amount,
        napoleonId: game.napoleonId,
        partnerId: game.partnerId,
        players: game.players,
    });

    for (const player of game.players) {
        player.roundScore = deltas[player.id] || 0;
        player.score += player.roundScore;
    }

    game.roundResult = {
        teamPoints,
        target: teamResult.target,
        success: teamResult.success,
        deltas,
        discardedScoringCards:
            game.discardedCards.filter((card) => card.public),
    };

    setStatus(game, "round-complete", "round-complete");
}

function startNextRound(game) {
    if (game.phase !== "round-complete") {
        throw new Error("The current round is not complete.");
    }

    if (game.round >= game.totalRounds) {
        setStatus(game, "game-complete", "game-complete");
        return false;
    }

    game.round += 1;
    game.dealerIndex =
        (game.dealerIndex + 1) %
        game.players.length;

    dealRound(game);

    return true;
}

function markPlayerConnection(
    game,
    playerId,
    connected,
    socketId = null
) {
    const player = getPlayer(game, playerId);
    if (!player) return;

    player.connected = connected;
    if (socketId) {
        player.socketId = socketId;
    }

    game.updatedAt = Date.now();
}

function getWinner(game) {
    return [...game.players].sort(
        (a, b) => b.score - a.score
    )[0] || null;
}

function publicCard(card) {
    return {
        id: card.id,
        suit: card.suit,
        rank: card.rank,
    };
}

function publicPlayer(player, game, viewerId) {
    const isSelf = player.id === viewerId;
    const isNapoleon =
        player.id === game.napoleonId;

    return {
        id: player.id,
        username: player.username,
        seat: player.seat,
        connected: player.connected,
        cardCount: player.cards.length,
        score: player.score,
        roundScore: player.roundScore,
        tricksWon: player.tricksWon,
        roundPoints: isSelf ? player.roundPoints : null,
        bid:
            player.bid
                ? {
                    amount: player.bid.amount,
                    suit: player.bid.suit,
                }
                : null,
        passed: player.passed,
        isNapoleon,
    };
}

function getPublicState(game, viewerId) {
    const viewer = getPlayer(game, viewerId);
    if (!viewer) {
        throw new Error("Viewer is not a player.");
    }

    const publicState = {
        roomCode: game.roomCode,
        gameId: game.gameId,
        status: game.status,
        phase: game.phase,

        round: game.round,
        totalRounds: game.totalRounds,

        dealerId:
            game.players[game.dealerIndex]?.id || null,

        currentPlayerId:
            game.players[game.currentPlayerIndex]?.id || null,

        currentBid: game.highestBid
            ? {
                amount: game.highestBid.amount,
                suit: game.highestBid.suit,
            }
            : null,

        bidderId: game.bidderId,

        players: game.players.map((player) =>
            publicPlayer(player, game, viewerId)
        ),

        contract: game.contract
            ? { ...game.contract }
            : null,

        trump: game.trumpSuit
            ? {
                suit: game.trumpSuit,
                ...SUIT_NAMES[game.trumpSuit],
            }
            : null,

        currentTrick: game.currentTrick.map((play) => ({
            playerId: play.playerId,
            card: publicCard(play.card),
        })),

        lastCompletedTrick: game.lastCompletedTrick
            ? {
                number: game.lastCompletedTrick.number,
                winnerId: game.lastCompletedTrick.winnerId,
                points: game.lastCompletedTrick.points,
                cards:
                    game.lastCompletedTrick.cards.map(
                        (play) => ({
                            playerId: play.playerId,
                            card: publicCard(play.card),
                        })
                    ),
            }
            : null,

        completedTrickCount:
            game.completedTricks.length,

        calledCard:
            viewer.id === game.napoleonId &&
                game.calledCard
                ? { ...game.calledCard }
                : game.partnerRevealed &&
                    game.calledCard
                    ? { ...game.calledCard }
                    : null,

        napoleonId: game.napoleonId,

        partnerId: game.partnerRevealed
            ? game.partnerId
            : null,

        partnerRevealed: game.partnerRevealed,
        alone: game.alone,

        discardedScoringCards:
            game.discardedCards
                .filter((card) => card.public)
                .map(publicCard),

        yourCards: viewer.cards.map(publicCard),

        yourBlind:
            viewer.id === game.napoleonId
                ? game.blind.map(publicCard)
                : [],

        yourBid: viewer.bid
            ? { ...viewer.bid }
            : null,

        roundResult: game.roundResult || null,

        winner:
            game.status === "game-complete"
                ? getWinner(game)
                : null,

        updatedAt: game.updatedAt,
    };

    return publicState;
}

export {
    createDeck,
    shuffleDeck,
    createGame,
    startGame,
    submitBid,
    choosePartnerCard,
    takeBlindAndDiscard,
    playCard,
    startNextRound,
    markPlayerConnection,
    getWinner,
    getPublicState,
};
