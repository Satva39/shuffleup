import PlayingCard from "./PlayingCard";
import GameAnimation from "../../../components/game-animation/GameAnimation";
import { useTrickPresentation } from "../../../hooks/useTrickPresentation";

function TrickArea({ trick = [], players = [], lastCompletedTrick = null }) {
  const fallbackTrick = lastCompletedTrick?.cards || [];
  const { presentedTrick, isRecent } = useTrickPresentation(
    trick,
    fallbackTrick,
  );
  const live = trick.length > 0;

  return (
    <GameAnimation
      as="div"
      variant={isRecent ? "trick-collection" : "fade-in"}
      className={`trick-area ${isRecent ? "is-recent" : ""}`}
      aria-live="polite"
    >
      <div className="trick-status-line">
        <span>{live ? "LIVE TRICK" : "LAST PLAYED TRICK"}</span>
        <small>
          {presentedTrick.length
            ? `${presentedTrick.length} card${presentedTrick.length === 1 ? "" : "s"}`
            : "READY"}
        </small>
      </div>

      {presentedTrick.length ? (
        <div className="trick-cards">
          {presentedTrick.map((play, index) => {
            const player = players.find((item) => item.id === play.playerId);
            const isLatest = index === presentedTrick.length - 1;

            return (
              <GameAnimation
                as="div"
                variant="trick-play"
                className={`trick-card-wrap ${isLatest ? "is-latest" : ""}`}
                key={`${play.playerId}-${play.card.id}`}
              >
                <PlayingCard card={play.card} compact />
                <span>{player?.username || "Player"}</span>
                {isLatest && <em>{live ? "LAST PLAYED" : "MOST RECENT"}</em>}
              </GameAnimation>
            );
          })}
        </div>
      ) : (
        <div className="trick-empty">
          <span>TRICK AREA</span>
          {lastCompletedTrick && (
            <small>
              Trick {lastCompletedTrick.number} won by{" "}
              {players.find(
                (player) => player.id === lastCompletedTrick.winnerId,
              )?.username || "Player"}
            </small>
          )}
        </div>
      )}
    </GameAnimation>
  );
}

export default TrickArea;
