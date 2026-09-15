import {
    RANKS,
    SUITS,
    createCard,
} from "./cards";

export function createDeck() {
    const deck = [];

    for (const suit of SUITS) {
        for (const rank of RANKS) {
            deck.push(createCard(rank, suit));
        }
    }

    return deck;
}