import PlayingCard from "./PlayingCard";

function PlayerHand({ cards, disabled }) {
    return (
        <section className="jt-hand-panel">
            <div className="jt-panel-label">
                <span>YOUR HAND</span>
                <strong>{cards.length} {cards.length === 1 ? "CARD" : "CARDS"}</strong>
            </div>
            <div className="jt-hand">
                {cards.length === 0 ? (
                    <div className="jt-empty-hand">NO CARDS · YOU HAVE FINISHED</div>
                ) : cards.map((card) => (
                    <PlayingCard key={card.id} card={card} className="jt-hand-card" onClick={disabled ? undefined : () => { }} />
                ))}
            </div>
        </section>
    );
}

export default PlayerHand;
