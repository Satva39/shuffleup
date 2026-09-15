export function isLegalCard(state, cardId) {
    return Boolean(state?.me?.legalMoves?.includes(cardId));
}

export function playableCards(state) {
    const ids = new Set(state?.me?.legalMoves || []);
    return (state?.me?.hand || []).filter((card) => ids.has(card.id));
}
