function TurnIndicator({ gameState, currentPlayer, isMyTurn }) {
  if (!gameState) return null;
  return (
    <div className={`uno-turn-indicator ${isMyTurn ? "uno-turn-me" : ""}`}>
      <span className="uno-turn-pulse" />
      <div>
        <strong>
          {isMyTurn
            ? "YOUR TURN"
            : `${currentPlayer?.username || "Player"}'S TURN`}
        </strong>
        <small>
          {gameState.direction === -1 ? "COUNTER-CLOCKWISE" : "CLOCKWISE"}
        </small>
      </div>
    </div>
  );
}

export default TurnIndicator;
