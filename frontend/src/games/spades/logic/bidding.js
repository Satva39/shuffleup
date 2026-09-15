export const BID_OPTIONS = Array.from({ length: 14 }, (_, index) => index);

export function bidLabel(bid) {
    if (bid === null || bid === undefined) return "—";
    return bid === 0 ? "Nil" : String(bid);
}
