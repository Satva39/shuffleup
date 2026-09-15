import { STRAINS } from "../logic/bidding";
import { auctionEntryLabel } from "../logic/bidding";

export default function BiddingPanel({ state, onBid }) {
    if (state.phase !== "auction") return null;
    return (
        <section className="bridge-panel bridge-bidding-panel">
            <div className="bridge-panel-head">
                <div>
                    <span className="bridge-eyebrow">AUCTION</span>
                    <h2>Call your bid</h2>
                </div>
                <span className="bridge-turn-pill">{state.currentSeat === state.you.seat ? "Your turn" : `${state.currentSeat} to bid`}</span>
            </div>
            <div className="bridge-current-bid">
                <span>Current highest</span>
                <strong>{state.highestBid ? `${state.highestBid.level}${state.highestBid.strain === "NT" ? "NT" : state.highestBid.strain}` : "Pass"}</strong>
            </div>
            <div className="bridge-bid-grid">
                {state.legalBidOptions.map((bid) => (
                    <button key={`${bid.level}-${bid.strain}`} type="button" onClick={() => onBid({ type: "bid", ...bid })}>
                        {bid.level}{bid.strain === "NT" ? "NT" : bid.strain}
                    </button>
                ))}
            </div>
            <div className="bridge-secondary-actions">
                <button type="button" className="secondary" onClick={() => onBid({ type: "pass" })}>Pass</button>
                <button type="button" className="secondary" disabled={!state.canDouble} onClick={() => onBid({ type: "double" })}>Double</button>
                <button type="button" className="secondary" disabled={!state.canRedouble} onClick={() => onBid({ type: "redouble" })}>Redouble</button>
            </div>
            <div className="bridge-call-guide">{STRAINS.map((strain) => <span key={strain}>{strain === "NT" ? "NT" : auctionEntryLabel({ type: "bid", bid: { level: 1, strain } })}</span>)}</div>
        </section>
    );
}
