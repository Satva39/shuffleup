import PlayerProgress from "./PlayerProgress";

export default function OpponentList({ players, playerId }) {
    const opponents = players
        .filter((player) => player.id !== playerId)
        .sort((left, right) => (left.progress < right.progress ? 1 : -1));

    return (
        <aside className="solitaire-opponents">
            <div className="panel-title">
                <span>PLAYERS</span>
                <small>{players.length}</small>
            </div>

            {opponents.length === 0 ? (
                <p className="empty-opponents">
                    No opponents in the room.
                </p>
            ) : (
                opponents.map((player) => (
                    <PlayerProgress
                        key={player.id}
                        player={player}
                    />
                ))
            )}
        </aside>
    );
}
