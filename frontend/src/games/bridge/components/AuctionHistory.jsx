import { auctionEntryLabel } from "../logic/bidding";

export default function AuctionHistory({ auction = [] }) {
    return (
        <div className="bridge-auction-history">
            {auction.length === 0 ? (
                <div className="bridge-empty">Auction has not started.</div>
            ) : auction.map((entry, index) => (
                <div key={`${entry.playerId}-${index}`} className="bridge-auction-entry">
                    <span>{entry.seat}</span>
                    <strong>{auctionEntryLabel(entry)}</strong>
                </div>
            ))}
        </div>
    );
}
