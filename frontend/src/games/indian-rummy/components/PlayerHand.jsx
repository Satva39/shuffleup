import PlayingCard from "./PlayingCard";

export default function PlayerHand({ cards, selectedIds, onToggle, onMoveLeft, onMoveRight }) {
    return (
        <div className="rummy-hand-wrap">
            <div className="rummy-hand-toolbar">
                <span>{cards.length} cards</span>
                <div>
                    <button type="button" onClick={onMoveLeft}>Move Left</button>
                    <button type="button" onClick={onMoveRight}>Move Right</button>
                </div>
            </div>
            <div className="rummy-hand">
                {cards.map((card) => (
                    <PlayingCard
                        key={card.id}
                        card={card}
                        selected={selectedIds.includes(card.id)}
                        onClick={() => onToggle(card.id)}
                    />
                ))}
            </div>
        </div>
    );
}
