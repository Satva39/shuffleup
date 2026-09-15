import React from "react";
import { bidLabel } from "../logic/bidding";
import { SEAT_LABELS } from "../logic/gameState";

export default function BidDisplay({ players = [] }) {
    return (
        <section className="spades-bid-display">
            <div className="section-label">BIDS</div>
            <div className="bid-pills">
                {players.map((player) => (
                    <div className="bid-pill" key={player.id}>
                        <span>{SEAT_LABELS[player.seat] || player.seat}</span>
                        <strong>{bidLabel(player.bid)}</strong>
                    </div>
                ))}
            </div>
        </section>
    );
}
