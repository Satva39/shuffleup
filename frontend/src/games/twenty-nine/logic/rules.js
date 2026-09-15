export const HAND_SIZE = 8;
export const TRICKS_PER_HAND = 8;
export const TARGET_SCORE = 6;

export function isCardLegal(cardId, legalCardIds = []) {
    return legalCardIds.includes(cardId);
}
