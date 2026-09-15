import {
    RANKS,
    SUITS,
    SEATS,
    NEXT_SEAT,
    PARTNERSHIP,
    TEAM_SEATS,
    TEAM_LABEL,
    SEAT_LABEL,
    TRUMP_MODE,
    TARGET_SCORE,
    isKeyCard,
    legalCardsForHand,
    validateCardPlay,
    resolveTrick,
    getTeamTens,
    calculateHandResult,
} from "./mindiCoatRules.js";

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

export function createDeck() {
    const deck = [];

    for (const suit of SUITS) {
        for (const rank of RANKS) {
            deck.push({
                id: `${rank}${suit}`,
                rank,
                suit,
            });
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
    return game.players.find((player) => player.seat === seat) || null;
}

export function getGamePlayer(game, playerId) {
    return game.players.find((player) => player.id === playerId) || null;
}

function sortHand(hand) {
    const suitOrder = {
        C: 0,
        D: 1,
        H: 2,
        S: 3,
    };

    const rankIndex = Object.fromEntries(
        RANKS.map((rank, index) => [rank, index])
    );

    return [...hand].sort(
        (a, b) =>
            suitOrder[a.suit] - suitOrder[b.suit] ||
            rankIndex[a.rank] - rankIndex[b.rank]
    );
}

function newHandState(game) {
    game.phase = "trump-select";
    game.handNumber += 1;

    game.dealer = seatForIndex((game.handNumber - 1) % SEATS.length);
    game.leaderSeat = NEXT_SEAT[game.dealer];
    game.currentSeat = game.leaderSeat;

    game.turnActorId =
        playerForSeat(game, game.currentSeat)?.id || null;

    game.deck = shuffleDeck(createDeck());

    game.trick = [];
    game.completedTricks = [];
    game.lastTrickWinner = null;
    game.handResult = null;

    game.trumpSuit = null;
    game.trumpCard = null;
    game.trumpOwnerId = game.turnActorId;
    game.hukumSelectedById = game.turnActorId;
    game.hukumOpenedById = null;
    game.trumpRevealed = false;

    const hands = Object.fromEntries(
        game.players.map((player) => [player.id, []])
    );

    for (let index = 0; index < game.deck.length; index += 1) {
        const seat = seatForIndex(index);
        const player = playerForSeat(game, seat);

        hands[player.id].push(game.deck[index]);
    }

    for (const player of game.players) {
        player.hand = sortHand(hands[player.id]);
        player.tricksWon = 0;
        player.tensCaptured = 0;
    }
}

export function createMindiCoatGame(room) {
    if (!room || room.gameId !== "mindi-coat") {
        throw new Error("Invalid Mindi Coat room.");
    }

    if (!Array.isArray(room.players) || room.players.length !== 4) {
        throw new Error("Mindi Coat requires exactly four players.");
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
            tricksWon: 0,
            tensCaptured: 0,
        };
    });

    const game = {
        roomCode: String(room.code).toUpperCase(),
        gameId: "mindi-coat",

        status: "playing",
        phase: "trump-select",

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

        trumpMode: TRUMP_MODE,
        trumpSuit: null,
        trumpCard: null,
        trumpOwnerId: null,

        hukumSelectedById: null,
        hukumOpenedById: null,
        trumpRevealed: false,

        scores: {
            A: 0,
            B: 0,
        },

        handResult: null,
        winnerTeam: null,
        targetScore: TARGET_SCORE,

        createdAt: Date.now(),
    };

    newHandState(game);

    return game;
}

export function markPlayerConnection(
    game,
    playerId,
    connected,
    socketId = null
) {
    const player = getGamePlayer(game, playerId);

    if (!player) return null;

    player.connected = connected;

    if (socketId) {
        player.socketId = socketId;
    }

    return player;
}

export function selectTrumpCard(game, playerId, cardId) {
    if (game.phase !== "trump-select") {
        throw new Error("Trump selection is not active.");
    }

    if (game.turnActorId !== playerId) {
        throw new Error(
            "Only the designated trump selector may choose Hukum."
        );
    }

    const player = getGamePlayer(game, playerId);

    if (!player) {
        throw new Error("Player is not in this Mindi Coat game.");
    }

    let index = player.hand.findIndex(
        (card) => card.id === cardId
    );

    // During Hukum selection the client only receives opaque
    // position tokens, so the selector cannot inspect the
    // actual rank/suit through client state.
    const slotMatch =
        typeof cardId === "string"
            ? cardId.match(/^hukum-slot-(\d+)$/)
            : null;

    if (index === -1 && slotMatch) {
        index = Number(slotMatch[1]) - 1;
    }

    if (index < 0 || index >= player.hand.length) {
        throw new Error(
            "That Hukum position is no longer available."
        );
    }

    game.trumpCard = clone(player.hand[index]);

    game.trumpSuit = null;
    game.trumpOwnerId = playerId;

    game.hukumSelectedById = playerId;
    game.hukumOpenedById = null;

    game.trumpRevealed = false;

    player.hand.splice(index, 1);

    game.phase = "trick-play";
    game.currentSeat = player.seat;
    game.turnActorId = player.id;

    return {
        selectedBy: playerId,
        seat: player.seat,
        hidden: true,
    };
}

function canOpenHukum(game, playerId) {
    if (game.trumpRevealed || !game.trumpCard) {
        return false;
    }

    if (
        game.phase !== "trick-play" ||
        game.turnActorId !== playerId
    ) {
        return false;
    }

    if (game.trick.length === 0) {
        return false;
    }

    // The player who hid Hukum can never be the one who opens it.
    if (game.hukumSelectedById === playerId) {
        return false;
    }

    const player = getGamePlayer(game, playerId);

    if (!player) {
        return false;
    }

    const ledSuit = game.trick[0].card.suit;

    return !player.hand.some(
        (card) => card.suit === ledSuit
    );
}

export function revealHukum(game, playerId) {
    if (game.trumpRevealed) {
        throw new Error("Hukum has already been opened.");
    }

    if (!game.trumpCard) {
        throw new Error("No hidden Hukum is available.");
    }

    if (game.phase !== "trick-play") {
        throw new Error(
            "Hukum can only be opened during trick play."
        );
    }

    if (game.turnActorId !== playerId) {
        throw new Error(
            "Only the current player can open Hukum."
        );
    }

    if (game.trick.length === 0) {
        throw new Error(
            "Hukum cannot be opened before a card is led."
        );
    }

    if (game.hukumSelectedById === playerId) {
        throw new Error(
            "The player who hid Hukum cannot open it."
        );
    }

    const opener = getGamePlayer(game, playerId);
    const hiddenOwner = getGamePlayer(
        game,
        game.trumpOwnerId
    );

    if (!opener || !hiddenOwner) {
        throw new Error(
            "Hukum ownership is invalid."
        );
    }

    const ledSuit = game.trick[0].card.suit;

    if (
        opener.hand.some(
            (card) => card.suit === ledSuit
        )
    ) {
        throw new Error(
            "You must follow suit and cannot open Hukum while you can follow the led suit."
        );
    }

    const revealedCard = clone(game.trumpCard);

    game.trumpSuit = revealedCard.suit;
    game.trumpRevealed = true;
    game.hukumOpenedById = playerId;

    // The player who originally hid Hukum gets
    // the revealed card back.
    //
    // The player who was forced to open it does
    // NOT receive the card.
    //
    // After reveal, the hidden card becomes a
    // normal card in the hider's hand and can be
    // played on their future turns.
    hiddenOwner.hand.push(revealedCard);
    hiddenOwner.hand = sortHand(hiddenOwner.hand);

    return {
        suit: game.trumpSuit,
        card: revealedCard,
        openedById: playerId,
        originalOwnerId: game.trumpOwnerId,
    };
}

export function getLegalCardIds(game, playerId) {
    const player = getGamePlayer(game, playerId);

    if (
        !player ||
        game.phase !== "trick-play" ||
        game.turnActorId !== playerId
    ) {
        return [];
    }

    return legalCardsForHand(
        player.hand,
        game.trick
    );
}

function ensureCurrentPlayer(game, playerId) {
    if (game.phase !== "trick-play") {
        throw new Error(
            "Mindi Coat is not in trick-play phase."
        );
    }

    if (game.turnActorId !== playerId) {
        throw new Error("It is not your turn.");
    }
}

export function playCard(game, playerId, cardId) {
    ensureCurrentPlayer(game, playerId);

    const player = getGamePlayer(game, playerId);

    if (!player) {
        throw new Error(
            "Player is not in this Mindi Coat game."
        );
    }

    const cardIndex = player.hand.findIndex(
        (card) => card.id === cardId
    );

    if (cardIndex === -1) {
        throw new Error("You do not own that card.");
    }

    const card = player.hand[cardIndex];

    const validation = validateCardPlay(
        player.hand,
        card,
        game.trick
    );

    if (!validation.ok) {
        throw new Error(validation.message);
    }

    const updatedIndex = player.hand.findIndex(
        (item) => item.id === cardId
    );

    if (updatedIndex === -1) {
        throw new Error(
            "The selected card is no longer available."
        );
    }

    player.hand.splice(updatedIndex, 1);

    game.trick.push({
        playerId,
        seat: player.seat,
        card: clone(card),
    });

    if (game.trick.length < 4) {
        game.currentSeat = NEXT_SEAT[player.seat];

        game.turnActorId =
            playerForSeat(
                game,
                game.currentSeat
            ).id;

        return {
            card: clone(card),
            playerId,
            sourceSeat: player.seat,
            trickComplete: false,
            trumpRevealed: false,
        };
    }

    const winningPlay = resolveTrick(
        game.trick,
        game.trumpSuit
    );

    const winner = playerForSeat(
        game,
        winningPlay.seat
    );

    winner.tricksWon += 1;

    const tensInTrick = game.trick.filter(
        (play) => isKeyCard(play.card)
    ).length;

    winner.tensCaptured += tensInTrick;

    game.lastTrickWinner = winner.seat;

    const completed = clone(game.trick);

    game.completedTricks.push({
        winnerSeat: winner.seat,
        plays: completed,
        tens: tensInTrick,
    });

    game.trick = [];

    const handComplete =
        game.completedTricks.length === 13;

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
        completedTricks:
            game.completedTricks.length,
        tensCaptured: tensInTrick,
        handComplete,
        trumpRevealed: false,
        handResult: clone(game.handResult),
        winnerTeam: game.winnerTeam,
    };
}

function finalizeHand(game) {
    game.phase = "hand-complete";

    const tensA = getTeamTens(
        game.players,
        "A"
    );

    const tensB = getTeamTens(
        game.players,
        "B"
    );

    const tricksA = game.players
        .filter((player) => player.team === "A")
        .reduce(
            (sum, player) =>
                sum + player.tricksWon,
            0
        );

    const tricksB = game.players
        .filter((player) => player.team === "B")
        .reduce(
            (sum, player) =>
                sum + player.tricksWon,
            0
        );

    const result = calculateHandResult({
        tensA,
        tensB,
        tricksA,
        tricksB,
    });

    if (result.winnerTeam) {
        game.scores[result.winnerTeam] +=
            result.score;
    }

    const winner =
        game.scores.A >= game.targetScore
            ? "A"
            : game.scores.B >= game.targetScore
                ? "B"
                : null;

    if (winner) {
        game.winnerTeam = winner;
        game.status = "game-complete";
        game.phase = "game-complete";
    }

    game.handResult = {
        ...result,
        handNumber: game.handNumber,
        tens: {
            A: tensA,
            B: tensB,
        },
        tricks: {
            A: tricksA,
            B: tricksB,
        },
        scores: clone(game.scores),
        winnerTeam: game.winnerTeam,
        winningTeamName: result.winnerTeam
            ? TEAM_LABEL[result.winnerTeam]
            : null,
    };
}

export function startNextHand(game, playerId) {
    if (game.phase !== "hand-complete") {
        throw new Error(
            "The current hand is not complete."
        );
    }

    if (game.status === "game-complete") {
        throw new Error(
            "The Mindi Coat game is complete."
        );
    }

    const player = getGamePlayer(
        game,
        playerId
    );

    if (
        !player ||
        player.seat !== game.dealer
    ) {
        throw new Error(
            "Only the dealer may start the next hand."
        );
    }

    newHandState(game);

    return game;
}

function publicPlayer(player, game) {
    return {
        id: player.id,
        username: player.username,
        seat: player.seat,
        seatLabel: SEAT_LABEL[player.seat],
        team: player.team,
        teamLabel: TEAM_LABEL[player.team],
        connected: player.connected,

        cardCount:
            player.hand.length +
            (
                game.trumpCard &&
                    game.trumpOwnerId === player.id &&
                    !game.trumpRevealed
                    ? 1
                    : 0
            ),

        tricksWon: player.tricksWon,
        tensCaptured: player.tensCaptured,
    };
}

function publicTrick(game) {
    return game.trick.map((play) => ({
        playerId: play.playerId,
        seat: play.seat,
        card: clone(play.card),
    }));
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

        trumpMode: game.trumpMode,

        // Never reveal the trump suit until Hukum
        // has actually been opened.
        trumpSuit: game.trumpRevealed
            ? game.trumpSuit
            : null,

        trumpRevealed:
            game.trumpRevealed,

        // Never expose the hidden trump card itself
        // before reveal.
        ...(game.trumpRevealed
            ? {
                trumpCard:
                    clone(game.trumpCard),
            }
            : {}),

        hukumOpenedById:
            game.hukumOpenedById || null,

        players: game.players.map(
            (player) =>
                publicPlayer(player, game)
        ),

        trick: publicTrick(game),

        completedTricks:
            game.completedTricks.map(
                (item) => ({
                    winnerSeat:
                        item.winnerSeat,
                    plays: item.plays,
                    tens: item.tens,
                })
            ),

        trickCount:
            game.completedTricks.length,

        lastTrickWinner:
            game.lastTrickWinner,

        scores: clone(game.scores),

        handResult:
            clone(game.handResult),

        winnerTeam:
            game.winnerTeam,

        targetScore:
            game.targetScore,
    };
}

export function getPrivateState(game, playerId) {
    const player = getGamePlayer(
        game,
        playerId
    );

    if (!player) {
        throw new Error(
            "You are not part of this Mindi Coat game."
        );
    }

    /*
     * IMPORTANT:
     *
     * While the designated Hukum selector is
     * choosing the hidden card, DO NOT send the
     * real card objects to that player.
     *
     * Instead, send only opaque position IDs.
     *
     * Example:
     * hukum-slot-1
     * hukum-slot-2
     * ...
     * hukum-slot-13
     *
     * This prevents the selector from seeing
     * the rank/suit of any card before hiding
     * Hukum.
     */
    const isHukumSelector =
        game.phase === "trump-select" &&
        game.turnActorId === playerId &&
        !game.trumpRevealed;

    const privateHand = isHukumSelector
        ? player.hand.map((_, index) => ({
            id: `hukum-slot-${index + 1}`,
            hidden: true,
        }))
        : clone(player.hand);

    return {
        ...getPublicState(game),

        playerId,
        seat: player.seat,
        team: player.team,

        hand: privateHand,

        legalCardIds:
            getLegalCardIds(
                game,
                playerId
            ),

        trumpSelectorId:
            game.trumpOwnerId,

        hiddenTrumpOwnedByYou:
            game.trumpOwnerId === playerId &&
            !game.trumpRevealed,

        canSelectTrump:
            game.phase === "trump-select" &&
            game.turnActorId === playerId,

        canOpenHukum:
            canOpenHukum(
                game,
                playerId
            ),

        hukumHidden:
            Boolean(
                game.trumpCard &&
                !game.trumpRevealed
            ),

        canStartNextHand:
            game.phase === "hand-complete" &&
            player.seat === game.dealer &&
            game.status !== "game-complete",
    };
}

export function startHandForTests(game) {
    newHandState(game);
    return game;
}

export function setHandsForTests(
    game,
    handsByPlayerId
) {
    for (const player of game.players) {
        player.hand = sortHand(
            clone(
                handsByPlayerId[
                player.id
                ] || []
            )
        );

        player.tricksWon = 0;
        player.tensCaptured = 0;
    }
}

export function getSeatPlayer(
    game,
    seat
) {
    return playerForSeat(
        game,
        seat
    );
}

export { TEAM_SEATS };