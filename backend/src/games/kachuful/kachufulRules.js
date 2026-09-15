const SUITS = ["spades", "diamonds", "clubs", "hearts"];

const RANKS = [
    "A",
    "K",
    "Q",
    "J",
    "10",
    "9",
    "8",
    "7",
    "6",
    "5",
    "4",
    "3",
    "2",
];

const RANK_VALUES = {
    A: 14,
    K: 13,
    Q: 12,
    J: 11,
    10: 10,
    9: 9,
    8: 8,
    7: 7,
    6: 6,
    5: 5,
    4: 4,
    3: 3,
    2: 2,
};

const TRUMP_NAMES = {
    spades: {
        kachuful: "Kaari",
        symbol: "♠",
        english: "Spades",
    },
    diamonds: {
        kachuful: "Chukat",
        symbol: "♦",
        english: "Diamonds",
    },
    clubs: {
        kachuful: "Falli",
        symbol: "♣",
        english: "Clubs",
    },
    hearts: {
        kachuful: "Laal",
        symbol: "♥",
        english: "Hearts",
    },
};

function getTotalRounds(playerCount) {
    let cards = 0;
    let rounds = 0;

    while (cards + playerCount <= 52) {
        rounds += 1;
        cards += playerCount;
    }

    return rounds;
}

function getTrumpSuit(round) {
    return SUITS[(round - 1) % SUITS.length];
}

function getTrumpInfo(round) {
    const suit = getTrumpSuit(round);

    return {
        suit,
        ...TRUMP_NAMES[suit],
    };
}

function isValidBid(bid, cardsPerPlayer) {
    return (
        Number.isInteger(bid) &&
        bid >= 0 &&
        bid <= cardsPerPlayer
    );
}

function hasSuit(cards, suit) {
    return cards.some((card) => card.suit === suit);
}

function isCardInHand(cards, cardId) {
    return cards.some((card) => card.id === cardId);
}

function canPlayCard(playerCards, cardId, currentTrick) {
    const card = playerCards.find(
        (item) => item.id === cardId
    );

    if (!card) {
        return {
            valid: false,
            reason: "You do not have that card.",
        };
    }

    if (currentTrick.length === 0) {
        return {
            valid: true,
            card,
        };
    }

    const leadingSuit = currentTrick[0].card.suit;

    if (
        card.suit !== leadingSuit &&
        hasSuit(playerCards, leadingSuit)
    ) {
        return {
            valid: false,
            reason: "You must follow the leading suit.",
        };
    }

    return {
        valid: true,
        card,
    };
}

function determineTrickWinner(trick, trumpSuit) {
    if (!trick.length) {
        return null;
    }

    const leadingSuit = trick[0].card.suit;

    let winner = trick[0];

    for (let i = 1; i < trick.length; i += 1) {
        const challenger = trick[i];

        const winnerIsTrump =
            winner.card.suit === trumpSuit;

        const challengerIsTrump =
            challenger.card.suit === trumpSuit;

        if (challengerIsTrump && !winnerIsTrump) {
            winner = challenger;
            continue;
        }

        if (challengerIsTrump && winnerIsTrump) {
            if (
                RANK_VALUES[challenger.card.rank] >
                RANK_VALUES[winner.card.rank]
            ) {
                winner = challenger;
            }

            continue;
        }

        if (
            !winnerIsTrump &&
            challenger.card.suit === leadingSuit &&
            winner.card.suit !== leadingSuit
        ) {
            winner = challenger;
            continue;
        }

        if (
            !winnerIsTrump &&
            challenger.card.suit === leadingSuit &&
            winner.card.suit === leadingSuit &&
            RANK_VALUES[challenger.card.rank] >
            RANK_VALUES[winner.card.rank]
        ) {
            winner = challenger;
        }
    }

    return winner.playerId;
}

function calculateRoundScore(bid, tricksWon) {
    if (bid === tricksWon) {
        return 10 + bid;
    }

    return 0;
}

export {
    SUITS,
    RANKS,
    RANK_VALUES,
    TRUMP_NAMES,
    getTotalRounds,
    getTrumpSuit,
    getTrumpInfo,
    isValidBid,
    isCardInHand,
    canPlayCard,
    determineTrickWinner,
    calculateRoundScore,
};