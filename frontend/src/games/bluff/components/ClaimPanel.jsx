import React from "react";

export default function ClaimPanel({ requiredRank, selectedCount, canPlay, onPlay, maxCards }) {
    return (
        <div className="bluff-control-card">
            <div>
                <span className="eyebrow">YOUR CLAIM</span>
                <h3>{selectedCount || 0} × {requiredRank}</h3>
                <p>Choose 1–{maxCards} cards. The rank is fixed by the sequence.</p>
            </div>
            <button
                type="button"
                className="bluff-primary-btn"
                disabled={!canPlay || selectedCount < 1}
                onClick={onPlay}
            >
                PLAY FACE-DOWN
            </button>
        </div>
    );
}
