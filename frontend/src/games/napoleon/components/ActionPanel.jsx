import { useState } from "react";
import PlayingCard from "./PlayingCard";

function ActionPanel({
    gameState,
    userId,
    onDiscard,
    onNextRound,
}) {
    const [selected, setSelected] = useState([]);

    if (gameState.phase === "blind" && gameState.napoleonId === userId) {
        const allCards = [
            ...(gameState.yourCards || []),
            ...(gameState.yourBlind || []),
        ];

        function toggle(card) {
            setSelected((current) =>
                current.includes(card.id)
                    ? current.filter((id) => id !== card.id)
                    : current.length < 2
                        ? [...current, card.id]
                        : current
            );
        }

        return (
            <section className="action-panel blind-panel">
                <div className="panel-title">BLIND & DISCARD</div>
                <p className="waiting-copy">
                    Two blind cards were added privately to your hand. Select exactly two cards to discard.
                </p>
                <div className="blind-cards">
                    {allCards.map((card) => (
                        <PlayingCard
                            key={card.id}
                            card={card}
                            selected={selected.includes(card.id)}
                            onClick={() => toggle(card)}
                        />
                    ))}
                </div>
                <button
                    className="primary-action"
                    type="button"
                    disabled={selected.length !== 2}
                    onClick={() => onDiscard(selected)}
                >
                    DISCARD 2 & START PLAY
                </button>
            </section>
        );
    }

    if (gameState.phase === "round-complete") {
        return (
            <section className="action-panel result-panel">
                <div className="panel-title">ROUND COMPLETE</div>
                <h3>
                    {gameState.roundResult?.success
                        ? "Contract Made"
                        : "Contract Failed"}
                </h3>
                <p>
                    Team points:{" "}
                    <strong>{gameState.roundResult?.teamPoints}</strong>{" "}
                    / {gameState.roundResult?.target}
                </p>
                <button
                    className="primary-action"
                    type="button"
                    onClick={onNextRound}
                >
                    {gameState.round >= gameState.totalRounds
                        ? "SHOW FINAL RESULT"
                        : "NEXT ROUND"}
                </button>
            </section>
        );
    }

    return null;
}

export default ActionPanel;
