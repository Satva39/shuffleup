import { RANKS, SUITS } from "./cards";

export function createDeck() {
    return SUITS.flatMap((suit) => RANKS.map((rank) => ({ id: `${rank}${suit}`, rank, suit })));
}
