export const SUITS = ["C", "D", "H", "S"];
export const STRAINS = ["C", "D", "H", "S", "NT"];
export const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
export const SUIT_ORDER = { C: 0, D: 1, H: 2, S: 3, NT: 4 };
export const RANK_VALUE = Object.fromEntries(RANKS.map((rank, index) => [rank, index + 2]));

export const SEATS = ["N", "E", "S", "W"];
export const PARTNERSHIP = { N: "NS", S: "NS", E: "EW", W: "EW" };
export const NEXT_SEAT = { N: "E", E: "S", S: "W", W: "N" };
export const PREV_SEAT = { N: "W", W: "S", S: "E", E: "N" };

export function makeBid(level, strain) {
    return { level, strain };
}

export function compareBids(a, b) {
    if (!a || !b) return 0;
    const av = a.level * 5 + SUIT_ORDER[a.strain];
    const bv = b.level * 5 + SUIT_ORDER[b.strain];
    return av - bv;
}

export function isBidHigher(candidate, highestBid) {
    if (!highestBid) return true;
    return compareBids(candidate, highestBid) > 0;
}

export function partnershipOf(seat) {
    return PARTNERSHIP[seat];
}

export function isVulnerable(dealNumber, partnership) {
    const cycle = [
        "NONE", "NS", "EW", "BOTH",
        "NS", "EW", "BOTH", "NONE",
        "EW", "BOTH", "NONE", "NS",
        "BOTH", "NONE", "NS", "EW",
    ];
    const state = cycle[(Math.max(1, dealNumber) - 1) % 16];
    return state === "BOTH" || state === partnership;
}

export function vulnerabilityLabel(dealNumber) {
    const cycle = [
        "None", "NS", "EW", "Both",
        "NS", "EW", "Both", "None",
        "EW", "Both", "None", "NS",
        "Both", "None", "NS", "EW",
    ];
    return cycle[(Math.max(1, dealNumber) - 1) % 16];
}

export function contractPointsPerTrick(strain) {
    if (strain === "C" || strain === "D") return 20;
    return 30;
}

export function calculateContractScore({
    level,
    strain,
    doubled = 0,
    madeTricks,
    vulnerable = false,
}) {
    const target = level + 6;
    const diff = madeTricks - target;

    if (diff < 0) {
        const under = Math.abs(diff);
        const multiplier = doubled === 2 ? 2 : doubled === 1 ? 1 : 1;
        if (doubled === 0) return -(under * (vulnerable ? 100 : 50));

        let penalty = 0;
        for (let i = 1; i <= under; i += 1) {
            if (doubled === 1) {
                if (vulnerable) penalty += i === 1 ? 200 : 300;
                else penalty += i === 1 ? 100 : i <= 3 ? 200 : 300;
            } else {
                if (vulnerable) penalty += i === 1 ? 400 : 600;
                else penalty += i === 1 ? 200 : i <= 3 ? 400 : 600;
            }
        }
        return -penalty * multiplier;
    }

    let contractTrickScore;
    if (strain === "NT") {
        contractTrickScore = 40 + (level - 1) * 30;
    } else {
        contractTrickScore = level * contractPointsPerTrick(strain);
    }
    if (doubled === 1) contractTrickScore *= 2;
    if (doubled === 2) contractTrickScore *= 4;

    let score = contractTrickScore;
    score += contractTrickScore >= 100 ? (vulnerable ? 500 : 300) : 50;

    if (level === 6) score += vulnerable ? 750 : 500;
    if (level === 7) score += vulnerable ? 1500 : 1000;

    if (diff > 0) {
        const per = doubled === 0
            ? contractPointsPerTrick(strain === "NT" ? "S" : strain)
            : doubled === 1
                ? (vulnerable ? 200 : 100)
                : (vulnerable ? 400 : 200);
        score += diff * per;
    }

    return score;
}

export function contractLabel(contract) {
    if (!contract) return "Passed Out";
    const strain = contract.strain === "NT" ? "NT" : contract.strain;
    const modifier = contract.doubled === 2 ? "XX" : contract.doubled === 1 ? "X" : "";
    return `${contract.level}${strain}${modifier}`;
}
