import { CardBack } from "./PlayingCard";

function DrawArea({ target, canDraw, onDraw }) {
    if (!target) {
        return <div className="jt-draw-area jt-draw-empty">NO DRAW TARGET</div>;
    }

    const cards = Array.from({ length: target.cardCount });

    return (
        <div className={`jt-draw-area ${canDraw ? "can-draw" : ""}`}>
            <div className="jt-draw-heading">
                <span>{canDraw ? "SELECT A HIDDEN CARD" : "DRAW TARGET"}</span>
                <strong>{target.username}</strong>
            </div>
            <div className="jt-hidden-hand">
                {cards.map((_, index) => (
                    <CardBack
                        key={`${target.id}-${index}`}
                        disabled={!canDraw}
                        onClick={() => onDraw(target.id, index)}
                    />
                ))}
            </div>
        </div>
    );
}

export default DrawArea;
