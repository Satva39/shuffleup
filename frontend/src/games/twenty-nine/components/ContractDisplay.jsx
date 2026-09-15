export default function ContractDisplay({ state }) {
    if (!state.contract) return <div className="twenty-nine-contract is-muted">Contract not set</div>;
    const bidder = state.players?.find((player) => player.id === state.contract.bidderId);
    return (
        <div className="twenty-nine-contract">
            <span className="twenty-nine-mini-label">Contract</span>
            <strong>{state.contract.bid} points</strong>
            <small>{bidder?.username || "Bidder"} · {state.contract.teamLabel}</small>
        </div>
    );
}
