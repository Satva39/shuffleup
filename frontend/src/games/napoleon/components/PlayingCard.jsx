function PlayingCard({
    card,
    selected = false,
    disabled = false,
    hidden = false,
    onClick,
    compact = false,
}) {
    if (hidden) {
        return (
            <button
                type="button"
                className={`napoleon-card napoleon-card-back ${compact ? "compact" : ""
                    }`}
                disabled
            >
                <span>SU</span>
            </button>
        );
    }

    const isRed =
        card?.suit === "hearts" ||
        card?.suit === "diamonds";

    const symbols = {
        spades: "♠",
        hearts: "♥",
        diamonds: "♦",
        clubs: "♣",
    };

    return (
        <button
            type="button"
            className={`napoleon-card ${selected ? "selected" : ""
                } ${disabled ? "disabled" : ""} ${compact ? "compact" : ""
                }`}
            onClick={onClick}
            disabled={disabled}
            aria-label={`${card.rank} of ${card.suit}`}
        >
            <span className={`card-corner ${isRed ? "red" : ""}`}>
                {card.rank}
                {symbols[card.suit]}
            </span>
            <span className={`card-center ${isRed ? "red" : ""}`}>
                {symbols[card.suit]}
            </span>
            <span className={`card-corner bottom ${isRed ? "red" : ""}`}>
                {card.rank}
                {symbols[card.suit]}
            </span>
        </button>
    );
}

export default PlayingCard;
