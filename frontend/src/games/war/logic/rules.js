export const WAR_FACE_DOWN_CARDS = 1;

export const PHASE_LABELS = {
    ready: "Waiting for both players…",
    "battle-reveal": "Battle!",
    war: "WAR!",
    "war-reveal": "Reveal the War card",
    "battle-result": "Battle complete",
};

export function isBattleReveal(phase) {
    return phase === "battle-reveal" || phase === "war-reveal";
}
