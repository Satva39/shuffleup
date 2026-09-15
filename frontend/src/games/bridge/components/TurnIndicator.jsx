import { SEAT_LABELS } from "../logic/gameState";

export default function TurnIndicator({ state }) {
    const actor = state.turnActorId === state.you.id ? "Your action" : `${SEAT_LABELS[state.currentSeat] || state.currentSeat}'s action`;
    return <div className="bridge-turn-indicator"><span>TURN</span><strong>{actor}</strong></div>;
}
