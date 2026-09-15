export default function WarIndicator({ state }) {
    const isWar = state.phase === "war" || state.phase === "war-reveal";
    if (!isWar) return null;
    return (
        <div className="war-indicator" role="status">
            <strong>WAR!</strong>
            <span>{state.warDepth > 1 ? `DOUBLE WAR · ${state.warDepth}×` : "One face-down card, then reveal"}</span>
        </div>
    );
}
