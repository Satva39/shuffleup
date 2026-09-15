import { useMemo, useState } from "react";
import PlayingCard from "./PlayingCard";
import { RANKS, SUITS } from "../logic/cards";

function TrumpSelector({ gameState, userId, onCallPartner }) {
    const [rank, setRank] = useState("A");
    const [suit, setSuit] = useState("spades");

    const authorized =
        gameState.phase === "contract" &&
        gameState.napoleonId === userId;

    if (!authorized) return null;

    const submit = () => {
        onCallPartner({ rank, suit });
    };

    return (
        <section className="action-panel">
            <div className="panel-title">CALL YOUR ADJUTANT</div>
            <p className="waiting-copy">
                Name any card. The player holding it becomes your hidden partner.
            </p>

            <div className="called-card-preview">
                <PlayingCard card={{ id: `${suit}-${rank}`, rank, suit }} />
            </div>

            <div className="choice-grid">
                {RANKS.map((value) => (
                    <button
                        key={value}
                        type="button"
                        className={
                            rank === value
                                ? "choice active"
                                : "choice"
                        }
                        onClick={() => setRank(value)}
                    >
                        {value}
                    </button>
                ))}
            </div>

            <div className="suit-grid">
                {SUITS.map((item) => (
                    <button
                        type="button"
                        className={`suit-choice ${suit === item.key ? "active" : ""
                            }`}
                        key={item.key}
                        onClick={() => setSuit(item.key)}
                    >
                        <b>{item.symbol}</b>
                        <span>{item.name}</span>
                    </button>
                ))}
            </div>

            <button
                className="primary-action"
                type="button"
                onClick={submit}
            >
                CALL {rank}{SUITS.find((item) => item.key === suit)?.symbol}
            </button>
        </section>
    );
}

export default TrumpSelector;
