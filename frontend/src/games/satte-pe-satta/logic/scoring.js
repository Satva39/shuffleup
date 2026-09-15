import { RANK_VALUES } from "./cards";

export function handPenalty(hand = []) {
    return hand.reduce((sum, card) => sum + (RANK_VALUES[card.rank] || 0), 0);
}

export function sortedResults(result) {
    return [...(result?.ranking || [])].sort((a, b) => a.rank - b.rank);
}
