function BidPanel({
    cardsPerPlayer,
    currentBid,
    submitted,
    onBid,
    onBidConfirm,
}) {
    if (submitted) {
        return (
            <div className="kachuful-bid-panel">
                <span className="bid-label">
                    YOUR BID
                </span>

                <strong className="submitted-bid">
                    {currentBid}
                </strong>

                <small>
                    Waiting for other players...
                </small>
            </div>
        );
    }

    return (
        <div className="kachuful-bid-panel">
            <span className="bid-label">
                YOUR BID
            </span>

            <div className="bid-options">
                {Array.from(
                    { length: cardsPerPlayer + 1 },
                    (_, bid) => (
                        <button
                            key={bid}
                            type="button"
                            className={
                                currentBid === bid
                                    ? "bid-option bid-selected"
                                    : "bid-option"
                            }
                            onClick={() => onBid(bid)}
                        >
                            {bid}
                        </button>
                    )
                )}
            </div>

            <button
                type="button"
                className="bid-confirm"
                disabled={currentBid === null}
                onClick={onBidConfirm}
            >
                CONFIRM BID
            </button>

            <small>
                Predict how many tricks you will win.
            </small>
        </div>
    );
}

export default BidPanel;