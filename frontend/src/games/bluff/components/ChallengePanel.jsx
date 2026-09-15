import React, { useEffect, useState } from "react";
import { remainingSeconds } from "../logic/gameState";

export default function ChallengePanel({ claim, canChallenge, onChallenge, onExpire }) {
    const [seconds, setSeconds] = useState(0);

    useEffect(() => {
        if (!claim?.expiresAt) {
            setSeconds(0);
            return undefined;
        }
        let expiredSent = false;
        const update = () => {
            const next = remainingSeconds(claim.expiresAt);
            setSeconds(next);
            if (next <= 0 && !expiredSent) {
                expiredSent = true;
                onExpire?.(claim.id);
            }
        };
        update();
        const timer = setInterval(update, 250);
        return () => clearInterval(timer);
    }, [claim?.expiresAt, claim?.id, onExpire]);

    if (!claim) return null;
    return (
        <div className="bluff-challenge-card">
            <div>
                <span className="eyebrow">CHALLENGE WINDOW</span>
                <h3>{claim.playerName} claims {claim.count} × {claim.rank}</h3>
                <p>{seconds}s remaining</p>
            </div>
            <button type="button" className="bluff-danger-btn" disabled={!canChallenge} onClick={onChallenge}>
                CALL BLUFF
            </button>
        </div>
    );
}
