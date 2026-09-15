export default function TeamScore({ team, score, tricks, bidTeam, bid }) {
    return (
        <div className={`twenty-nine-team-score team-${team}`}>
            <div><strong>Team {team}</strong><span>{score ?? 0}</span></div>
            <small>{tricks ?? 0} tricks{bidTeam === team && bid ? ` · Contract ${bid}` : ""}</small>
        </div>
    );
}
