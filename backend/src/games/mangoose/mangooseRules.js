export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 12;
export const DECK_SIZE = 52;

export const MONGOOSE_CALL_WINDOW_MS = 3000;

export const GAME_STATUS = {
    DEALING: "dealing",
    PLAYING: "playing",
    COMPLETE: "complete",
};

export const PLAYER_STATUS = {
    ACTIVE: "active",
    FINISHED: "finished",
    DISCONNECTED: "disconnected",
    WINNER: "winner",
    MONGOOSE: "mongoose",
};

export const ACTIONS = {
    FLIP: "flip",
    PLAY_CENTER: "play-center",
    PLAY_OPPONENT: "play-opponent",
    PLAY_OPEN: "play-open",
    PLAY_OWN: "play-own",
    CALL_MONGOOSE: "call-mongoose",
};

export const SUITS = [
    "spades",
    "hearts",
    "diamonds",
    "clubs",
];

export const RANKS = [
    "A",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "J",
    "Q",
    "K",
];

export const RANK_VALUES = {
    A: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
    7: 7,
    8: 8,
    9: 9,
    10: 10,
    J: 11,
    Q: 12,
    K: 13,
};

export function validatePlayerCount(count) {
    if (count < MIN_PLAYERS) {
        throw new Error(
            `Mangoose requires at least ${MIN_PLAYERS} players.`
        );
    }

    if (count > MAX_PLAYERS) {
        throw new Error(
            `Mangoose supports a maximum of ${MAX_PLAYERS} players.`
        );
    }

    return true;
}

export function isAdjacentRank(sourceRank, targetRank) {
    const source = RANK_VALUES[sourceRank];
    const target = RANK_VALUES[targetRank];

    if (!source || !target) {
        return false;
    }

    return Math.abs(source - target) === 1;
}

export function canPlayOnCenter(card, stack) {
    if (!card || !stack) {
        return false;
    }

    const topCard =
        stack.cards?.[stack.cards.length - 1] ||
        stack.topCard ||
        null;

    if (!topCard) {
        // A foundation can only be started by its matching Ace.
        return (
            card.rank === "A" &&
            card.suit === stack.suit
        );
    }

    // CENTER RULE:
    // The rank must be exactly one above or below,
    // AND the suit must match.
    //
    // 5♠ -> 4♠ ✅
    // 5♠ -> 6♠ ✅
    // 5♠ -> 6♦ ❌
    // 5♠ -> 4♣ ❌
    return (
        card.suit === topCard.suit &&
        isAdjacentRank(
            card.rank,
            topCard.rank
        )
    );
}

export function canPlayOnOpponent(
    card,
    opponentTopCard
) {
    if (!card || !opponentTopCard) {
        return false;
    }

    // OPPONENT OPEN PILE RULE:
    // Exact ascending order only. Suit does not matter.
    //
    // 4♠ -> 5♥ ✅
    // 4♠ -> 5♣ ✅
    // 5♠ -> 4♥ ❌
    // 5♠ -> 6♦ ✅
    const cardValue = RANK_VALUES[card.rank];
    const topValue =
        RANK_VALUES[opponentTopCard.rank];

    if (!cardValue || !topValue) {
        return false;
    }

    return cardValue === topValue + 1;
}

export function isValidAction(action) {
    return Object.values(ACTIONS).includes(action);
}
