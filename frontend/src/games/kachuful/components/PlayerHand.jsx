import PlayingCard from "./PlayingCard";

function PlayerHand({
    cards,
    playableCards,
    onPlayCard,
}) {
    return (
        <div className="kachuful-hand">
            {cards.map((card) => (
                <PlayingCard
                    key={card.id}
                    card={card}
                    playable={playableCards?.has(card.id)}
                    onClick={onPlayCard}
                />
            ))}
        </div>
    );
}

export default PlayerHand;