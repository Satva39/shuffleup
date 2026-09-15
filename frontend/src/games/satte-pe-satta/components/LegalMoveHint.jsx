import React from "react";
import { cardLabel } from "../logic/cards";

export default function LegalMoveHint({ cards = [] }) {
    if (!cards.length) return <div className="sps-legal-hint sps-legal-hint--pass">No legal card — passing is available.</div>;
    return <div className="sps-legal-hint">Playable: {cards.map(cardLabel).join(", ")}</div>;
}
