function BidPanel({
    cardsPerPlayer,
    currentBid,
    submitted,
    onBid,
    onBidConfirm,
}) {
    if (submitted) {
        return (
            <div className="kachuful-bid-panel bid-submitted-panel">
                <div className="bid-panel-copy">
                    <span className="bid-label">BID LOCKED</span>
                    <strong className="submitted-bid">{currentBid}</strong>
                    <small>Waiting for the other players to finish bidding.</small>
                </div>
                <div className="bid-progress-mark" aria-hidden="true">✓</div>
            </div>
        );
    }

    const maxBid = Math.max(0, Number(cardsPerPlayer) || 0);

    return (
        <div className="kachuful-bid-panel">
            <div className="bid-panel-heading">
                <div>
                    <span className="bid-label">YOUR BID</span>
                    <h2>How many tricks?</h2>
                </div>
                <span className="bid-round-chip">{maxBid} cards</span>
            </div>

            <div className="bid-options" role="group" aria-label="Choose bid">
                {Array.from({ length: maxBid + 1 }, (_, bid) => (
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
                ))}
            </div>

            <button
                type="button"
                className="bid-confirm"
                disabled={currentBid === null}
                onClick={onBidConfirm}
            >
                <span>Confirm bid</span>
                <span aria-hidden="true">→</span>
            </button>
        </div>
    );
}

export default BidPanel;
