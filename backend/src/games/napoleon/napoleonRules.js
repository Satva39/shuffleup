/*
 * ShuffleUp Napoleon ruleset decision:
 *
 * No project-specific Napoleon manual was present in the supplied project.
 * This module therefore implements a five-player Japanese Napoleon configuration:
 * - 5 players
 * - standard 52-card deck
 * - 10 cards per player + 2-card blind
 * - bids from 11 to 20 points, with suit used to break equal bids
 * - Napoleon names a hidden adjutant by calling a card
 * - caller takes the blind and discards two cards
 * - first trick uses normal rank with no trump/special-card powers
 * - from trick two, Mighty (A♠), trump Jack, sub-Jack, and Same Two apply
 * - A/K/Q/J/10 are scoring cards (20 points total)
 * - session length is 8 rounds, because the existing project specification
 *   requires a finite game result but did not define a round target
 *
 * All score values are in-game points only. No real-money wagering,
 * deposits, payouts, or gambling mechanics are implemented.
 */
const SUITS = ["clubs", "diamonds", "hearts", "spades"];

const RANKS = [
    "A", "K", "Q", "J", "10", "9", "8", "7",
    "6", "5", "4", "3", "2",
];

const RANK_VALUES = {
    A: 14, K: 13, Q: 12, J: 11, 10: 10, 9: 9, 8: 8,
    7: 7, 6: 6, 5: 5, 4: 4, 3: 3, 2: 2,
};

const SUIT_VALUES = {
    clubs: 0,
    diamonds: 1,
    hearts: 2,
    spades: 3,
};

const SUIT_NAMES = {
    clubs: { symbol: "♣", name: "Clubs", color: "black" },
    diamonds: { symbol: "♦", name: "Diamonds", color: "red" },
    hearts: { symbol: "♥", name: "Hearts", color: "red" },
    spades: { symbol: "♠", name: "Spades", color: "black" },
};

const PLAYER_COUNT = 5;
const CARDS_PER_PLAYER = 10;
const BLIND_SIZE = 2;
const MIN_BID = 11;
const MAX_BID = 20;
const TOTAL_ROUNDS = 8;
const SCORE_CARD_RANKS = new Set(["A", "K", "Q", "J", "10"]);

function createCard(suit, rank) {
    return {
        id: `${suit}-${rank}`,
        suit,
        rank,
        pointValue: SCORE_CARD_RANKS.has(rank) ? 1 : 0,
    };
}

function isValidBid(bid, highestBid) {
    if (!bid || !Number.isInteger(bid.amount)) return false;
    if (!SUITS.includes(bid.suit)) return false;
    if (bid.amount < MIN_BID || bid.amount > MAX_BID) return false;

    if (!highestBid) return true;

    if (bid.amount > highestBid.amount) return true;
    return (
        bid.amount === highestBid.amount &&
        SUIT_VALUES[bid.suit] > SUIT_VALUES[highestBid.suit]
    );
}

function getBidLabel(bid) {
    if (!bid) return null;
    return `${bid.amount} ${SUIT_NAMES[bid.suit].symbol}`;
}

function getColorSuit(suit) {
    return suit === "hearts" || suit === "diamonds"
        ? "red"
        : "black";
}

function isMighty(card) {
    return card.suit === "spades" && card.rank === "A";
}

function isTrumpJack(card, trumpSuit) {
    return card.rank === "J" && card.suit === trumpSuit;
}

function isSubJack(card, trumpSuit) {
    return (
        card.rank === "J" &&
        getColorSuit(card.suit) === getColorSuit(trumpSuit) &&
        card.suit !== trumpSuit
    );
}

function getSpecialRank(card, trumpSuit) {
    if (isMighty(card)) return 3;
    if (isTrumpJack(card, trumpSuit)) return 2;
    if (isSubJack(card, trumpSuit)) return 1;
    return 0;
}

function isScoringCard(card) {
    return SCORE_CARD_RANKS.has(card.rank);
}

function hasSuit(cards, suit) {
    return cards.some((card) => card.suit === suit);
}

function getEffectiveRank(card, trumpSuit, specialEnabled, sameTwoEnabled) {
    if (!specialEnabled) {
        return RANK_VALUES[card.rank];
    }

    const special = getSpecialRank(card, trumpSuit);
    if (special) return 100 + special;

    if (
        sameTwoEnabled &&
        card.rank === "2"
    ) {
        return 98;
    }

    return RANK_VALUES[card.rank];
}

function cardBeats(
    challenger,
    winner,
    leadSuit,
    trumpSuit,
    specialEnabled,
    sameTwoEnabled,
    allSameSuit
) {
    const challengerSpecial =
        specialEnabled
            ? getSpecialRank(challenger, trumpSuit)
            : 0;
    const winnerSpecial =
        specialEnabled
            ? getSpecialRank(winner, trumpSuit)
            : 0;

    if (challengerSpecial !== winnerSpecial) {
        return challengerSpecial > winnerSpecial;
    }

    if (
        specialEnabled &&
        sameTwoEnabled &&
        allSameSuit &&
        challenger.rank === "2" &&
        winner.rank !== "2" &&
        winnerSpecial === 0
    ) {
        return true;
    }

    if (
        specialEnabled &&
        sameTwoEnabled &&
        allSameSuit &&
        winner.rank === "2" &&
        challenger.rank !== "2" &&
        challengerSpecial === 0
    ) {
        return false;
    }

    const challengerTrump =
        specialEnabled && challenger.suit === trumpSuit;
    const winnerTrump =
        specialEnabled && winner.suit === trumpSuit;

    if (challengerTrump !== winnerTrump) {
        return challengerTrump;
    }

    const challengerLead = challenger.suit === leadSuit;
    const winnerLead = winner.suit === leadSuit;

    if (challengerLead !== winnerLead) {
        return challengerLead;
    }

    return (
        getEffectiveRank(
            challenger,
            trumpSuit,
            specialEnabled,
            sameTwoEnabled
        ) >
        getEffectiveRank(
            winner,
            trumpSuit,
            specialEnabled,
            sameTwoEnabled
        )
    );
}

function determineTrickWinner(trick, trumpSuit, trickNumber) {
    if (!trick.length) return null;

    const leadSuit = trick[0].card.suit;
    const specialEnabled = trickNumber > 1;
    const allSameSuit = trick.every(
        (play) => play.card.suit === leadSuit
    );
    const sameTwoEnabled =
        specialEnabled &&
        allSameSuit &&
        !trick.some(
            (play) =>
                getSpecialRank(play.card, trumpSuit) > 0
        );

    let winner = trick[0];

    for (let i = 1; i < trick.length; i += 1) {
        const challenger = trick[i];

        if (
            cardBeats(
                challenger.card,
                winner.card,
                leadSuit,
                trumpSuit,
                specialEnabled,
                sameTwoEnabled,
                allSameSuit
            )
        ) {
            winner = challenger;
        }
    }

    return winner.playerId;
}

function canPlayCard(playerCards, cardId, currentTrick, trumpSuit, trickNumber) {
    const card = playerCards.find(
        (item) => item.id === cardId
    );

    if (!card) {
        return {
            valid: false,
            reason: "You do not have that card.",
        };
    }

    if (!currentTrick.length) {
        return { valid: true, card };
    }

    const leadSuit = currentTrick[0].card.suit;

    if (
        card.suit !== leadSuit &&
        hasSuit(playerCards, leadSuit)
    ) {
        return {
            valid: false,
            reason: "You must follow the leading suit.",
        };
    }

    // The Japanese rules used here keep the Mighty,
    // trump jack, and sub-jack in their printed suits.
    // Special ranking changes after the first trick;
    // suit-following does not.
    void trumpSuit;
    void trickNumber;

    return { valid: true, card };
}

function calculateTeamResult(teamPoints, bidAmount) {
    if (bidAmount < MAX_BID) {
        return {
            success:
                teamPoints >= bidAmount &&
                teamPoints < 20,
            target: bidAmount,
        };
    }

    return {
        success: teamPoints === 20,
        target: 20,
    };
}

function calculateScoreDeltas({
    success,
    bidAmount,
    napoleonId,
    partnerId,
    players,
}) {
    const multiplier = bidAmount === MAX_BID ? 2 : 1;
    const deltas = Object.fromEntries(
        players.map((player) => [player.id, 0])
    );

    if (partnerId) {
        const opponentIds = players
            .filter(
                (player) =>
                    player.id !== napoleonId &&
                    player.id !== partnerId
            )
            .map((player) => player.id);

        if (success) {
            deltas[napoleonId] = 2 * multiplier;
            deltas[partnerId] = 1 * multiplier;
            opponentIds.forEach((id) => {
                deltas[id] = -1 * multiplier;
            });
        } else {
            deltas[napoleonId] = -2 * multiplier;
            deltas[partnerId] = -1 * multiplier;
            opponentIds.forEach((id) => {
                deltas[id] = 1 * multiplier;
            });
        }

        return deltas;
    }

    const opponentIds = players
        .filter((player) => player.id !== napoleonId)
        .map((player) => player.id);

    const napoleonDelta = 4 * multiplier;

    if (success) {
        deltas[napoleonId] = napoleonDelta;
        opponentIds.forEach((id) => {
            deltas[id] = -1 * multiplier;
        });
    } else {
        deltas[napoleonId] = -napoleonDelta;
        opponentIds.forEach((id) => {
            deltas[id] = 1 * multiplier;
        });
    }

    return deltas;
}

function describeSpecial(card, trumpSuit) {
    if (isMighty(card)) return "Mighty";
    if (isTrumpJack(card, trumpSuit)) return "Trump Jack";
    if (isSubJack(card, trumpSuit)) return "Sub-Jack";
    return null;
}

export {
    SUITS,
    RANKS,
    RANK_VALUES,
    SUIT_VALUES,
    SUIT_NAMES,
    PLAYER_COUNT,
    CARDS_PER_PLAYER,
    BLIND_SIZE,
    MIN_BID,
    MAX_BID,
    TOTAL_ROUNDS,
    SCORE_CARD_RANKS,
    createCard,
    isValidBid,
    getBidLabel,
    getColorSuit,
    isMighty,
    isTrumpJack,
    isSubJack,
    getSpecialRank,
    isScoringCard,
    hasSuit,
    cardBeats,
    determineTrickWinner,
    canPlayCard,
    calculateTeamResult,
    calculateScoreDeltas,
    describeSpecial,
};
