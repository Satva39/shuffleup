import GameAnimation from "../../../components/game-animation/GameAnimation";
import { useTrickPresentation } from "../../../hooks/useTrickPresentation";

function getSuitSymbol(suit) {
  const symbols = {
    spades: "♠",
    diamonds: "♦",
    clubs: "♣",
    hearts: "♥",
  };

  return symbols[suit] || "";
}

function TrickArea({ trick = [], players = [], lastCompletedTrick = null }) {
  const fallbackTrick = lastCompletedTrick?.cards || [];
  const { presentedTrick, isRecent } = useTrickPresentation(
    trick,
    fallbackTrick,
  );
  const live = trick.length > 0;

  const getPlayerName = (playerId) =>
    players.find((player) => player.id === playerId)?.username || "Player";

  return (
    <GameAnimation
      as="section"
      variant={isRecent ? "trick-collection" : "fade-in"}
      className={`kachuful-trick-area ${isRecent ? "is-recent" : ""}`}
      aria-live="polite"
    >
      {presentedTrick.length > 0 ? (
        <>
          <div className="trick-status-line">
            <span>{live ? "LIVE TRICK" : "LAST TRICK"}</span>
            <small>
              {presentedTrick.length} card
              {presentedTrick.length === 1 ? "" : "s"}
              {isRecent ? " · collection complete" : ""}
            </small>
          </div>

          <div className="trick-cards">
            {presentedTrick.map((play, index) => {
              const card = play.card;
              if (!card) return null;

              const isRed = card.suit === "hearts" || card.suit === "diamonds";
              const isLatest = index === presentedTrick.length - 1;

              return (
                <GameAnimation
                  as="div"
                  variant="trick-play"
                  key={`${play.playerId}-${card.id}`}
                  className={`trick-card ${isLatest ? "is-latest" : ""}`}
                >
                  <span className="trick-player">
                    {getPlayerName(play.playerId)}
                  </span>
                  <div className={`trick-card-face ${isRed ? "is-red" : ""}`}>
                    <b>{card.rank}</b>
                    <span>{getSuitSymbol(card.suit)}</span>
                  </div>
                  {isLatest && (
                    <span className="trick-latest-badge">
                      {live ? "LAST PLAYED" : "MOST RECENT"}
                    </span>
                  )}
                </GameAnimation>
              );
            })}
          </div>
        </>
      ) : (
        <div className="trick-empty-state">
          <span className="trick-empty-symbol">♣</span>
          <strong>Ready for the first card</strong>
          <small>The trick appears here as cards are played.</small>
        </div>
      )}
    </GameAnimation>
  );
}

export default TrickArea;
