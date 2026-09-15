export function phaseLabel(phase) {
    switch (phase) {
        case "trump-select": return "Choose Hukum";
        case "trick-play": return "Trick Play";
        case "hand-complete": return "Hand Complete";
        case "game-complete": return "Game Complete";
        default: return "Mindi Coat";
    }
}

export function teamName(team) {
    return team === "A" ? "Team A" : "Team B";
}
