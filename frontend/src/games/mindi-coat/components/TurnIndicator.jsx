import React from "react";
import { SEAT_LABELS } from "../logic/cards";

export default function TurnIndicator({ seat, phase, actorId, userId }) {
    const myTurn = actorId === userId;
    return (
        <div className={`mindi-turn ${myTurn ? "mine" : ""}`}>
            <span>{phase === "trump-select" ? "HUKUM SELECTION" : "TURN"}</span>
            <strong>{SEAT_LABELS[seat] || "—"}</strong>
            <small>{myTurn ? "Your action" : "Waiting"}</small>
        </div>
    );
}
