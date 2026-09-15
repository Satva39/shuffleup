import { RANKS, SUITS } from "./cards";

export function createDeck() {
    return SUITS.flatMap((suit) => RANKS.map((rank, index) => ({
        id: `${rank}-${suit}`,
        rank,
        suit,
        value: index + 1,
    })));
}
