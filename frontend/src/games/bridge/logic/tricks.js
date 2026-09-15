export function playableCardIds(hand, trick) {
    if (!trick?.length) return new Set(hand.map((card) => card.id));
    const ledSuit = trick[0].card.suit;
    const hasLed = hand.some((card) => card.suit === ledSuit);
    return new Set(hand.filter((card) => !hasLed || card.suit === ledSuit).map((card) => card.id));
}
