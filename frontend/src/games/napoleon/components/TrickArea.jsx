import PlayingCard from "./PlayingCard";

function TrickArea({ trick, players, lastCompletedTrick }) {
    return (
        <div className="trick-area">
            {trick?.length ? (
                trick.map((play) => {
                    const player = players.find(
                        (item) => item.id === play.playerId
                    );

                    return (
                        <div
                            className="trick-card-wrap"
                            key={`${play.playerId}-${play.card.id}`}
                        >
                            <PlayingCard
                                card={play.card}
                                compact
                            />
                            <span>{player?.username || "Player"}</span>
                        </div>
                    );
                })
            ) : (
                <div className="trick-empty">
                    <span>TRICK AREA</span>
                    {lastCompletedTrick && (
                        <small>
                            Trick {lastCompletedTrick.number} won by{" "}
                            {
                                players.find(
                                    (player) =>
                                        player.id ===
                                        lastCompletedTrick.winnerId
                                )?.username
                            }
                        </small>
                    )}
                </div>
            )}
        </div>
    );
}

export default TrickArea;
