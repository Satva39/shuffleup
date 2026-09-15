import React from "react";

export default function PenaltyNotice({ result, localPlayerId }) {
    if (!result) return null;
    const yours = result.penaltyRecipientId === localPlayerId;
    return (
        <div className="bluff-penalty-notice">
            {yours ? "YOU TAKE THE PILE" : `${result.penaltyRecipientUsername} takes the pile`}
        </div>
    );
}
