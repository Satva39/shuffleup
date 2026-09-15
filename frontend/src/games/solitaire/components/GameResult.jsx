export default function GameResult({
    rankings,
    onLobby,
}) {
    return (
        <div className="solitaire-result-overlay">
            <section className="solitaire-result">
                <span className="result-eyebrow">SOLITAIRE COMPLETE</span>
                <h2>Race finished</h2>
                <p>Every player has completed their board.</p>

                <div className="result-list">
                    {rankings.map((player) => (
                        <div
                            key={player.id}
                            className={`result-row ${player.rank === 1 ? "winner" : ""}`}
                        >
                            <span className="result-rank">#{player.rank}</span>
                            <strong>{player.username}</strong>
                            <span>{player.progress}/52</span>
                            <span>{player.moves} moves</span>
                            <b>{player.score}</b>
                        </div>
                    ))}
                </div>

                <button
                    type="button"
                    className="result-lobby-button"
                    onClick={onLobby}
                >
                    Return to Lobby
                </button>
            </section>
        </div>
    );
}
