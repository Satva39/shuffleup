import PlayingCard from "./PlayingCard";
import { getSeatClass } from "../logic/gameState";

function PlayerSeat({
    player,
    playerCount,
    localPlayerId,
    currentPlayerId,
    onOpponentTarget,
}) {
    const isLocal = player.id === localPlayerId;
    const isTurn =
        player.id === currentPlayerId;

    return (
        <div
            className={`mangoose-seat ${getSeatClass(
                playerCount,
                player.seat
            )}`}
        >
            <div
                className={`mangoose-player-card ${isTurn
                        ? "mangoose-player-turn"
                        : ""
                    } ${isLocal
                        ? "mangoose-player-local"
                        : ""
                    } ${!player.connected
                        ? "mangoose-player-disconnected"
                        : ""
                    }`}
            >
                <div className="mangoose-player-avatar">
                    {player.username
                        .charAt(0)
                        .toUpperCase()}
                </div>

                <div className="mangoose-player-meta">
                    <strong>
                        {isLocal
                            ? `${player.username} (You)`
                            : player.username}
                    </strong>
                    <span>
                        {player.status.toUpperCase()}
                    </span>
                </div>

                <div className="mangoose-player-count">
                    {player.closedCount +
                        player.openCount}
                </div>
            </div>

            {!isLocal &&
                player.openTopCard && (
                    <div
                        className="mangoose-opponent-pile"
                        onClick={() =>
                            onOpponentTarget(
                                player.id
                            )
                        }
                        onKeyDown={(event) => {
                            if (
                                event.key === "Enter" ||
                                event.key === " "
                            ) {
                                event.preventDefault();
                                onOpponentTarget(
                                    player.id
                                );
                            }
                        }}
                        role="button"
                        tabIndex={0}
                        title={`Play on ${player.username}'s pile`}
                    >
                        <PlayingCard
                            card={
                                player.openTopCard
                            }
                            small
                            disabled={
                                !currentPlayerId
                            }
                        />
                        <span>
                            {player.openCount}
                        </span>
                    </div>
                )}
        </div>
    );
}

export default PlayerSeat;
