function BidPanel({
    cardsPerPlayer,
    currentBid,
    submitted,
    onBid,
    onBidConfirm,
}) {
    if (submitted) {
        return (
            <section className="kachuful-action-panel kachuful-bid-waiting">
                <div>
                    <span className="kachuful-eyebrow">YOUR BID</span>
                    <strong className="submitted-bid">{currentBid}</strong>
                    <small>Bid locked. Waiting for the other players…</small>
                </div>

                <div className="bid-locked-chip">
                    <i />
                    Submitted
                </div>
            </section>
        );
    }

    return (
        <section className="kachuful-action-panel">
            <div className="bid-panel-copy">
                <span className="kachuful-eyebrow">YOUR BID</span>
                <strong>How many tricks?</strong>
                <small>{cardsPerPlayer} cards this round</small>
            </div>

            <div className="bid-options" role="group" aria-label="Choose bid">
                {Array.from({ length: cardsPerPlayer + 1 }, (_, bid) => (
                    <button
                        key={bid}
                        type="button"
                        className={`bid-option ${currentBid === bid ? "is-selected" : ""}`}
                        aria-pressed={currentBid === bid}
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
                <b>→</b>
            </button>
        </section>
    );
}

export default BidPanel;
