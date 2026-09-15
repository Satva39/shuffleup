export const SUITS = ["C", "D", "H", "S"];
export const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
export const RANK_VALUE = Object.fromEntries(RANKS.map((rank, index) => [rank, index + 2]));
export const SEATS = ["N", "E", "S", "W"];
export const NEXT_SEAT = { N: "E", E: "S", S: "W", W: "N" };
export const PARTNERSHIP = { N: "A", S: "A", E: "B", W: "B" };
export const TEAM_SEATS = { A: ["N", "S"], B: ["E", "W"] };
export const SEAT_LABEL = { N: "North", E: "East", S: "South", W: "West" };
export const TEAM_LABEL = { A: "Team A", B: "Team B" };

export const TRUMP_MODE = "closed-trump";
export const TARGET_SCORE = 5;

export function isKeyCard(card) {
    return card?.rank === "10";
}

export function legalCardsForHand(hand, trick) {
    if (!Array.isArray(hand)) return [];
    if (!Array.isArray(trick) || trick.length === 0) {
        return hand.map((card) => card.id);
    }
    const ledSuit = trick[0].card.suit;
    const ledCards = hand.filter((card) => card.suit === ledSuit);
    return (ledCards.length > 0 ? ledCards : hand).map((card) => card.id);
}

export function validateCardPlay(hand, card, trick) {
    if (!card) return { ok: false, message: "Card not found." };
    if (!Array.isArray(hand) || !hand.some((item) => item.id === card.id)) {
        return { ok: false, message: "You do not own that card." };
    }
    if (!Array.isArray(trick) || trick.length === 0) return { ok: true };

    const ledSuit = trick[0].card.suit;
    const canFollow = hand.some((item) => item.suit === ledSuit);
    if (canFollow && card.suit !== ledSuit) {
        return { ok: false, message: `You must follow ${ledSuit}.` };
    }
    return { ok: true };
}

export function compareCardsForTrick(a, b, ledSuit, trumpSuit) {
    const aTrump = trumpSuit && a.suit === trumpSuit;
    const bTrump = trumpSuit && b.suit === trumpSuit;
    if (aTrump !== bTrump) return aTrump ? 1 : -1;

    const aLed = a.suit === ledSuit;
    const bLed = b.suit === ledSuit;
    if (aLed !== bLed) return aLed ? 1 : -1;
    if (!aLed && !aTrump) return 0;
    return RANK_VALUE[a.rank] - RANK_VALUE[b.rank];
}

export function resolveTrick(trick, trumpSuit) {
    if (!Array.isArray(trick) || trick.length !== 4) {
        throw new Error("A Mindi Coat trick must contain four cards.");
    }
    const ledSuit = trick[0].card.suit;
    let winner = trick[0];
    for (let index = 1; index < trick.length; index += 1) {
        if (compareCardsForTrick(trick[index].card, winner.card, ledSuit, trumpSuit) > 0) {
            winner = trick[index];
        }
    }
    return winner;
}

export function getTeamTens(players, team) {
    return players
        .filter((player) => player.team === team)
        .reduce((count, player) => count + player.tensCaptured, 0);
}

export function determineHandWinner({ tensA, tensB, tricksA, tricksB }) {
    if (tensA > tensB) return "A";
    if (tensB > tensA) return "B";
    if (tricksA > tricksB) return "A";
    if (tricksB > tricksA) return "B";
    return null;
}

export function calculateHandResult({ tensA, tensB, tricksA, tricksB }) {
    const winnerTeam = determineHandWinner({ tensA, tensB, tricksA, tricksB });
    if (!winnerTeam) {
        return {
            winnerTeam: null,
            coat: false,
            whitewash: false,
            score: 0,
            reason: "perfect-tie",
        };
    }

    const winningTens = winnerTeam === "A" ? tensA : tensB;
    const losingTens = winnerTeam === "A" ? tensB : tensA;
    const coat = winningTens === 4;
    const whitewash = (winnerTeam === "A" ? tricksA : tricksB) === 13;

    return {
        winnerTeam,
        coat,
        whitewash,
        score: coat ? 2 : 1,
        reason: winningTens > losingTens ? "tens-majority" : "tricks-tie-break",
    };
}
