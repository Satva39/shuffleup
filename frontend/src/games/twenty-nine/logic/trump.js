import { SUITS, SUIT_LABEL, SUIT_SYMBOL } from "./cards";

export const trumpOptions = SUITS.map((suit) => ({
    suit,
    label: SUIT_LABEL[suit],
    symbol: SUIT_SYMBOL[suit],
}));
