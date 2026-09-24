import "../styles/teenPatti.css";

const SUIT_SYMBOLS = {
  spades: "♠",
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
};

function PlayingCard({ card, hidden = false, small = false }) {
  if (hidden || !card) {
    return (
      <div
        className={`teen-card game-card-motion teen-card-back ${
          small ? "teen-card-small" : ""
        }`}
      >
        <div className="teen-card-back-pattern">
          <span>♠</span>
        </div>
      </div>
    );
  }

  const red = card.suit === "hearts" || card.suit === "diamonds";

  return (
    <div
      className={`teen-card game-card-motion teen-card-face-up ${
        red ? "teen-card-red" : ""
      } ${small ? "teen-card-small" : ""}`}
    >
      <div className="teen-card-corner">
        <strong>{card.rank}</strong>
        <span>{SUIT_SYMBOLS[card.suit]}</span>
      </div>

      <div className="teen-card-center">{SUIT_SYMBOLS[card.suit]}</div>

      <div className="teen-card-corner teen-card-corner-bottom">
        <strong>{card.rank}</strong>
        <span>{SUIT_SYMBOLS[card.suit]}</span>
      </div>
    </div>
  );
}

export default PlayingCard;
