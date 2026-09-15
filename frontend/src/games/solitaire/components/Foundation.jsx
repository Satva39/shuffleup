import PlayingCard from "./PlayingCard";

export default function Foundation({
    suit,
    pile,
    onClick,
}) {
    const top = pile?.[pile.length - 1] || null;

    return (
        <button
            type="button"
            className="foundation-slot"
            onClick={() => onClick(suit)}
            aria-label={`${suit} foundation`}
        >
            {top ? (
                <PlayingCard card={top} compact />
            ) : (
                <span className="foundation-placeholder">{suit}</span>
            )}

            <span className="foundation-progress">
                {pile?.length || 0}/13
            </span>
        </button>
    );
}
