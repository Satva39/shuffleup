export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 6;
export const HAND_SIZE = 13;
export const MAX_PENALTY = 80;

export const GAME_STATUS = {
    PLAYING: "playing",
    COMPLETE: "complete",
};

export const PLAYER_STATUS = {
    ACTIVE: "active",
    DISCONNECTED: "disconnected",
    DECLARED: "declared",
    WINNER: "winner",
};

export const ACTIONS = {
    DRAW_CLOSED: "draw-closed",
    DRAW_DISCARD: "draw-discard",
    DISCARD: "discard",
    DECLARE: "declare",
};

export const RANKS = [
    "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K",
];

export const SUITS = [
    "spades", "hearts", "diamonds", "clubs",
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
    J: 10,
    Q: 10,
    K: 10,
};

export function validatePlayerCount(count) {
    if (count < MIN_PLAYERS || count > MAX_PLAYERS) {
        throw new Error(`Indian Rummy supports ${MIN_PLAYERS}-${MAX_PLAYERS} players.`);
    }
}
