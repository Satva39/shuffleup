function RoundInfo({ gameState }) {
    return (
        <div className="round-info">
            <div>
                <span>CONTRACT</span>
                <strong>
                    {gameState.contract
                        ? `${gameState.contract.amount} ${gameState.contract.suitSymbol}`
                        : "—"}
                </strong>
            </div>
            <div>
                <span>NAPOLEON</span>
                <strong>
                    {gameState.players.find(
                        (player) =>
                            player.id === gameState.napoleonId
                    )?.username || "—"}
                </strong>
            </div>
            <div>
                <span>TRICKS</span>
                <strong>{gameState.completedTrickCount}/10</strong>
            </div>
        </div>
    );
}

export default RoundInfo;
