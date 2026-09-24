import { cardLabel, isRed } from "../logic/cards";

export default function PlayingCard({
  card,
  hidden = false,
  featured = false,
  small = false,
}) {
  return (
    <div
      className={`war-card game-card-motion ${hidden ? "is-hidden" : ""} ${featured ? "is-featured" : ""} ${small ? "is-small" : ""} ${isRed(card) ? "is-red" : "is-black"}`}
    >
      {hidden ? (
        <div className="war-card-back-mark">S</div>
      ) : (
        <>
          <span className="war-card-rank">{card?.rank}</span>
          <span className="war-card-suit">
            {cardLabel(card)?.slice(cardLabel(card).length - 1)}
          </span>
        </>
      )}
    </div>
  );
}
