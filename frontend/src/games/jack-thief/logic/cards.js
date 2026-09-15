export function cardLabel(card) {
    return `${card?.rank || ""}${card?.symbol || ""}`;
}

export function sameRank(first, second) {
    return Boolean(first && second && first.rank === second.rank);
}
