import PlayingCard from "./PlayingCard";

function PlayerHand({ cards = [] }) {
    return (
        <div className="teen-player-hand">
            {cards.map((card, index) => (
                <PlayingCard
                    key={card.id || index}
                    card={card}
                />
            ))}
        </div>
    );
}

export default PlayerHand;