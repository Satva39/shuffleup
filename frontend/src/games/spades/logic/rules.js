export function getLegalCardIds(hand, trick, spadesBroken) {
    if (!Array.isArray(hand)) return [];
    if (!trick?.length) {
        const nonSpades = hand.filter((card) => card.suit !== "S");
        if (!spadesBroken && nonSpades.length) return nonSpades.map((card) => card.id);
        return hand.map((card) => card.id);
    }
    const ledSuit = trick[0].card.suit;
    const suited = hand.filter((card) => card.suit === ledSuit);
    return suited.length ? suited.map((card) => card.id) : hand.map((card) => card.id);
}
