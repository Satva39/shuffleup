function TurnIndicator({ yourTurn, currentPlayerName, phase }) {
    return (
        <div className={`turn-indicator ${yourTurn ? "your-turn" : ""}`}>
            <small>{phase}</small>
            <strong>
                {yourTurn
                    ? "YOUR TURN"
                    : `WAITING FOR ${currentPlayerName?.toUpperCase()}`}
            </strong>
        </div>
    );
}

export default TurnIndicator;
