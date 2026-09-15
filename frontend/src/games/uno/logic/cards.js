export const UNO_COLORS = ["red", "yellow", "green", "blue"];

export const ACTIONS = {
    PLAY_CARD: "play-card",
    DRAW_CARD: "draw-card",
    CHOOSE_COLOR: "choose-color",
    DECLARE_UNO: "uno",
    CALL_UNO: "call-uno",
    NEXT_ROUND: "next-round",
};

export const UNO_TYPES = {
    NUMBER: "number",
    SKIP: "skip",
    REVERSE: "reverse",
    DRAW_TWO: "draw-two",
    WILD: "wild",
    WILD_DRAW_FOUR: "wild-draw-four",
};

export function isWildCard(card) {
    return card?.type === UNO_TYPES.WILD || card?.type === UNO_TYPES.WILD_DRAW_FOUR;
}

export function cardLabel(card) {
    if (!card) return "";
    if (card.type === UNO_TYPES.NUMBER) return String(card.value);
    if (card.type === UNO_TYPES.SKIP) return "⊘";
    if (card.type === UNO_TYPES.REVERSE) return "↻";
    if (card.type === UNO_TYPES.DRAW_TWO) return "+2";
    if (card.type === UNO_TYPES.WILD) return "W";
    if (card.type === UNO_TYPES.WILD_DRAW_FOUR) return "+4";
    return "?";
}

export function cardName(card) {
    if (!card) return "card";
    if (card.type === UNO_TYPES.NUMBER) return `${card.color} ${card.value}`;
    const names = {
        [UNO_TYPES.SKIP]: "Skip",
        [UNO_TYPES.REVERSE]: "Reverse",
        [UNO_TYPES.DRAW_TWO]: "Draw Two",
        [UNO_TYPES.WILD]: "Wild",
        [UNO_TYPES.WILD_DRAW_FOUR]: "Wild Draw Four",
    };
    return names[card.type] || "card";
}
