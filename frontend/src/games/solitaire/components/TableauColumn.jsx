import PlayingCard from "./PlayingCard";

export default function TableauColumn({
    column,
    columnIndex,
    selection,
    onCardClick,
    onEmptyClick,
}) {
    return (
        <div className="tableau-column">
            {column.length === 0 && (
                <button
                    type="button"
                    className="empty-tableau"
                    onClick={() => onEmptyClick(columnIndex)}
                    aria-label={`Empty tableau column ${columnIndex + 1}`}
                >
                    <span>K</span>
                </button>
            )}

            {column.map((card, cardIndex) => (
                <div
                    className="tableau-card-slot"
                    key={card.id}
                    style={{
                        zIndex: cardIndex + 1,
                        "--stack-offset": `${cardIndex * 30}px`,
                    }}
                >
                    <PlayingCard
                        card={card}
                        selected={
                            selection?.type === "tableau" &&
                            selection.columnIndex === columnIndex &&
                            selection.cardIndex === cardIndex
                        }
                        onClick={() =>
                            onCardClick(columnIndex, cardIndex, card)
                        }
                    />
                </div>
            ))}
        </div>
    );
}
