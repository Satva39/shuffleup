import PlayingCard from "./PlayingCard";

export default function PlayerHand({ cards = [], legalCardIds = [], onPlayCard, isMyTurn, disabled }) {
    return (
        <div className="twenty-nine-player-hand" aria-label="Your hand">
            {cards.map((card) => {
                const legal = legalCardIds.includes(card.id);
                return (
                    <PlayingCard
                        key={card.id}
                        card={card}
                        selectable={isMyTurn && !disabled}
                        disabled={disabled || (isMyTurn && !legal)}
                        onClick={() => onPlayCard(card.id)}
                    />
                );
            })}
        </div>
    );
}
