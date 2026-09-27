export function suitSymbol(suit) {
  return (
    {
      S: "♠",
      H: "♥",
      D: "♦",
      C: "♣",
    }[suit] || "•"
  );
}

export function suitColor(suit) {
  return suit === "H" || suit === "D" ? "#E33A59" : "#1A2135";
}

export function seatLabel(seat) {
  return (
    {
      N: "North",
      E: "East",
      S: "South",
      W: "West",
    }[seat] ||
    seat ||
    "—"
  );
}

export function teamLabel(team) {
  return team === "A" ? "Team A · N/S" : team === "B" ? "Team B · E/W" : "—";
}

export function teamName(team) {
  return team === "A" ? "North + South" : team === "B" ? "East + West" : "—";
}
