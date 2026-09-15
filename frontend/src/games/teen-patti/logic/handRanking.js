import { RANK_VALUES } from "./cards";

export const HAND_RANKS = {
    HIGH_CARD: 1,
    PAIR: 2,
    COLOR: 3,
    SEQUENCE: 4,
    PURE_SEQUENCE: 5,
    TRAIL: 6,
};

export const HAND_NAMES = {
    [HAND_RANKS.HIGH_CARD]: "High Card",
    [HAND_RANKS.PAIR]: "Pair",
    [HAND_RANKS.COLOR]: "Color",
    [HAND_RANKS.SEQUENCE]: "Sequence",
    [HAND_RANKS.PURE_SEQUENCE]: "Pure Sequence",
    [HAND_RANKS.TRAIL]: "Trail",
};

function sortedValues(cards) {
    return cards
        .map((card) => RANK_VALUES[card.rank])
        .sort((a, b) => b - a);
}

function getSequenceValues(cards) {
    const values = sortedValues(cards);

    const unique = [...new Set(values)];

    if (unique.length !== 3) {
        return null;
    }

    // A-2-3 is the lowest sequence.
    if (
        unique.includes(14) &&
        unique.includes(2) &&
        unique.includes(3)
    ) {
        return [3, 2, 1];
    }

    if (
        unique[0] - unique[1] === 1 &&
        unique[1] - unique[2] === 1
    ) {
        return unique;
    }

    return null;
}

export function evaluateHand(cards) {
    if (!Array.isArray(cards) || cards.length !== 3) {
        throw new Error("A Teen Patti hand must contain exactly 3 cards.");
    }

    const values = sortedValues(cards);

    const counts = {};

    for (const value of values) {
        counts[value] = (counts[value] || 0) + 1;
    }

    const sameSuit =
        cards.every((card) => card.suit === cards[0].suit);

    const sequenceValues = getSequenceValues(cards);

    // Trail / Three of a kind
    if (Object.values(counts).includes(3)) {
        const trailValue = values[0];

        return {
            rank: HAND_RANKS.TRAIL,
            name: HAND_NAMES[HAND_RANKS.TRAIL],
            tiebreak: [trailValue],
        };
    }

    // Pure Sequence
    if (sameSuit && sequenceValues) {
        return {
            rank: HAND_RANKS.PURE_SEQUENCE,
            name: HAND_NAMES[HAND_RANKS.PURE_SEQUENCE],
            tiebreak: sequenceValues,
        };
    }

    // Sequence / Run
    if (sequenceValues) {
        return {
            rank: HAND_RANKS.SEQUENCE,
            name: HAND_NAMES[HAND_RANKS.SEQUENCE],
            tiebreak: sequenceValues,
        };
    }

    // Color
    if (sameSuit) {
        return {
            rank: HAND_RANKS.COLOR,
            name: HAND_NAMES[HAND_RANKS.COLOR],
            tiebreak: values,
        };
    }

    // Pair
    const pairValue = Object.keys(counts).find(
        (value) => counts[value] === 2
    );

    if (pairValue) {
        const kicker = values.find(
            (value) => value !== Number(pairValue)
        );

        return {
            rank: HAND_RANKS.PAIR,
            name: HAND_NAMES[HAND_RANKS.PAIR],
            tiebreak: [
                Number(pairValue),
                kicker,
            ],
        };
    }

    // High Card
    return {
        rank: HAND_RANKS.HIGH_CARD,
        name: HAND_NAMES[HAND_RANKS.HIGH_CARD],
        tiebreak: values,
    };
}

export function compareHands(handA, handB) {
    const evaluatedA = evaluateHand(handA);
    const evaluatedB = evaluateHand(handB);

    if (evaluatedA.rank !== evaluatedB.rank) {
        return evaluatedA.rank > evaluatedB.rank ? 1 : -1;
    }

    const length = Math.max(
        evaluatedA.tiebreak.length,
        evaluatedB.tiebreak.length
    );

    for (let i = 0; i < length; i += 1) {
        const a = evaluatedA.tiebreak[i] || 0;
        const b = evaluatedB.tiebreak[i] || 0;

        if (a !== b) {
            return a > b ? 1 : -1;
        }
    }

    return 0;
}

export function determineWinner(players) {
    const activePlayers = players.filter(
        (player) => player.status === "active"
    );

    if (activePlayers.length === 0) {
        return null;
    }

    let winner = activePlayers[0];

    for (let i = 1; i < activePlayers.length; i += 1) {
        const comparison = compareHands(
            activePlayers[i].cards,
            winner.cards
        );

        if (comparison > 0) {
            winner = activePlayers[i];
        }
    }

    return winner;
}