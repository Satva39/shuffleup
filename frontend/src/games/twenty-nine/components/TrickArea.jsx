import PlayingCard from "./PlayingCard";
import GameAnimation from "../../../components/game-animation/GameAnimation";
import { useTrickPresentation } from "../../../hooks/useTrickPresentation";

export default function TrickArea({
  trick = [],
  players = [],
  completedTricks = [],
}) {
  const fallbackTrick =
    completedTricks?.[completedTricks.length - 1]?.plays || [];
  const { presentedTrick, isRecent } = useTrickPresentation(
    trick,
    fallbackTrick,
  );
  const live = trick.length > 0;

  return (
    <GameAnimation
      as="section"
      variant={isRecent ? "trick-collection" : "fade-in"}
      className={`twenty-nine-trick-area ${isRecent ? "is-recent" : ""}`}
      aria-live="polite"
    >
      <div className="twenty-nine-trick-head">
        <span>{live ? "Current Trick" : "Last Played Trick"}</span>
        <small>
          {presentedTrick.length ? `${presentedTrick.length}/4 cards` : "READY"}
        </small>
      </div>
      <div className="twenty-nine-trick-cards">
        {presentedTrick.length ? (
          presentedTrick.map((play, index) => {
            const player = players.find((item) => item.id === play.playerId);
            const isLatest = index === presentedTrick.length - 1;
            return (
              <GameAnimation
                as="div"
                variant="trick-play"
                className={`twenty-nine-trick-play ${isLatest ? "is-latest" : ""}`}
                key={`${play.playerId}-${play.card.id}`}
              >
                <PlayingCard card={play.card} selectable={false} />
                <span>{player?.username || play.seat}</span>
                {isLatest && <em>{live ? "LAST PLAYED" : "MOST RECENT"}</em>}
              </GameAnimation>
            );
          })
        ) : (
          <div className="twenty-nine-trick-empty">
            Lead a card to begin the trick.
          </div>
        )}
      </div>
    </GameAnimation>
  );
}
