import UnoCard from "./UnoCard";

function PlayerHand({ cards = [], playableCardIds = [], selectedCardId, onSelect }) {
    return (
        <div className="uno-hand-wrap">
            <div className="uno-hand-header">
                <span>YOUR HAND</span>
                <small>{cards.length} cards</small>
            </div>
            <div className="uno-hand" role="list">
                {cards.map((card, index) => {
                    const playable = playableCardIds.includes(card.id);
                    return (
                        <div className="uno-hand-card" key={card.id} style={{ "--card-index": index }}>
                            <UnoCard
                                card={card}
                                playable={playable}
                                selected={selectedCardId === card.id}
                                onClick={() => onSelect(card)}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default PlayerHand;
