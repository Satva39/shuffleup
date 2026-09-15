export const SUIT_SYMBOLS = { S: "♠", H: "♥", D: "♦", C: "♣" };
export const SUIT_NAMES = { S: "Spades", H: "Hearts", D: "Diamonds", C: "Clubs" };
export const SEAT_LABELS = { N: "North", E: "East", S: "South", W: "West" };
export const TEAM_LABELS = { A: "Team A", B: "Team B" };

export function cardName(card) {
    return card ? `${card.rank} of ${SUIT_NAMES[card.suit] || card.suit}` : "";
}

export function cardClass(card) {
    const red = card?.suit === "H" || card?.suit === "D";
    return `mindi-card${red ? " red" : ""}`;
}

export function playerForSeat(players, seat) {
    return players?.find((player) => player.seat === seat) || null;
}
