import PlayingCard from "./PlayingCard";

export default function BattleArea({ state }) {
    const cards = state?.revealedCards || [];
    const isResult = state.phase === "battle-result";
    return (
        <section className={`war-battle-area ${state.phase === "war" || state.phase === "war-reveal" ? "is-war" : ""}`}>
            <div className="war-battle-heading">
                <span>{state.phase === "war" || state.phase === "war-reveal" ? "WAR" : `BATTLE ${state.battleCount || 1}`}</span>
                {state.warDepth > 0 && <em>WAR {state.warDepth}</em>}
            </div>
            <div className="war-battle-cards">
                {state.players.map((player) => {
                    const revealed = cards.find((item) => item.playerId === player.id)?.card;
                    return (
                        <div className="war-reveal-slot" key={player.id}>
                            <span>{player.id === state.playerId ? "YOU" : player.username}</span>
                            {revealed ? <PlayingCard card={revealed} featured={true} /> : <PlayingCard hidden={true} featured={true} />}
                        </div>
                    );
                })}
            </div>
            {state.faceDownCount > 0 && <div className="war-face-down-note">{state.faceDownCount} face-down {state.faceDownCount === 1 ? "card" : "cards"} in the battle</div>}
            {isResult && state.result?.winnerName && <div className="war-battle-result-copy">{state.result.winnerId === state.playerId ? "YOU WIN THE BATTLE" : `${state.result.winnerName.toUpperCase()} WINS THE BATTLE`}</div>}
        </section>
    );
}
