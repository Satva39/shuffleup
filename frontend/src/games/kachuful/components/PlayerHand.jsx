import PlayingCard from "./PlayingCard";

function PlayerHand({ cards, playableCards, onPlayCard }) {
    return (
        <div className={`kachuful-hand hand-count-${Math.min(cards?.length || 0, 10)}`} aria-label="Your hand">
            {(cards || []).map((card) => (
                <div className="hand-card-slot" key={card.id}>
                    <PlayingCard
                        card={card}
                        playable={playableCards?.has(card.id)}
                        onClick={onPlayCard}
                    />
                </div>
            ))}
        </div>
    );
}

export default PlayerHand;
