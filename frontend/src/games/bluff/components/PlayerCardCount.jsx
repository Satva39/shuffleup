import React from "react";

export default function PlayerCardCount({ count }) {
    const visible = Math.min(count, 8);
    return (
        <div className="bluff-opponent-cards" aria-label={`${count} cards remaining`}>
            <div className="bluff-card-stack">
                {Array.from({ length: visible }).map((_, index) => (
                    <span className="bluff-mini-back" key={index} />
                ))}
                <b>{count}</b>
            </div>
            <small>cards</small>
        </div>
    );
}
