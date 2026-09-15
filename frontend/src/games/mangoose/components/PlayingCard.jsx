import {
    SUIT_SYMBOLS,
    isRedSuit,
} from "../logic/cards";
import "../styles/mangoose.css";

function PlayingCard({
    card,
    hidden = false,
    small = false,
    selected = false,
    onClick,
    disabled = false,
}) {
    if (hidden || !card) {
        return (
            <button
                type="button"
                className={`mangoose-card mangoose-card-back ${small
                        ? "mangoose-card-small"
                        : ""
                    }`}
                onClick={onClick}
                disabled={disabled}
                aria-label="Hidden card"
            >
                <span>
                    ♠
                </span>
            </button>
        );
    }

    return (
        <button
            type="button"
            className={`mangoose-card ${isRedSuit(card.suit)
                    ? "mangoose-card-red"
                    : ""
                } ${small
                    ? "mangoose-card-small"
                    : ""
                } ${selected
                    ? "mangoose-card-selected"
                    : ""
                }`}
            onClick={onClick}
            disabled={disabled}
            aria-label={`${card.rank} of ${card.suit}`}
        >
            <span className="mangoose-card-corner">
                <strong>{card.rank}</strong>
                <span>
                    {SUIT_SYMBOLS[card.suit]}
                </span>
            </span>

            <span className="mangoose-card-center">
                {SUIT_SYMBOLS[card.suit]}
            </span>

            <span className="mangoose-card-corner mangoose-card-corner-bottom">
                <strong>{card.rank}</strong>
                <span>
                    {SUIT_SYMBOLS[card.suit]}
                </span>
            </span>
        </button>
    );
}

export default PlayingCard;
