function TurnIndicator({
    isMyTurn,
    currentPlayer,
}) {
    if (isMyTurn) {
        return (
            <div className="teen-turn-indicator teen-my-turn">
                YOUR TURN
            </div>
        );
    }

    if (!currentPlayer) {
        return null;
    }

    return (
        <div className="teen-turn-indicator">
            WAITING FOR{" "}
            <strong>
                {currentPlayer.username}
            </strong>
        </div>
    );
}

export default TurnIndicator;