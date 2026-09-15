export default function ScoreBoard({ players }) {
    return <section className="rummy-scoreboard"><h3>Scoreboard</h3>{players.map((player) => (
        <div key={player.id} className="rummy-score-row"><span>{player.username}</span><b>{player.score}</b><small>{player.status}</small></div>
    ))}</section>;
}
