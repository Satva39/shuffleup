export function challengeLabel(result) {
    if (!result) return "";
    return result.result === "BLUFF" ? "BLUFF CALLED" : "TRUTH CALLED";
}
