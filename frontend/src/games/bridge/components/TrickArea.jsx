import PlayingCard from "./PlayingCard";
import GameAnimation from "../../../components/game-animation/GameAnimation";
import { useTrickPresentation } from "../../../hooks/useTrickPresentation";

export default function TrickArea({ trick = [], players = [], winnerSeat }) {
  const { presentedTrick, isRecent } = useTrickPresentation(trick);
  const live = trick.length > 0;
  const getPlayerName = (playerId, seat) =>
    players.find((player) => player.id === playerId)?.username ||
    seat ||
    "Player";

  return (
    <GameAnimation
      as="div"
      variant={isRecent ? "trick-collection" : "fade-in"}
      className={`bridge-trick-area ${isRecent ? "is-recent" : ""}`}
      aria-live="polite"
    >
      <div className="bridge-trick-title-row">
        <div className="bridge-trick-title">
          {live ? "Current trick" : "Last played trick"}
        </div>
        <span>
          {presentedTrick.length ? `${presentedTrick.length}/4` : "READY"}
        </span>
      </div>
      <div className="bridge-trick-cards">
        {presentedTrick.length ? (
          presentedTrick.map((entry, index) => {
            const isLatest = index === presentedTrick.length - 1;
            return (
              <GameAnimation
                as="div"
                variant="trick-play"
                key={`${entry.playerId}-${entry.card.id}`}
                className={`bridge-played-card bridge-played-${(entry.seat || "").toLowerCase()} ${!live && winnerSeat === entry.seat ? "is-winner" : ""} ${isLatest ? "is-latest" : ""}`}
              >
                <div className="bridge-played-card-meta">
                  <strong>{getPlayerName(entry.playerId, entry.seat)}</strong>
                  <small>{entry.seat}</small>
                </div>
                <PlayingCard card={entry.card} />
                {isLatest && (
                  <span className="bridge-latest-badge">
                    {live ? "LAST PLAYED" : "MOST RECENT"}
                  </span>
                )}
              </GameAnimation>
            );
          })
        ) : (
          <div className="bridge-trick-placeholder">
            Lead a card to begin the trick.
          </div>
        )}
      </div>
    </GameAnimation>
  );
}
