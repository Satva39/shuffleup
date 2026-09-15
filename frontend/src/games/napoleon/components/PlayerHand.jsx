import PlayingCard from "./PlayingCard";

function PlayerHand({
    cards,
    selectedIds,
    onCardClick,
    disabledIds = new Set(),
}) {
    return (
        <div className="napoleon-hand">
            {cards.map((card) => (
                <PlayingCard
                    key={card.id}
                    card={card}
                    selected={selectedIds.has(card.id)}
                    disabled={disabledIds.has(card.id)}
                    onClick={() => onCardClick(card)}
                />
            ))}
        </div>
    );
}

export default PlayerHand;
