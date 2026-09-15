import { RANKS } from "./cards";

const rankIndex = (rank) => RANKS.indexOf(rank);

export function sortRow(cards = []) {
    return [...cards].sort((a, b) => rankIndex(a.rank) - rankIndex(b.rank));
}

export function getRowBounds(cards = []) {
    const ordered = sortRow(cards);
    return { lowest: ordered[0] || null, highest: ordered[ordered.length - 1] || null };
}
