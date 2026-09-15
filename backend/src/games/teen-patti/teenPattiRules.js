export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 6;
export const TOTAL_ROUNDS = 11;

export const PLAYER_STATUS = {
    ACTIVE: "active",
    FOLDED: "folded",
    DISCONNECTED: "disconnected",
    WINNER: "winner",
};

export const GAME_STATUS = {
    DEALING: "dealing",
    PLAYING: "playing",
    ROUND_COMPLETE: "round-complete",
    COMPLETE: "complete",
};

export const ACTIONS = {
    FOLD: "fold",
    PLAY: "play",
    NEXT_ROUND: "next-round",
};

export const HAND_RANKS = {
    HIGH_CARD: 1,
    PAIR: 2,
    COLOR: 3,
    SEQUENCE: 4,
    PURE_SEQUENCE: 5,
    TRAIL: 6,
};

export const HAND_NAMES = {
    [HAND_RANKS.HIGH_CARD]: "High Card",
    [HAND_RANKS.PAIR]: "Pair",
    [HAND_RANKS.COLOR]: "Color",
    [HAND_RANKS.SEQUENCE]: "Sequence",
    [HAND_RANKS.PURE_SEQUENCE]: "Pure Sequence",
    [HAND_RANKS.TRAIL]: "Trail",
};

export function validatePlayerCount(count) {
    if (count < MIN_PLAYERS) {
        throw new Error(
            `Teen Patti requires at least ${MIN_PLAYERS} players.`
        );
    }

    if (count > MAX_PLAYERS) {
        throw new Error(
            `Teen Patti supports a maximum of ${MAX_PLAYERS} players.`
        );
    }

    return true;
}

export function isValidAction(action) {
    return Object.values(ACTIONS).includes(action);
}