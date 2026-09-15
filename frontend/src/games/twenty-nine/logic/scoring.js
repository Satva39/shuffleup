export function teamScore(state, team) {
    return state?.scores?.[team] ?? 0;
}
