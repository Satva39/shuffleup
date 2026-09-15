import PlayingCard from "./PlayingCard";
import { sortCards } from "../logic/cards";

export default function PlayerHand({ cards = [], selectableIds = new Set(), onCardClick, compact = false }) {
    const sorted = sortCards(cards);
    return (
        <div className={`bridge-hand ${compact ? "compact" : ""}`}>
            {sorted.map((card) => (
                <PlayingCard
                    key={card.id}
                    card={card}
                    selectable={selectableIds.has(card.id)}
                    disabled={selectableIds.size > 0 && !selectableIds.has(card.id)}
                    onClick={() => onCardClick?.(card)}
                />
            ))}
        </div>
    );
}
