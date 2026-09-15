import React, { useState } from "react";
import PlayingCard from "./PlayingCard";

export default function TrumpSelector({ hand, onSelect, disabled = false }) {
    const [selectedId, setSelectedId] = useState(null);
    const selectedIndex = hand.findIndex((card) => card.id === selectedId);

    function choose(cardId) {
        if (disabled) return;
        setSelectedId(cardId);
    }

    async function confirm() {
        if (!selectedId) return;
        const response = await onSelect(selectedId);
        if (response?.success) setSelectedId(null);
    }

    return (
        <div className="mindi-trump-selector">
            <div>
                <span className="eyebrow">CLOSED TRUMP</span>
                <h2>Choose the hidden Hukum</h2>
                <p>Choose one card position and place it face down. The selected card is hidden from you until another player opens Hukum.</p>
            </div>

            <div className="mindi-hidden-selector-hand">
                {hand.map((card, index) => (
                    <button
                        type="button"
                        key={card.id}
                        className={`mindi-hidden-choice ${selectedId === card.id ? "selected" : ""}`}
                        disabled={disabled}
                        onClick={() => choose(card.id)}
                        aria-label={`Hidden card position ${index + 1}`}
                    >
                        <PlayingCard hidden />
                        <span>{index + 1}</span>
                    </button>
                ))}
            </div>

            <div className="mindi-selector-footer">
                <span>{selectedIndex >= 0 ? `Card position ${selectedIndex + 1} selected` : "Choose one face-down card"}</span>
                <button type="button" className="mindi-primary" onClick={confirm} disabled={disabled || !selectedId}>Place Hukum Face Down</button>
            </div>
        </div>
    );
}
