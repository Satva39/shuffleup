function PlayingCard({
    card,
    playable = true,
    selected = false,
    onClick,
}) {
    if (!card) return null;

    const isRed = card.suit === "hearts" || card.suit === "diamonds";

    const symbols = {
        spades: "♠",
        diamonds: "♦",
        clubs: "♣",
        hearts: "♥",
    };

    const suit = symbols[card.suit] || "";

    return (
        <button
            type="button"
            className={[
                "kachuful-card",
                isRed ? "is-red" : "is-black",
                !playable ? "is-disabled" : "",
                selected ? "is-selected" : "",
            ]
                .filter(Boolean)
                .join(" ")}
            disabled={!playable}
            onClick={() => onClick?.(card)}
            aria-label={`${card.rank} of ${card.suit}`}
        >
            <span className="card-corner card-corner-top">
                <b>{card.rank}</b>
                <em>{suit}</em>
            </span>

            <span className="card-center-suit" aria-hidden="true">
                {suit}
            </span>

            <span className="card-corner card-corner-bottom" aria-hidden="true">
                <b>{card.rank}</b>
                <em>{suit}</em>
            </span>
        </button>
    );
}

export default PlayingCard;
