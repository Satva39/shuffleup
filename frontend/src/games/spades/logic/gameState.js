export const SEAT_LABELS = { N: "North", E: "East", S: "South", W: "West" };
export const TEAM_LABELS = { A: "Team A", B: "Team B" };

export function playerForSeat(players, seat) {
    return players?.find((player) => player.seat === seat) || null;
}
