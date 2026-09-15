export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 12;
export const STARTING_HAND_SIZE = 7;
export const GAME_TARGET_SCORE = 500;

export const COLORS = ["red", "yellow", "green", "blue"];

export const TYPES = {
    NUMBER: "number",
    SKIP: "skip",
    REVERSE: "reverse",
    DRAW_TWO: "draw-two",
    WILD: "wild",
    WILD_DRAW_FOUR: "wild-draw-four",
};

export const STATUS = {
    PLAYING: "playing",
    ROUND_COMPLETE: "round-complete",
    GAME_COMPLETE: "game-complete",
};

export const ACTIONS = {
    PLAY_CARD: "play-card",
    DRAW_CARD: "draw-card",
    CHOOSE_COLOR: "choose-color",
    DECLARE_UNO: "uno",
    CALL_UNO: "call-uno",
    NEXT_ROUND: "next-round",
};

export function validatePlayerCount(count) {
    if (count < MIN_PLAYERS) {
        throw new Error(`UNO requires at least ${MIN_PLAYERS} players.`);
    }
    if (count > MAX_PLAYERS) {
        throw new Error(`UNO supports at most ${MAX_PLAYERS} players.`);
    }
}

export function isWild(card) {
    return card?.type === TYPES.WILD || card?.type === TYPES.WILD_DRAW_FOUR;
}

export function isActionCard(card) {
    return [
        TYPES.SKIP,
        TYPES.REVERSE,
        TYPES.DRAW_TWO,
        TYPES.WILD,
        TYPES.WILD_DRAW_FOUR,
    ].includes(card?.type);
}

export function getCardPoints(card) {
    if (!card) return 0;
    if (card.type === TYPES.NUMBER) return Number(card.value);
    if ([TYPES.SKIP, TYPES.REVERSE, TYPES.DRAW_TWO].includes(card.type)) return 20;
    if ([TYPES.WILD, TYPES.WILD_DRAW_FOUR].includes(card.type)) return 50;
    return 0;
}
