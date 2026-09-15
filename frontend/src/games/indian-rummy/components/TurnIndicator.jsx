export default function TurnIndicator({ yourTurn, currentName }) {
    return <div className={`rummy-turn ${yourTurn ? "your" : ""}`}>
        {yourTurn ? "YOUR TURN" : `WAITING FOR ${currentName?.toUpperCase() || "PLAYER"}`}
    </div>;
}
