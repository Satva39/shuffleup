export default function GameResult({ result, onLobby }) {
    const winner = result?.players?.find((player) => player.id === result.winnerId);
    return <div className="rummy-result-overlay"><div className="rummy-result-card">
        <span>GAME COMPLETE</span><h1>🏆 {winner?.username || "Winner"} WINS</h1>
        <div className="rummy-result-list">{result?.players?.map((player) => <div key={player.id}><strong>{player.username}</strong><b>{player.score} points</b></div>)}</div>
        <button type="button" onClick={onLobby}>Return to Lobby</button>
    </div></div>;
}
