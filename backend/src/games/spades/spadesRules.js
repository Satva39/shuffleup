export const SUITS = ["C", "D", "H", "S"];
export const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
export const RANK_VALUE = Object.fromEntries(RANKS.map((rank, index) => [rank, index + 2]));
export const SEATS = ["N", "E", "S", "W"];
export const NEXT_SEAT = { N: "E", E: "S", S: "W", W: "N" };
export const PREV_SEAT = { N: "W", E: "N", S: "E", W: "S" };
export const PARTNERSHIP = { N: "A", S: "A", E: "B", W: "B" };
export const TEAM_SEATS = { A: ["N", "S"], B: ["E", "W"] };
export const SEAT_LABEL = { N: "North", E: "East", S: "South", W: "West" };
export const TEAM_LABEL = { A: "Team A", B: "Team B" };

export function isValidBid(bid) {
    return Number.isInteger(bid) && bid >= 0 && bid <= 13;
}

export function bidLabel(bid) {
    if (bid === null || bid === undefined) return "—";
    return bid === 0 ? "Nil" : String(bid);
}

export function hasSuit(hand, suit) {
    return hand.some((card) => card.suit === suit);
}

export function legalCardsForHand(hand, trick, spadesBroken) {
    if (!Array.isArray(hand)) return [];
    if (!Array.isArray(trick) || trick.length === 0) {
        const nonSpades = hand.filter((card) => card.suit !== "S");
        if (!spadesBroken && nonSpades.length > 0) {
            return nonSpades.map((card) => card.id);
        }
        return hand.map((card) => card.id);
    }

    const ledSuit = trick[0].card.suit;
    const ledCards = hand.filter((card) => card.suit === ledSuit);
    if (ledCards.length > 0) return ledCards.map((card) => card.id);
    return hand.map((card) => card.id);
}

export function validateCardPlay(hand, card, trick, spadesBroken) {
    if (!card) return { ok: false, message: "Card not found." };
    if (!Array.isArray(hand) || !hand.some((item) => item.id === card.id)) {
        return { ok: false, message: "You do not own that card." };
    }

    if (!Array.isArray(trick) || trick.length === 0) {
        if (card.suit === "S" && !spadesBroken && hand.some((item) => item.suit !== "S")) {
            return {
                ok: false,
                message: "Spades cannot be led until they are broken unless you only have spades.",
            };
        }
        return { ok: true };
    }

    const ledSuit = trick[0].card.suit;
    const canFollow = hand.some((item) => item.suit === ledSuit);
    if (canFollow && card.suit !== ledSuit) {
        return { ok: false, message: `You must follow ${ledSuit}.` };
    }
    return { ok: true };
}

export function compareCardsForTrick(a, b, ledSuit) {
    const aTrump = a.suit === "S";
    const bTrump = b.suit === "S";
    if (aTrump !== bTrump) return aTrump ? 1 : -1;

    const aLed = a.suit === ledSuit;
    const bLed = b.suit === ledSuit;
    if (aLed !== bLed) return aLed ? 1 : -1;
    if (!aLed && !aTrump) return 0;
    return RANK_VALUE[a.rank] - RANK_VALUE[b.rank];
}

export function resolveTrick(trick) {
    if (!Array.isArray(trick) || trick.length !== 4) {
        throw new Error("A Spades trick must contain four cards.");
    }
    const ledSuit = trick[0].card.suit;
    let winner = trick[0];
    for (let index = 1; index < trick.length; index += 1) {
        if (compareCardsForTrick(trick[index].card, winner.card, ledSuit) > 0) {
            winner = trick[index];
        }
    }
    return winner;
}

export function calculateTeamHandScore({ bidTotal, tricksTaken, nilPlayers = [] }) {
    const nilScore = nilPlayers.reduce((sum, nil) => sum + (nil.tricksTaken === 0 ? 100 : -100), 0);
    if (bidTotal === 0) {
        return { contractScore: 0, bags: 0, bagPenalty: 0, total: nilScore, nilScore };
    }

    const successful = tricksTaken >= bidTotal;
    const rawContract = successful ? bidTotal * 10 : -(bidTotal * 10);
    const rawBags = successful ? Math.max(0, tricksTaken - bidTotal) : 0;
    return {
        contractScore: rawContract,
        bags: rawBags,
        bagPenalty: 0,
        total: rawContract + rawBags + nilScore,
        nilScore,
    };
}

export function applyBags(previousBags, newBags) {
    const total = previousBags + newBags;
    const penalty = Math.floor(total / 10) * 100;
    const remaining = total % 10;
    return { remainingBags: remaining, penalty };
}

export function calculateTeamRoundScore({ previousBags, bidTotal, tricksTaken, nilPlayers }) {
    const base = calculateTeamHandScore({ bidTotal, tricksTaken, nilPlayers });
    const applied = applyBags(previousBags, base.bags);
    return {
        bidTotal,
        tricksTaken,
        contractScore: base.contractScore,
        nilScore: base.nilScore,
        newBags: base.bags,
        bags: applied.remainingBags,
        bagPenalty: applied.penalty,
        total: base.total - applied.penalty,
    };
}

export function gameWinner(scoreA, scoreB, target = 500) {
    const aReached = scoreA >= target;
    const bReached = scoreB >= target;
    if (!aReached && !bReached) return null;
    if (aReached && bReached) {
        if (scoreA === scoreB) return null;
        return scoreA > scoreB ? "A" : "B";
    }
    return aReached ? "A" : "B";
}
