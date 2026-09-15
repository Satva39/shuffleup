import {
    ACTIONS,
    DECK_SIZE,
    GAME_STATUS,
    MAX_PLAYERS,
    PLAYER_STATUS,
    RANKS,
    SUITS,
    canPlayOnCenter,
    canPlayOnOpponent,
    validatePlayerCount,
} from "./mangooseRules.js";

function createDeck() {
    return SUITS.flatMap((suit) =>
        RANKS.map((rank) => ({
            id: `${rank}-${suit}`,
            rank,
            suit,
        }))
    );
}

function shuffleDeck(deck) {
    for (
        let index = deck.length - 1;
        index > 0;
        index -= 1
    ) {
        const randomIndex = Math.floor(
            Math.random() * (index + 1)
        );

        [deck[index], deck[randomIndex]] = [
            deck[randomIndex],
            deck[index],
        ];
    }

    return deck;
}

function cloneCard(card) {
    return card ? { ...card } : null;
}

function cloneCards(cards) {
    return cards.map(cloneCard);
}

function getPlayer(game, playerId) {
    return game.players.find(
        (player) => player.id === playerId
    );
}

function getPlayerCardCount(player) {
    return (
        player.closedPile.length +
        player.openPile.length +
        (player.flippedCard ? 1 : 0)
    );
}

function dealPlayerCards(deck, playerCount) {
    const hands = Array.from(
        { length: playerCount },
        () => []
    );

    let index = 0;

    while (deck.length > 0) {
        hands[index % playerCount].push(
            deck.pop()
        );
        index += 1;
    }

    return hands;
}

function chooseStartingPlayer(players) {
    return players[0] || null;
}

function emptyLegalTargets() {
    return {
        center: [],
        opponents: [],
        canSelfDrop: false,
    };
}

function getOpenTopCard(player) {
    if (!player?.openPile?.length) {
        return null;
    }

    return player.openPile[
        player.openPile.length - 1
    ];
}

function getCardTargets(
    game,
    playerId,
    card
) {
    if (!card) {
        return emptyLegalTargets();
    }

    const center = game.centerStacks
        .filter((stack) =>
            canPlayOnCenter(card, stack)
        )
        .map((stack) => stack.suit);

    const opponents = game.players
        .filter(
            (opponent) =>
                opponent.id !== playerId &&
                opponent.status ===
                PLAYER_STATUS.ACTIVE &&
                opponent.openPile.length > 0
        )
        .filter((opponent) =>
            canPlayOnOpponent(
                card,
                getOpenTopCard(opponent)
            )
        )
        .map((opponent) => opponent.id);

    return {
        center,
        opponents,
        canSelfDrop:
            center.length === 0 &&
            opponents.length === 0,
    };
}

export function getLegalTargets(game, playerId) {
    const player = getPlayer(game, playerId);

    if (!player?.flippedCard) {
        return emptyLegalTargets();
    }

    return getCardTargets(
        game,
        playerId,
        player.flippedCard
    );
}

function getLegalOpenPlayTargets(
    game,
    playerId
) {
    const player = getPlayer(game, playerId);

    if (!player || player.flippedCard) {
        return emptyLegalTargets();
    }

    const card = getOpenTopCard(player);

    if (!card) {
        return emptyLegalTargets();
    }

    return getCardTargets(
        game,
        playerId,
        card
    );
}

function canDrawClosed(player) {
    return player.closedPile.length > 0 ||
        player.openPile.length > 0;
}

function recycleOpenPileIfClosedIsEmpty(
    player
) {
    if (
        player.closedPile.length === 0 &&
        player.openPile.length > 0 &&
        !player.flippedCard
    ) {
        player.closedPile = [
            ...player.openPile,
        ];
        player.openPile = [];
        return true;
    }

    return false;
}

function takeTopClosedCard(player) {
    recycleOpenPileIfClosedIsEmpty(
        player
    );

    if (player.closedPile.length === 0) {
        throw new Error(
            "You do not have a card to flip."
        );
    }

    player.flippedCard =
        player.closedPile.pop();
    player.flippedSource = "closed";

    return player.flippedCard;
}

function takeTopOpenCardForPlay(player) {
    if (player.openPile.length === 0) {
        throw new Error(
            "Your open pile is empty."
        );
    }

    player.flippedCard =
        player.openPile.pop();
    player.flippedSource = "open";

    return player.flippedCard;
}

function clearActiveCard(player) {
    player.flippedCard = null;
    player.flippedSource = null;
}

function markWinnerIfEmpty(game, player) {
    if (
        player.status ===
        PLAYER_STATUS.DISCONNECTED ||
        player.status ===
        PLAYER_STATUS.WINNER ||
        player.status ===
        PLAYER_STATUS.FINISHED ||
        player.status ===
        PLAYER_STATUS.MONGOOSE
    ) {
        return false;
    }

    if (getPlayerCardCount(player) !== 0) {
        return false;
    }

    if (!game.winner) {
        player.status = PLAYER_STATUS.WINNER;
        game.winner = player.id;
    } else {
        player.status = PLAYER_STATUS.FINISHED;
    }

    return true;
}

function finishGame(game, mongoose) {
    mongoose.status = PLAYER_STATUS.MONGOOSE;
    game.status = GAME_STATUS.COMPLETE;
    game.currentPlayerId = null;

    const winner = getPlayer(
        game,
        game.winner
    );

    game.result = {
        winnerId: winner?.id || null,
        winnerUsername:
            winner?.username || null,
        mongooseId: mongoose.id,
        mongooseUsername: mongoose.username,
        finalStandings: game.players
            .map((player) => ({
                id: player.id,
                username: player.username,
                status: player.status,
                cardsRemaining:
                    getPlayerCardCount(player),
            }))
            .sort(
                (left, right) =>
                    left.cardsRemaining -
                    right.cardsRemaining
            ),
    };
}

function checkForGameCompletion(game) {
    if (game.winner == null) {
        for (const player of game.players) {
            markWinnerIfEmpty(
                game,
                player
            );
        }
    }

    const playersWithCards =
        game.players.filter(
            (player) =>
                player.status !==
                PLAYER_STATUS.DISCONNECTED &&
                player.status !==
                PLAYER_STATUS.WINNER &&
                player.status !==
                PLAYER_STATUS.FINISHED &&
                player.status !==
                PLAYER_STATUS.MONGOOSE &&
                getPlayerCardCount(player) > 0
        );

    if (playersWithCards.length === 1) {
        finishGame(
            game,
            playersWithCards[0]
        );
        return true;
    }

    return false;
}

function advanceTurn(game) {
    if (game.status !== GAME_STATUS.PLAYING) {
        return;
    }

    const startIndex =
        game.players.findIndex(
            (player) =>
                player.id ===
                game.currentPlayerId
        );

    for (
        let offset = 1;
        offset <= game.players.length;
        offset += 1
    ) {
        const player =
            game.players[
            (Math.max(startIndex, 0) +
                offset) %
            game.players.length
            ];

        if (
            player?.connected &&
            player.status ===
            PLAYER_STATUS.ACTIVE
        ) {
            game.currentPlayerId =
                player.id;
            game.turnNumber += 1;
            return;
        }
    }

    throw new Error(
        "No connected player can continue the game."
    );
}

function buildFinishedTurnResult(
    game,
    type,
    playerId,
    card,
    action,
    target = null
) {
    return {
        type,
        playerId,
        card: cloneCard(card),
        action,
        target,
        targetPlayerId:
            typeof target === "string" &&
                target !== null &&
                action === ACTIONS.PLAY_OPPONENT
                ? target
                : null,
        sameTurn: false,
        winner: game.winner,
    };
}

export function createMangooseGame(room) {
    const players = room.players.map(
        (player, index) => ({
            id: player.id,
            username: player.username,
            seat: index,
            connected:
                player.connected !== false,
            status:
                player.connected === false
                    ? PLAYER_STATUS.DISCONNECTED
                    : PLAYER_STATUS.ACTIVE,
            socketId:
                player.socketId || null,
            closedPile: [],
            openPile: [],
            flippedCard: null,
            flippedSource: null,
        })
    );

    validatePlayerCount(players.length);

    if (players.length > MAX_PLAYERS) {
        throw new Error("Too many players.");
    }

    const deck = shuffleDeck(createDeck());

    if (deck.length !== DECK_SIZE) {
        throw new Error("Invalid deck.");
    }

    // Four fixed foundation slots. Each slot starts empty;
    // its matching Ace starts that foundation.
    const centerStacks = SUITS.map(
        (suit) => ({
            suit,
            cards: [],
        })
    );

    const dealtHands = dealPlayerCards(
        deck,
        players.length
    );

    players.forEach((player, index) => {
        player.closedPile = dealtHands[index];
    });

    const startingPlayer =
        chooseStartingPlayer(
            players.filter(
                (player) =>
                    player.status ===
                    PLAYER_STATUS.ACTIVE
            )
        );

    return {
        roomCode: room.code,
        gameId: "mangoose",
        status: GAME_STATUS.PLAYING,
        players,
        centerStacks,
        currentPlayerId:
            startingPlayer?.id || null,
        turnNumber: 1,
        winner: null,
        result: null,
        pendingMongoose: null,
        createdAt: Date.now(),
    };
}

export function applyAction(
    game,
    playerId,
    action,
    target
) {
    const player = getPlayer(
        game,
        playerId
    );

    if (!player) {
        throw new Error(
            "You are not part of this game."
        );
    }

    if (game.status !== GAME_STATUS.PLAYING) {
        throw new Error(
            "Game is not active."
        );
    }

    if (!Object.values(ACTIONS).includes(action)) {
        throw new Error("Invalid action.");
    }

    if (
        action === ACTIONS.CALL_MONGOOSE
    ) {
        return callMongoose(
            game,
            playerId,
            target
        );
    }

    if (game.pendingMongoose) {
        throw new Error(
            "The table is deciding whether Mongoose was called."
        );
    }

    if (
        game.currentPlayerId !== playerId
    ) {
        throw new Error(
            "It is not your turn."
        );
    }

    if (!player.connected) {
        throw new Error(
            "You are disconnected."
        );
    }

    if (action === ACTIONS.FLIP) {
        if (player.flippedCard) {
            throw new Error(
                "You already have a revealed card."
            );
        }

        const card =
            takeTopClosedCard(player);

        return {
            type: "flipped",
            playerId,
            source: "closed",
            card: cloneCard(card),
            legalTargets:
                getLegalTargets(
                    game,
                    playerId
                ),
        };
    }

    if (action === ACTIONS.PLAY_OPEN) {
        if (player.flippedCard) {
            throw new Error(
                "Finish your current card first."
            );
        }

        const openCard =
            getOpenTopCard(player);

        if (!openCard) {
            throw new Error(
                "Your open pile is empty."
            );
        }

        const legalTargets =
            getCardTargets(
                game,
                playerId,
                openCard
            );

        if (
            legalTargets.center.length === 0 &&
            legalTargets.opponents.length === 0
        ) {
            throw new Error(
                "Your top open card has no legal destination."
            );
        }

        const card =
            takeTopOpenCardForPlay(
                player
            );

        return {
            type: "open-card-ready",
            playerId,
            source: "open",
            card: cloneCard(card),
            legalTargets,
        };
    }

    if (!player.flippedCard) {
        throw new Error(
            "Flip a card first."
        );
    }

    const legalTargets =
        getLegalTargets(
            game,
            playerId
        );

    const card = player.flippedCard;
    const source =
        player.flippedSource ||
        "closed";

    let targetPlayer = null;

    if (action === ACTIONS.PLAY_CENTER) {
        if (
            !legalTargets.center.includes(
                target
            )
        ) {
            throw new Error(
                "That card cannot be played on this center stack."
            );
        }

        const stack =
            game.centerStacks.find(
                (item) =>
                    item.suit === target
            );

        stack.cards.push(card);
        clearActiveCard(player);

        const wonNow =
            markWinnerIfEmpty(
                game,
                player
            );

        if (
            checkForGameCompletion(game)
        ) {
            return buildFinishedTurnResult(
                game,
                "game-complete",
                playerId,
                card,
                action,
                target
            );
        }

        if (wonNow) {
            if (game.status === GAME_STATUS.PLAYING) {
                advanceTurn(game);
            }

            return buildFinishedTurnResult(
                game,
                "player-finished",
                playerId,
                card,
                action,
                target
            );
        }

        return {
            type: "continued",
            playerId,
            source,
            card: cloneCard(card),
            action,
            target,
            targetPlayerId: null,
            sameTurn: true,
            winner: game.winner,
        };
    }

    if (action === ACTIONS.PLAY_OPPONENT) {
        if (
            !legalTargets.opponents.includes(
                target
            )
        ) {
            throw new Error(
                "That card cannot be played on that player's pile."
            );
        }

        targetPlayer = getPlayer(
            game,
            target
        );

        targetPlayer.openPile.push(card);
        clearActiveCard(player);

        // If the target player's closed pile is empty,
        // their open pile becomes their new closed pile.
        recycleOpenPileIfClosedIsEmpty(
            targetPlayer
        );

        const wonNow =
            markWinnerIfEmpty(
                game,
                player
            );

        if (
            checkForGameCompletion(game)
        ) {
            return buildFinishedTurnResult(
                game,
                "game-complete",
                playerId,
                card,
                action,
                target
            );
        }

        if (wonNow) {
            if (game.status === GAME_STATUS.PLAYING) {
                advanceTurn(game);
            }

            return buildFinishedTurnResult(
                game,
                "player-finished",
                playerId,
                card,
                action,
                target
            );
        }

        return {
            type: "continued",
            playerId,
            source,
            card: cloneCard(card),
            action,
            target,
            targetPlayerId:
                targetPlayer.id,
            sameTurn: true,
            winner: game.winner,
        };
    }

    if (action === ACTIONS.PLAY_OWN) {
        const hadLegalTarget =
            legalTargets.center.length > 0 ||
            legalTargets.opponents.length > 0;

        player.openPile.push(card);
        clearActiveCard(player);

        if (hadLegalTarget) {
            // The mistake is not automatically a Mongoose.
            // Other players get a short call window.
            game.pendingMongoose = {
                offenderId: player.id,
                offenderUsername:
                    player.username,
                card: cloneCard(card),
                createdAt: Date.now(),
            };

            return {
                type: "mongoose-window",
                playerId,
                source,
                card: cloneCard(card),
                action,
                target: null,
                pendingMongoose:
                    game.pendingMongoose,
                sameTurn: false,
            };
        }

        const wonNow =
            markWinnerIfEmpty(
                game,
                player
            );

        if (
            checkForGameCompletion(game)
        ) {
            return buildFinishedTurnResult(
                game,
                "game-complete",
                playerId,
                card,
                action
            );
        }

        if (wonNow) {
            if (game.status === GAME_STATUS.PLAYING) {
                advanceTurn(game);
            }
        } else {
            advanceTurn(game);
        }

        return buildFinishedTurnResult(
            game,
            "turn-ended",
            playerId,
            card,
            action
        );
    }

    throw new Error(
        "Invalid Mangoose play action."
    );
}

function applyMongoosePenalty(
    game,
    mongoosePlayerId
) {
    const mongoosePlayer =
        getPlayer(game, mongoosePlayerId);

    if (!mongoosePlayer) {
        throw new Error(
            "Mongoose player was not found."
        );
    }

    let penaltyCount = 0;

    for (const player of game.players) {
        if (
            player.id === mongoosePlayer.id ||
            player.status ===
            PLAYER_STATUS.DISCONNECTED ||
            player.status ===
            PLAYER_STATUS.WINNER ||
            player.status ===
            PLAYER_STATUS.FINISHED
        ) {
            continue;
        }

        recycleOpenPileIfClosedIsEmpty(
            player
        );

        if (
            player.closedPile.length === 0
        ) {
            continue;
        }

        const penaltyCard =
            player.closedPile.pop();

        mongoosePlayer.closedPile.push(
            penaltyCard
        );

        penaltyCount += 1;
    }

    return penaltyCount;
}

function resolveSuccessfulMongooseCall(
    game,
    callerId
) {
    const pending =
        game.pendingMongoose;

    if (!pending) {
        throw new Error(
            "There is no active Mongoose call window."
        );
    }

    const offender = getPlayer(
        game,
        pending.offenderId
    );

    const caller = getPlayer(
        game,
        callerId
    );

    if (!offender || !caller) {
        throw new Error(
            "Mongoose call players were not found."
        );
    }

    const penaltyCount =
        applyMongoosePenalty(
            game,
            offender.id
        );

    game.pendingMongoose = null;

    const gameFinished =
        checkForGameCompletion(game);

    if (!gameFinished) {
        advanceTurn(game);
    }

    return {
        type: gameFinished
            ? "mongoose-called-game-complete"
            : "mongoose-called",
        callerId,
        offenderId: offender.id,
        offenderUsername:
            offender.username,
        penaltyCount,
        card: pending.card,
        message:
            "MONGOOSE! Your mistake was called and the penalty was applied.",
        winner: game.winner,
    };
}

function resolveWithoutMongoose(game) {
    const pending =
        game.pendingMongoose;

    if (!pending) {
        return null;
    }

    const offender = getPlayer(
        game,
        pending.offenderId
    );

    game.pendingMongoose = null;

    if (!offender) {
        return null;
    }

    const wonNow =
        markWinnerIfEmpty(
            game,
            offender
        );

    const gameFinished =
        checkForGameCompletion(game);

    if (!gameFinished && !wonNow) {
        advanceTurn(game);
    } else if (
        !gameFinished &&
        wonNow
    ) {
        advanceTurn(game);
    }

    return {
        type: gameFinished
            ? "mongoose-window-expired-game-complete"
            : "mongoose-window-expired",
        offenderId: offender.id,
        card: pending.card,
        winner: game.winner,
    };
}

function callMongoose(
    game,
    callerId,
    offenderId
) {
    if (!game.pendingMongoose) {
        throw new Error(
            "No player can be called Mongoose right now."
        );
    }

    if (
        game.pendingMongoose.offenderId ===
        callerId
    ) {
        throw new Error(
            "You cannot call Mongoose on yourself."
        );
    }

    if (
        offenderId !==
        game.pendingMongoose.offenderId
    ) {
        throw new Error(
            "That player is not the current Mongoose target."
        );
    }

    const caller = getPlayer(
        game,
        callerId
    );

    if (
        !caller ||
        !caller.connected ||
        caller.status !== PLAYER_STATUS.ACTIVE
    ) {
        throw new Error(
            "Only an active connected player can call Mongoose."
        );
    }

    return resolveSuccessfulMongooseCall(
        game,
        callerId
    );
}

export function resolvePendingMongoose(game) {
    return resolveWithoutMongoose(game);
}

export function markPlayerDisconnected(
    game,
    playerId
) {
    const player = getPlayer(
        game,
        playerId
    );

    if (!player) {
        return game;
    }

    player.connected = false;
    player.resumeStatus =
        player.status === PLAYER_STATUS.DISCONNECTED
            ? player.resumeStatus
            : player.status;
    player.status =
        PLAYER_STATUS.DISCONNECTED;

    if (
        game.status === GAME_STATUS.PLAYING &&
        game.pendingMongoose &&
        game.pendingMongoose.offenderId ===
        playerId
    ) {
        resolveWithoutMongoose(game);
        return game;
    }

    if (
        game.status === GAME_STATUS.PLAYING &&
        game.currentPlayerId === playerId
    ) {
        try {
            advanceTurn(game);
        } catch {
            game.currentPlayerId = null;
        }
    }

    return game;
}

export function reconnectPlayer(
    game,
    playerId
) {
    const player = getPlayer(
        game,
        playerId
    );

    if (!player) {
        return game;
    }

    player.connected = true;

    if (
        player.status ===
        PLAYER_STATUS.DISCONNECTED
    ) {
        player.status =
            player.resumeStatus ||
            (game.status === GAME_STATUS.COMPLETE
                ? PLAYER_STATUS.MONGOOSE
                : PLAYER_STATUS.ACTIVE);
        player.resumeStatus = null;
    }

    return game;
}

export function getPublicGameState(game) {
    return {
        roomCode: game.roomCode,
        gameId: game.gameId,
        status: game.status,
        turnNumber: game.turnNumber,
        players: game.players.map(
            (player) => ({
                id: player.id,
                username: player.username,
                seat: player.seat,
                connected: player.connected,
                status: player.status,
                closedCount:
                    player.closedPile.length,
                openCount:
                    player.openPile.length,
                openTopCard: cloneCard(
                    getOpenTopCard(player)
                ),
            })
        ),
        centerStacks:
            game.centerStacks.map(
                (stack) => ({
                    suit: stack.suit,
                    topCard: cloneCard(
                        stack.cards[
                        stack.cards.length -
                        1
                        ]
                    ),
                    cardCount:
                        stack.cards.length,
                })
            ),
        currentPlayerId:
            game.currentPlayerId,
        winner: game.winner,
        pendingMongoose:
            game.pendingMongoose
                ? {
                    offenderId:
                        game.pendingMongoose
                            .offenderId,
                    offenderUsername:
                        game.pendingMongoose
                            .offenderUsername,
                    createdAt:
                        game.pendingMongoose
                            .createdAt,
                }
                : null,
        result:
            game.status === GAME_STATUS.COMPLETE
                ? game.result
                : null,
    };
}

export function getPrivateGameState(
    game,
    playerId
) {
    const publicState =
        getPublicGameState(game);

    const player = getPlayer(
        game,
        playerId
    );

    if (!player) {
        throw new Error(
            "You are not part of this game."
        );
    }

    const legalTargets =
        game.currentPlayerId === playerId &&
            player.flippedCard
            ? getLegalTargets(
                game,
                playerId
            )
            : emptyLegalTargets();

    const openTargets =
        !player.flippedCard &&
            game.currentPlayerId === playerId
            ? getLegalOpenPlayTargets(
                game,
                playerId
            )
            : emptyLegalTargets();

    const canCallMongoose = Boolean(
        game.pendingMongoose &&
        game.pendingMongoose.offenderId !==
        playerId &&
        player.connected &&
        player.status ===
        PLAYER_STATUS.ACTIVE
    );

    const legalActions = [];

    if (
        game.status === GAME_STATUS.PLAYING &&
        game.currentPlayerId === playerId &&
        !game.pendingMongoose
    ) {
        if (!player.flippedCard) {
            if (canDrawClosed(player)) {
                legalActions.push(ACTIONS.FLIP);
            }

            if (
                player.openPile.length > 0 &&
                (openTargets.center.length > 0 ||
                    openTargets.opponents.length >
                    0)
            ) {
                legalActions.push(
                    ACTIONS.PLAY_OPEN
                );
            }
        } else {
            legalActions.push(
                ACTIONS.PLAY_CENTER
            );
            legalActions.push(
                ACTIONS.PLAY_OPPONENT
            );
            legalActions.push(
                ACTIONS.PLAY_OWN
            );
        }
    }

    if (canCallMongoose) {
        legalActions.push(
            ACTIONS.CALL_MONGOOSE
        );
    }

    return {
        ...publicState,
        closedCount:
            player.closedPile.length,
        openCount:
            player.openPile.length,
        openTopCard: cloneCard(
            getOpenTopCard(player)
        ),
        flippedCard: cloneCard(
            player.flippedCard
        ),
        flippedSource:
            player.flippedSource || null,
        legalActions,
        legalTargets,
        openTargets,
        canCallMongoose,
        privateNotice: null,
    };
}

export {
    createDeck,
    shuffleDeck,
    getPlayerCardCount,
    applyMongoosePenalty,
    recycleOpenPileIfClosedIsEmpty,
};
