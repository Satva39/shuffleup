export const STRAINS = ["C", "D", "H", "S", "NT"];
export const STRAIN_LABELS = { C: "♣", D: "♦", H: "♥", S: "♠", NT: "NT" };

export function bidLabel(bid) {
    return bid ? `${bid.level}${STRAIN_LABELS[bid.strain]}` : "—";
}

export function auctionEntryLabel(entry) {
    if (entry.type === "pass") return "Pass";
    if (entry.type === "double") return "Double";
    if (entry.type === "redouble") return "Redouble";
    return bidLabel(entry.bid);
}
