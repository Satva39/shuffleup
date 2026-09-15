function TurnIndicator({
    isMyTurn,
    currentPlayer,
    pendingMongoose,
    isMongooseOffender,
}) {
    if (pendingMongoose) {

        return (
            <div className="mangoose-turn mangoose-turn-warning">
                {isMongooseOffender
                    ? "WAITING FOR MONGOOSE CALL"
                    : `MONGOOSE CALL — ${pendingMongoose.offenderUsername}`}
            </div>
        );
    }

    return (
        <div
            className={`mangoose-turn ${isMyTurn
                    ? "mangoose-turn-mine"
                    : ""
                }`}
        >
            {isMyTurn
                ? "YOUR TURN"
                : `WAITING FOR ${currentPlayer?.username ||
                "PLAYER"
                }`}
        </div>
    );
}

export default TurnIndicator;
