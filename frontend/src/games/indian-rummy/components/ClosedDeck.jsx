import PlayingCard from "./PlayingCard";
export default function ClosedDeck({ count, onDraw, disabled }) {
    return <button type="button" className="rummy-pile-control" onClick={onDraw} disabled={disabled}>
        <PlayingCard faceDown small />
        <span>CLOSED DECK</span><small>{count} left</small>
    </button>;
}
