import React, { useEffect, useState } from "react";
import { cardLabel } from "../logic/cards";

export default function ChallengeResult({ result }) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (!result?.resolvedAt) {
            setVisible(false);
            return undefined;
        }
        setVisible(true);
        const timer = setTimeout(() => setVisible(false), 4200);
        return () => clearTimeout(timer);
    }, [result?.resolvedAt]);

    if (!result || !visible) return null;
    return (
        <div className={`bluff-result-modal ${result.result === "BLUFF" ? "bluff" : "truth"}`}>
            <span className="eyebrow">CHALLENGE RESULT</span>
            <h2>{result.result}</h2>
            <p><b>{result.challengerUsername}</b> challenged <b>{result.claimantUsername}</b></p>
            <div className="revealed-cards">
                {result.revealedCards.map((card) => <span key={card.id}>{cardLabel(card)}</span>)}
            </div>
            <small>{result.penaltyRecipientUsername} takes the pile.</small>
        </div>
    );
}
