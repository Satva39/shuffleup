import PlayerSeat from "./PlayerSeat";
import DrawArea from "./DrawArea";

function seatPosition(index, total) {
    const angle = (-90 + (360 / total) * index) * (Math.PI / 180);
    return {
        left: `${50 + Math.cos(angle) * 43}%`,
        top: `${50 + Math.sin(angle) * 40}%`,
    };
}

function JackThiefTable({ state, localPlayerId, onDraw }) {
    const total = state.players.length;
    const target = state.players.find((player) => player.id === state.targetPlayerId);
    const isMyTurn = state.currentPlayerId === localPlayerId && state.status === "playing";

    return (
        <section className="jt-table-wrap">
            <div className="jt-table">
                <div className="jt-table-rim" />
                <div className="jt-center">
                    <div className="jt-emblem">J</div>
                    <strong>JACK THIEF</strong>
                    <span>{state.status === "complete" ? "ROUND COMPLETE" : "KEEP YOUR MATCHES MOVING"}</span>
                </div>

                {state.players.map((player, index) => (
                    <div
                        key={player.id}
                        className="jt-seat-position"
                        style={seatPosition(index, total)}
                    >
                        <PlayerSeat
                            player={player}
                            active={player.id === state.currentPlayerId}
                            local={player.id === localPlayerId}
                            target={player.id === state.targetPlayerId}
                            onDraw={() => { }}
                        />
                    </div>
                ))}

                {target && (
                    <DrawArea
                        target={target}
                        canDraw={isMyTurn}
                        onDraw={onDraw}
                    />
                )}
            </div>
        </section>
    );
}

export default JackThiefTable;
