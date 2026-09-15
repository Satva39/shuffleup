export function formatScore(score) {
    if (score > 0) return `+${score}`;
    return `${score}`;
}
