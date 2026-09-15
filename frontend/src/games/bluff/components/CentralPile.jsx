import React from "react";

export default function CentralPile({ pileCount, claim, requiredRank }) {
    return (
        <div className="bluff-pile-area">
            <div className="bluff-pile-stack">
                <span className="pile-layer layer-1" />
                <span className="pile-layer layer-2" />
                <div className="bluff-pile-card">
                    <strong>?</strong>
                </div>
                <b className="pile-count">{pileCount}</b>
            </div>
            <div className="bluff-claim-badge">
                <span>REQUIRED</span>
                <strong>{requiredRank}</strong>
            </div>
            {claim && (
                <div className="bluff-active-claim">
                    <span>{claim.playerName} claims</span>
                    <strong>{claim.count} × {claim.rank}</strong>
                </div>
            )}
        </div>
    );
}
