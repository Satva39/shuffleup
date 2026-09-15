function BidPanel({ cardsPerPlayer, currentBid, submitted, onBid, onBidConfirm }) {
    return (
        <aside className="kachuful-bid-panel">
            <div className="bid-panel-heading">
                <div>
                    <span className="panel-kicker">YOUR BID</span>
                    <strong>{submitted ? `Bid ${currentBid}` : "How many tricks?"}</strong>
                </div>
                <div className="bid-count-badge">{cardsPerPlayer} cards</div>
            </div>

            {submitted ? (
                <div className="bid-submitted-state">
                    <div className="submitted-number">{currentBid}</div>
                    <div>
                        <strong>Bid locked</strong>
                        <span>Waiting for the table to finish bidding…</span>
                    </div>
                </div>
            ) : (
                <>
                    <div className="bid-options" role="group" aria-label="Choose bid">
                        {Array.from({ length: cardsPerPlayer + 1 }, (_, bid) => (
                            <button
                                key={bid}
                                type="button"
                                className={currentBid === bid ? "bid-option bid-selected" : "bid-option"}
                                onClick={() => onBid(bid)}
                                aria-pressed={currentBid === bid}
                            >
                                {bid}
                            </button>
                        ))}
                    </div>
                    <button className="primary-action bid-confirm" type="button" disabled={currentBid === null} onClick={onBidConfirm}>
                        <span>Confirm bid</span>
                        <span aria-hidden="true">→</span>
                    </button>
                </>
            )}
        </aside>
    );
}

export default BidPanel;
