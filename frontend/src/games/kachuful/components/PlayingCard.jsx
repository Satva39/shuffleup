function PlayingCard({
    card,
    playable = true,
    selected = false,
    onClick,
}) {
    if (!card) return null;

    const isRed =
        card.suit === "hearts" ||
        card.suit === "diamonds";

    const symbols = {
        spades: "♠",
        diamonds: "♦",
        clubs: "♣",
        hearts: "♥",
    };

    return (
        <button
            type="button"
            className={[
                "kachuful-card",
                isRed ? "card-red" : "card-black",
                !playable ? "card-disabled" : "",
                selected ? "card-selected" : "",
            ]
                .filter(Boolean)
                .join(" ")}
            disabled={!playable}
            onClick={() => onClick?.(card)}
            aria-label={`${card.rank} of ${card.suit}`}
        >
            <span className="card-rank">
                {card.rank}
            </span>

            <span className="card-suit">
                {symbols[card.suit]}
            </span>
        </button>
    );
}

export default PlayingCard;