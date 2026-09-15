import { RANKS, SUIT_SYMBOLS } from "./cards";

export function createPreviewDeck() {
    return RANKS.flatMap((rank) =>
        Object.entries(SUIT_SYMBOLS).map(([suit, symbol]) => ({
            id: `${rank}${suit}`,
            rank,
            suit,
            symbol,
        }))
    );
}
