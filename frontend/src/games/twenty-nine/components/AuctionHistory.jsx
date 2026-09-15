export default function AuctionHistory({ history = [] }) {
    return (
        <div className="twenty-nine-auction-history">
            <span className="twenty-nine-mini-label">Auction History</span>
            <div>{history.map((item, index) => <span key={`${item.playerId}-${index}`}>{item.seat} {item.type === "pass" ? "P" : item.bid}</span>)}</div>
        </div>
    );
}
