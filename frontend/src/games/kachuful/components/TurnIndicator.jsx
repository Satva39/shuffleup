function TurnIndicator({ currentPlayer, isYourTurn, status }) {
    const isBidding = status === "bidding";
    const title = isYourTurn ? "YOUR TURN" : currentPlayer?.username ? `${currentPlayer.username}'S TURN` : "TABLE IS MOVING";
    const detail = isBidding ? "Choose a bid" : isYourTurn ? "Choose a legal card" : "Watch the live table";

    return (
        <div className={`kachuful-turn context-turn ${isYourTurn ? "your-turn" : ""}`}>
            <span className="turn-pulse" />
            <div>
                <strong>{title}</strong>
                <small>{detail}</small>
            </div>
        </div>
    );
}

export default TurnIndicator;
