import { getPhaseTitle } from "../logic/gameState";

function GameStatus({ gameState }) {
    return (
        <div className="game-status">
            <span>ROUND {gameState.round}/{gameState.totalRounds}</span>
            <strong>{getPhaseTitle(gameState.phase)}</strong>
            {gameState.trump && (
                <span>
                    TRUMP {gameState.trump.symbol} {gameState.trump.name}
                </span>
            )}
        </div>
    );
}

export default GameStatus;
