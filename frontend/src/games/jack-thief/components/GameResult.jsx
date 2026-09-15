function GameResult({ state, onLobby }) {
    if (state?.status !== "complete") return null;
    const loser = state.players.find((player) => player.id === state.loserId);
    const finished = state.players
        .filter((player) => player.eliminationPlace)
        .sort((a, b) => a.eliminationPlace - b.eliminationPlace);

    return (
        <div className="jt-result-overlay">
            <div className="jt-result-card">
                <span className="jt-result-kicker">THE LAST JACK</span>
                <h1>JACK THIEF</h1>
                <p className="jt-result-main">
                    {loser ? `${loser.username} is holding the final Jack.` : "The final Jack has been found."}
                </p>
                {state.finalJack && (
                    <div className={`jt-final-jack ${state.finalJack.color === "red" ? "red" : "black"}`}>
                        <span>{state.finalJack.rank}</span>
                        <strong>{state.finalJack.symbol}</strong>
                    </div>
                )}
                <div className="jt-elimination-list">
                    {finished.map((player) => (
                        <span key={player.id}>#{player.eliminationPlace} {player.username}</span>
                    ))}
                    {loser && <span className="loser">LOSER · {loser.username}</span>}
                </div>
                <button type="button" onClick={onLobby}>RETURN TO LOBBY</button>
            </div>
        </div>
    );
}

export default GameResult;
