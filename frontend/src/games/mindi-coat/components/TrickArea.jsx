import React from "react";
import { SUIT_SYMBOLS } from "../logic/cards";
import GameAnimation from "../../../components/game-animation/GameAnimation";
import { useTrickPresentation } from "../../../hooks/useTrickPresentation";

export default function TrickArea({
  trick = [],
  trickCount = 0,
  winnerSeat,
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
      className={`mindi-trick-area ${isRecent ? "is-recent" : ""}`}
      aria-live="polite"
    >
      <div className="mindi-trick-heading">
        <span>{live ? "CURRENT TRICK" : "LAST PLAYED TRICK"}</span>
        <small>
          {presentedTrick.length
            ? `${Math.min(trickCount + (live ? 1 : 0), 13)} / 13`
            : "READY"}
          {winnerSeat ? ` · Winner ${winnerSeat}` : ""}
        </small>
      </div>

      <div className="mindi-trick-cards">
        {presentedTrick.length ? (
          presentedTrick.map((play, index) => {
            const red = play.card.suit === "H" || play.card.suit === "D";
            const isLatest = index === presentedTrick.length - 1;
            return (
              <GameAnimation
                as="div"
                variant="trick-play"
                className={`mindi-played-card ${isLatest ? "is-latest" : ""}`}
                key={`${play.playerId}-${play.card.id}`}
              >
                <div
                  className={`mindi-card ${red ? "red" : ""} mindi-center-card`}
                >
                  <span className="mindi-card-rank">{play.card.rank}</span>
                  <span className="mindi-card-suit">
                    {SUIT_SYMBOLS[play.card.suit]}
                  </span>
                </div>
                <span>{play.seat}</span>
                {isLatest && <em>{live ? "LAST PLAYED" : "MOST RECENT"}</em>}
              </GameAnimation>
            );
          })
        ) : (
          <div className="mindi-trick-empty">
            <span className="trick-symbol">♠</span>
            <span>Play a card to start the trick</span>
          </div>
        )}
      </div>
    </GameAnimation>
  );
}
