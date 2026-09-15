export const GAME_ID = "twenty-nine";
export const SEATS = ["N", "E", "S", "W"];
export const NEXT_SEAT = { N: "E", E: "S", S: "W", W: "N" };
export const PREV_SEAT = { N: "W", E: "N", S: "E", W: "S" };
export const PARTNERSHIP = { N: "A", S: "A", E: "B", W: "B" };
export const TEAM_SEATS = { A: ["N", "S"], B: ["E", "W"] };
export const TEAM_LABEL = { A: "Team A", B: "Team B" };
export const SEAT_LABEL = { N: "North", E: "East", S: "South", W: "West" };
export const SUITS = ["S", "H", "D", "C"];
export const SUIT_SYMBOL = { S: "♠", H: "♥", D: "♦", C: "♣" };
export const SUIT_LABEL = { S: "Spades", H: "Hearts", D: "Diamonds", C: "Clubs" };
export const RANKS = ["J", "9", "A", "10", "K", "Q", "8", "7"];
export const RANK_VALUE = Object.fromEntries(RANKS.map((rank, index) => [rank, RANKS.length - index]));
export const CARD_POINTS = { J: 3, 9: 2, A: 1, 10: 1, K: 0, Q: 0, 8: 0, 7: 0 };
export const MIN_BID = 16;
export const MAX_BID = 28;
export const INITIAL_CARDS = 4;
export const HAND_SIZE = 8;
export const TRICKS_PER_HAND = 8;
export const TARGET_SCORE = 6;
export const LAST_TRICK_BONUS = 1;

export function isValidSuit(suit) {
    return SUITS.includes(suit);
}

export function cardPoints(card) {
    return CARD_POINTS[card?.rank] ?? 0;
}

export function compareCards(a, b) {
    return (RANK_VALUE[a.rank] ?? -1) - (RANK_VALUE[b.rank] ?? -1);
}

export function isValidBid(bid, currentHighest = null, isOpening = false) {
    if (bid === null || bid === undefined) return false;
    if (!Number.isInteger(bid)) return false;
    if (bid < MIN_BID || bid > MAX_BID) return false;
    const minimum = currentHighest == null ? MIN_BID : currentHighest + 1;
    return isOpening ? bid >= MIN_BID : bid >= minimum;
}

export function legalBids(currentHighest = null) {
    const minimum = currentHighest == null ? MIN_BID : currentHighest + 1;
    return Array.from({ length: Math.max(0, MAX_BID - minimum + 1) }, (_, index) => minimum + index);
}

export function hasSuit(hand, suit) {
    return hand.some((card) => card.suit === suit);
}

export function legalCardsForHand(hand, trick) {
    if (!Array.isArray(hand) || hand.length === 0) return [];
    if (!Array.isArray(trick) || trick.length === 0) return hand.map((card) => card.id);
    const ledSuit = trick[0].card.suit;
    if (!hasSuit(hand, ledSuit)) return hand.map((card) => card.id);
    return hand.filter((card) => card.suit === ledSuit).map((card) => card.id);
}

export function validateCardPlay(hand, card, trick) {
    if (!card) return { ok: false, message: "Card was not found." };
    if (!Array.isArray(hand) || !hand.some((item) => item.id === card.id)) {
        return { ok: false, message: "You do not own that card." };
    }
    const legal = legalCardsForHand(hand, trick);
    if (!legal.includes(card.id)) {
        return { ok: false, message: "You must follow the led suit." };
    }
    return { ok: true };
}

function effectiveCategory(play, ledSuit, trumpSuit, trumpRevealed) {
    if (trumpRevealed && play.card.suit === trumpSuit) return 2;
    if (play.card.suit === ledSuit) return 1;
    return 0;
}

export function resolveTrick(plays, trumpSuit, trumpRevealed) {
    if (!Array.isArray(plays) || plays.length !== 4) throw new Error("A completed trick requires four cards.");
    const ledSuit = plays[0].card.suit;
    let winner = plays[0];
    for (let index = 1; index < plays.length; index += 1) {
        const candidate = plays[index];
        const winnerCategory = effectiveCategory(winner, ledSuit, trumpSuit, trumpRevealed);
        const candidateCategory = effectiveCategory(candidate, ledSuit, trumpSuit, trumpRevealed);
        if (candidateCategory > winnerCategory ||
            (candidateCategory === winnerCategory && compareCards(candidate.card, winner.card) > 0)) {
            winner = candidate;
        }
    }
    return winner;
}

export function calculateTeamCardPoints(completedTricks, playerById) {
    const points = { A: 0, B: 0 };
    for (let trickIndex = 0; trickIndex < completedTricks.length; trickIndex += 1) {
        const trick = completedTricks[trickIndex];
        const winner = playerById[trick.winnerPlayerId];
        if (!winner) continue;
        const team = winner.team;
        points[team] += trick.plays.reduce((sum, play) => sum + cardPoints(play.card), 0);
        if (trickIndex === completedTricks.length - 1) points[team] += LAST_TRICK_BONUS;
    }
    return points;
}

export function contractResult(bidTeam, bid, teamCardPoints) {
    const made = teamCardPoints[bidTeam] >= bid;
    return {
        team: bidTeam,
        bid,
        points: teamCardPoints[bidTeam],
        made,
        delta: made ? 1 : -1,
    };
}

export function determineGameWinner(scores, targetScore = TARGET_SCORE) {
    const a = scores.A;
    const b = scores.B;
    if (a < targetScore && b < targetScore) return null;
    if (a === b) return null;
    return a > b ? "A" : "B";
}
