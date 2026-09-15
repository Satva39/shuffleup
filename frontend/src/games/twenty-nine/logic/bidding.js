export const MIN_BID = 16;
export const MAX_BID = 28;

export function legalBids(highestBid = null) {
    const min = highestBid == null ? MIN_BID : highestBid + 1;
    return Array.from({ length: Math.max(0, MAX_BID - min + 1) }, (_, index) => min + index);
}
