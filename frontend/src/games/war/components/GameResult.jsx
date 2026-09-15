export default function GameResult({ state, onLobby }) {
    if (state.status !== "complete") return null;
    const winner = state.players.find((player) => player.id === state.winnerId);
    return (
        <div className="war-result-overlay">
            <div className="war-result-card">
                <span className="war-result-kicker">SHUFFLEUP · WAR</span>
                <h2>{winner ? `${winner.username} wins!` : "War ends in a draw"}</h2>
                <p>{state.resultReason === "last-player-standing" ? "The last player with cards wins the game." : "Both players exhausted their cards at the same time."}</p>
                <div className="war-result-ranking">
                    {state.players.map((player, index) => (
                        <div key={player.id} className={player.id === state.winnerId ? "is-winner" : ""}>
                            <span>#{index + 1}</span>
                            <strong>{player.username}</strong>
                            <small>{player.cardCount} cards</small>
                        </div>
                    ))}
                </div>
                <button type="button" className="war-primary-btn" onClick={onLobby}>Return to Lobby</button>
            </div>
        </div>
    );
}
