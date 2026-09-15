function PlayingCard({ card, playable = true, selected = false, onClick, size = "hand" }) {
    if (!card) return null;

    const isRed = card.suit === "hearts" || card.suit === "diamonds";
    const symbols = { spades: "♠", diamonds: "♦", clubs: "♣", hearts: "♥" };
    const suitSymbol = symbols[card.suit] || "";

    return (
        <button
            type="button"
            className={[
                "kachuful-card",
                `card-${size}`,
                isRed ? "card-red" : "card-black",
                !playable ? "card-disabled" : "",
                selected ? "card-selected" : "",
            ].filter(Boolean).join(" ")}
            disabled={!playable}
            onClick={() => onClick?.(card)}
            aria-label={`${card.rank} of ${card.suit}`}
        >
            <span className="card-index-corner" aria-hidden="true">
                <b>{card.rank}</b>
                <span>{suitSymbol}</span>
            </span>
            <span className="card-center-suit" aria-hidden="true">{suitSymbol}</span>
            <span className="card-bottom-corner" aria-hidden="true">
                <span>{suitSymbol}</span>
                <b>{card.rank}</b>
            </span>
        </button>
    );
}

export default PlayingCard;
