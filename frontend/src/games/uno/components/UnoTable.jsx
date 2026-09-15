import PlayerSeat from "./PlayerSeat";
import DrawPile from "./DrawPile";
import DiscardPile from "./DiscardPile";
import TurnIndicator from "./TurnIndicator";
import { getCurrentPlayer } from "../logic/gameState";

function UnoTable({ gameState, localPlayerId, onDraw, canDraw, onCallUno }) {
    const currentPlayer = getCurrentPlayer(gameState);

    return (
        <div className={`uno-table uno-players-${gameState.players.length}`}>
            {gameState.players.map((player, index) => (
                <PlayerSeat
                    key={player.id}
                    player={player}
                    index={index}
                    total={gameState.players.length}
                    currentPlayerId={gameState.currentPlayerId}
                    localPlayerId={localPlayerId}
                    onCallUno={onCallUno}
                />
            ))}
            <div className="uno-center-area">
                <div className="uno-center-title">
                    <span>SHUFFLEUP</span>
                    <strong>UNO TABLE</strong>
                </div>
                <div className="uno-piles">
                    <DrawPile canDraw={canDraw} onDraw={onDraw} />
                    <DiscardPile card={gameState.discardTop} />
                </div>
                <TurnIndicator gameState={gameState} currentPlayer={currentPlayer} isMyTurn={gameState.currentPlayerId === localPlayerId} />
            </div>
        </div>
    );
}

export default UnoTable;
