import { PHASE_LABELS } from "../logic/rules";

export default function GameStatus({ state, connected }) {
    return (
        <div className="war-statusbar">
            <div><span className="war-status-label">STATUS</span><strong>{state.status === "complete" ? "GAME COMPLETE" : PHASE_LABELS[state.phase] || state.phase}</strong></div>
            <div><span className="war-status-label">BATTLE</span><strong>#{state.battleCount || 0}</strong></div>
            <div><span className="war-status-label">CONNECTION</span><strong>{connected ? "CONNECTED" : "RECONNECTING"}</strong></div>
        </div>
    );
}
