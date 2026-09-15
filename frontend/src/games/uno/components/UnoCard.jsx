import { cardLabel, cardName, isWildCard } from "../logic/cards";

function UnoCard({ card, playable = false, selected = false, onClick, small = false, faceDown = false, disabled = false }) {
    if (faceDown) {
        return (
            <div className={`uno-card uno-card-back ${small ? "uno-card-small" : ""}`} aria-label="Hidden card">
                <div className="uno-card-back-logo">UNO</div>
            </div>
        );
    }

    const wild = isWildCard(card);
    const className = [
        "uno-card",
        `uno-card-${card?.color || "wild"}`,
        wild ? "uno-card-wild" : "",
        playable ? "uno-card-playable" : "",
        selected ? "uno-card-selected" : "",
        small ? "uno-card-small" : "",
        disabled ? "uno-card-disabled" : "",
    ].filter(Boolean).join(" ");

    return (
        <button
            type="button"
            className={className}
            onClick={onClick}
            disabled={disabled || (!playable && !onClick)}
            aria-label={cardName(card)}
        >
            <span className="uno-card-corner">{cardLabel(card)}</span>
            <span className="uno-card-oval">{cardLabel(card)}</span>
            <span className="uno-card-corner uno-card-corner-bottom">{cardLabel(card)}</span>
        </button>
    );
}

export default UnoCard;
