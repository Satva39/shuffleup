export function trickNumber(state) {
    return Math.min((state?.completedTricks?.length || 0) + 1, 8);
}
