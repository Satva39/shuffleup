export function claimText(claim) {
    if (!claim) return "No active claim";
    return `${claim.count} × ${claim.rank}`;
}
