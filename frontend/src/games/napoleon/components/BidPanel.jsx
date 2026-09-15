import { useMemo, useState } from "react";
import { SUITS } from "../logic/cards";

function BidPanel({
    gameState,
    userId,
    onBid,
}) {
    const [amount, setAmount] = useState(11);
    const [suit, setSuit] = useState("clubs");

    const currentBid = gameState.currentBid;
    const canBid =
        gameState.phase === "bidding" &&
        gameState.currentPlayerId === userId;

    const legalAmounts = useMemo(() => {
        if (!currentBid) {
            return Array.from({ length: 10 }, (_, i) => i + 11);
        }

        return Array.from(
            { length: 10 - currentBid.amount },
            (_, i) => currentBid.amount + i + 1
        );
    }, [currentBid]);

    const submit = () => {
        onBid({ amount, suit });
    };

    if (gameState.phase !== "bidding") return null;

    return (
        <section className="action-panel">
            <div className="panel-title">BIDDING</div>
            <div className="bid-summary">
                <span>
                    CURRENT BID
                    <strong>
                        {currentBid
                            ? `${currentBid.amount} ${SUITS.find(
                                (item) =>
                                    item.key === currentBid.suit
                            )?.symbol
                            }`
                            : "NONE"}
                    </strong>
                </span>
                <span>
                    YOUR BID
                    <strong>
                        {gameState.yourBid
                            ? `${gameState.yourBid.amount} ${SUITS.find(
                                (item) =>
                                    item.key === gameState.yourBid.suit
                            )?.symbol
                            }`
                            : "—"}
                    </strong>
                </span>
            </div>

            {canBid ? (
                <>
                    <div className="choice-grid">
                        {legalAmounts.map((value) => (
                            <button
                                type="button"
                                className={
                                    value === amount
                                        ? "choice active"
                                        : "choice"
                                }
                                key={value}
                                onClick={() => setAmount(value)}
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

                    <div className="panel-actions">
                        <button
                            className="primary-action"
                            type="button"
                            onClick={submit}
                        >
                            CONFIRM BID
                        </button>
                        <button
                            className="secondary-action"
                            type="button"
                            onClick={() => onBid("pass")}
                        >
                            PASS
                        </button>
                    </div>
                </>
            ) : (
                <p className="waiting-copy">
                    {gameState.currentPlayerId === userId
                        ? "Your turn."
                        : "Waiting for the active bidder..."}
                </p>
            )}
        </section>
    );
}

export default BidPanel;
