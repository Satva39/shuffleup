import React from "react";
import { phaseLabel } from "../logic/gameState";

export default function GameStatus({ phase, handNumber, targetScore }) {
    return (
        <div className="mindi-status">
            <span className="status-dot" />
            <div><strong>{phaseLabel(phase)}</strong><small>Hand {handNumber} · first to {targetScore}</small></div>
        </div>
    );
}
