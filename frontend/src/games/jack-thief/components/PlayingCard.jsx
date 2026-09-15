import { cardLabel } from "../logic/cards";

function PlayingCard({ card, className = "", onClick, selected = false }) {
    const red = card?.color === "red";
    return (
        <button
            type="button"
            className={`jt-playing-card ${red ? "red" : "black"} ${selected ? "selected" : ""} ${className}`}
            onClick={onClick}
            aria-label={cardLabel(card)}
        >
            <span>{card?.rank}</span>
            <strong>{card?.symbol}</strong>
        </button>
    );
}

export function CardBack({ onClick, disabled = false }) {
    return (
        <button
            type="button"
            className={`jt-card-back ${disabled ? "disabled" : ""}`}
            onClick={onClick}
            disabled={disabled}
            aria-label="Hidden card"
        >
            <span>✦</span>
        </button>
    );
}

export default PlayingCard;
