function TurnIndicator({
    currentPlayer,
    isYourTurn,
}) {
    return (
        <div
            className={
                isYourTurn
                    ? "kachuful-turn your-turn"
                    : "kachuful-turn"
            }
        >
            <span>
                {isYourTurn
                    ? "YOUR TURN"
                    : `WAITING FOR ${currentPlayer?.username ||
                    "PLAYER"
                    }`}
            </span>
        </div>
    );
}

export default TurnIndicator;