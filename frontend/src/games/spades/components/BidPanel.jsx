import React from "react";
import { BID_OPTIONS, bidLabel } from "../logic/bidding";

export default function BidPanel({ options = BID_OPTIONS, selected, onSelect, onSubmit, disabled }) {
    return (
        <section className="spades-panel bid-panel">
            <div className="panel-heading">
                <div>
                    <span className="eyebrow">CONTRACT</span>
                    <h2>Your bid</h2>
                </div>
                <span className="panel-hint">Choose 0–13 tricks</span>
            </div>

            <div className="bid-options">
                {options.map((bid) => (
                    <button
                        key={bid}
                        type="button"
                        className={selected === bid ? "selected" : ""}
                        onClick={() => onSelect(bid)}
                        disabled={disabled}
                    >
                        <span>{bidLabel(bid)}</span>
                    </button>
                ))}
            </div>

            <button
                className="primary-button"
                type="button"
                onClick={onSubmit}
                disabled={disabled || selected === null || selected === undefined}
            >
                Confirm bid
            </button>
        </section>
    );
}
