export function getPlayableCards(
    cards,
    currentTrick
) {
    if (!cards?.length) {
        return [];
    }

    if (!currentTrick?.length) {
        return cards;
    }

    const leadingSuit =
        currentTrick[0]?.card?.suit;

    if (!leadingSuit) {
        return cards;
    }

    const hasLeadingSuit = cards.some(
        (card) => card.suit === leadingSuit
    );

    if (!hasLeadingSuit) {
        return cards;
    }

    return cards.filter(
        (card) => card.suit === leadingSuit
    );
}