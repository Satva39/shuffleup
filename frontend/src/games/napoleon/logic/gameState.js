export function getPhaseTitle(phase) {
    const titles = {
        dealing: "DEALING CARDS",
        bidding: "BIDDING",
        contract: "CONTRACT",
        blind: "BLIND & DISCARD",
        playing: "PLAYING TRICKS",
        "round-complete": "ROUND COMPLETE",
        "game-complete": "GAME COMPLETE",
    };

    return titles[phase] || "NAPOLEON";
}

export function getPlayerName(players, playerId, fallback = "Player") {
    return (
        players?.find((player) => player.id === playerId)?.username ||
        fallback
    );
}

export function isYourTurn(gameState, userId) {
    return gameState?.currentPlayerId === userId;
}

export function legalHandCards(gameState, cards, userId) {
    if (!gameState || gameState.phase !== "playing") {
        return new Set();
    }

    if (gameState.currentPlayerId !== userId) {
        return new Set();
    }

    if (!gameState.currentTrick?.length) {
        return new Set(cards.map((card) => card.id));
    }

    const leadSuit = gameState.currentTrick[0]?.card?.suit;
    const hasLeadSuit = cards.some(
        (card) => card.suit === leadSuit
    );

    if (!hasLeadSuit) {
        return new Set(cards.map((card) => card.id));
    }

    return new Set(
        cards
            .filter((card) => card.suit === leadSuit)
            .map((card) => card.id)
    );
}
