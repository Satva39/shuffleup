export function formatScore(score) {
    return Number(score || 0).toLocaleString();
}

export function formatTeamSummary(team, scores, bags) {
    return `${team}: ${formatScore(scores?.[team] || 0)} • ${bags?.[team] || 0} bags`;
}
