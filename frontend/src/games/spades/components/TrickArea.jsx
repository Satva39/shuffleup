import React from "react";
import { cardLabel } from "../logic/cards";
import GameAnimation from "../../../components/game-animation/GameAnimation";
import { useTrickPresentation } from "../../../hooks/useTrickPresentation";

export default function TrickArea({
  trick = [],
  trickCount = 0,
  winnerSeat,
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
  const getPlayerName = (playerId, seat) =>
    players.find((player) => player.id === playerId)?.username ||
    seat ||
    "Player";

  return (
    <GameAnimation
      as="section"
      variant={isRecent ? "trick-collection" : "fade-in"}
      className={`spades-trick-area ${isRecent ? "is-recent" : ""}`}
      aria-live="polite"
    >
      <div className="trick-header">
        <div>
          <span className="eyebrow">
            {live ? "CURRENT TRICK" : "LAST PLAYED TRICK"}
          </span>
          <strong>
            {presentedTrick.length
              ? `${Math.min(trickCount + (live ? 1 : 0), 13)} / 13`
              : "READY"}
          </strong>
        </div>
        {winnerSeat && (
          <span className="last-winner">Winner · {winnerSeat}</span>
        )}
      </div>

      <div className="trick-cards">
        {presentedTrick.length ? (
          presentedTrick.map((play, index) => {
            const isLatest = index === presentedTrick.length - 1;
            return (
              <GameAnimation
                as="div"
                variant="trick-play"
                className={`played-card ${isLatest ? "is-latest" : ""}`}
                key={`${play.playerId}-${play.card.id}`}
              >
                <span>{getPlayerName(play.playerId, play.seat)}</span>
                <strong>{cardLabel(play.card)}</strong>
                {isLatest && <em>{live ? "LAST PLAYED" : "MOST RECENT"}</em>}
              </GameAnimation>
            );
          })
        ) : (
          <div className="trick-empty">
            <span className="trick-symbol">♠</span>
            <span>Play a card to start the trick</span>
          </div>
        )}
      </div>
    </GameAnimation>
  );
}
