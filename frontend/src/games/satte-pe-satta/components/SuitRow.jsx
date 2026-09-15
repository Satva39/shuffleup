import React from "react";
import PlayingCard from "./PlayingCard";
import { SUIT_SYMBOLS } from "../logic/cards";

export default function SuitRow({ suit, cards = [] }) {
    const sorted = [...cards].sort((a, b) => a.value - b.value);
    const display = sorted.length ? sorted.map((card) => (
        <PlayingCard key={card.id} card={card} compact />
    )) : <div className="sps-empty-row">7 {SUIT_SYMBOLS[suit]} opens this row</div>;

    return (
        <section className={`sps-suit-row sps-suit-row--${suit}`}>
            <div className="sps-row-label"><strong>{SUIT_SYMBOLS[suit]}</strong><span>{suit.toUpperCase()}</span></div>
            <div className="sps-row-cards">{display}</div>
        </section>
    );
}
