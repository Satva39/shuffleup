export default function BiddingPanel({ state, onBid, onPass }) {
    const myTurn = state.isMyTurn && state.phase === "bidding";
    return (
        <section className="twenty-nine-panel">
            <div className="twenty-nine-panel-title">Auction</div>
            <div className="twenty-nine-auction-summary">
                <span>Highest bid</span>
                <strong>{state.highestBid ?? "—"}</strong>
            </div>
            <div className="twenty-nine-bid-buttons">
                {state.legalBids?.map((bid) => (
                    <button key={bid} type="button" onClick={() => onBid(bid)} disabled={!myTurn}>{bid}</button>
                ))}
                <button type="button" className="ghost" onClick={onPass} disabled={!myTurn}>Pass</button>
            </div>
            <div className="twenty-nine-auction-list">
                {state.auctionHistory?.slice(-8).map((entry, index) => (
                    <div key={`${entry.playerId}-${index}`}>
                        <span>{entry.seat}</span>
                        <strong>{entry.type === "pass" ? "Pass" : entry.bid}</strong>
                    </div>
                ))}
            </div>
        </section>
    );
}
