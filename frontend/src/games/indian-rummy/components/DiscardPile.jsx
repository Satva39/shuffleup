import PlayingCard from "./PlayingCard";
export default function DiscardPile({ card, count, onDraw, disabled }) {
    return <button type="button" className="rummy-pile-control" onClick={onDraw} disabled={disabled || !card}>
        {card ? <PlayingCard card={card} small /> : <div className="rummy-empty-pile">—</div>}
        <span>OPEN DECK</span><small>{count} cards</small>
    </button>;
}
