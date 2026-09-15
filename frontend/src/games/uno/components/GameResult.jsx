function GameResult({ result, gameComplete, canNextRound, onNextRound, onLobby }) {
    if (!result) return null;
    return (
        <div className="uno-modal-backdrop">
            <div className="uno-result-modal">
                <span>{gameComplete ? "GAME COMPLETE" : "ROUND COMPLETE"}</span>
                <h2>{gameComplete ? "WINNER" : "ROUND WINNER"}</h2>
                <strong className="uno-result-winner">{result.winnerUsername}</strong>
                <div className="uno-result-score">+{result.roundScore} points</div>
                <div className="uno-result-table">
                    {result.scores.map((player) => (
                        <div className="uno-result-row" key={player.id}>
                            <span>{player.username}</span>
                            <b>{player.totalScore}</b>
                        </div>
                    ))}
                </div>
                <div className="uno-result-actions">
                    {!gameComplete && canNextRound && <button onClick={onNextRound}>NEXT ROUND</button>}
                    <button onClick={onLobby}>RETURN TO LOBBY</button>
                </div>
            </div>
        </div>
    );
}

export default GameResult;
