import React from "react";
import { SUIT_NAMES, SUIT_SYMBOLS } from "../logic/cards";

export default function TrumpDisplay({ suit, revealed }) {
    return (
        <div className={`mindi-trump-display ${revealed ? "revealed" : "hidden"}`}>
            <span className="eyebrow">HUKUM / TRUMP</span>
            {revealed && suit ? (
                <strong>{SUIT_SYMBOLS[suit]} {SUIT_NAMES[suit]}</strong>
            ) : (
                <strong>HIDDEN</strong>
            )}
            <small>{revealed ? "Trump revealed" : "Waiting for the first cut"}</small>
        </div>
    );
}
