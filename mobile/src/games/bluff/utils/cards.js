export function cardSymbol(suit) {
  return { S: "♠", H: "♥", D: "♦", C: "♣" }[suit] || "•";
}

export function cardColor(suit) {
  return suit === "H" || suit === "D" ? "#D83D5A" : "#182137";
}

export function phaseLabel(phase) {
  if (phase === "challenge") return "Challenge window";
  if (phase === "final-challenge") return "Final challenge";
  if (phase === "play") return "Play phase";
  return "Waiting";
}
