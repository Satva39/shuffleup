function TurnIndicator({ currentPlayer, isYourTurn }) {
    return (
        <div className={`kachuful-turn-indicator ${isYourTurn ? "is-mine" : ""}`}>
            <i />
            <div>
                <span>{isYourTurn ? "YOUR TURN" : "CURRENT TURN"}</span>
                <strong>
                    {isYourTurn ? "Play when ready" : `${currentPlayer?.username || "Player"} is playing`}
                </strong>
            </div>
        </div>
    );
}

export default TurnIndicator;
