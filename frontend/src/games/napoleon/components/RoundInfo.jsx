import GameAnimation from "../../../components/game-animation/GameAnimation";
import { useGameAnimation } from "../../../hooks/useGameAnimation";

function RoundInfo({ gameState }) {
  const animationKey = useGameAnimation(
    `${gameState.round || 0}:${gameState.completedTrickCount || 0}`,
  );
  return (
    <GameAnimation
      as="div"
      key={animationKey}
      variant="round"
      className="round-info"
    >
      <div>
        <span>CONTRACT</span>
        <strong>
          {gameState.contract
            ? `${gameState.contract.amount} ${gameState.contract.suitSymbol}`
            : "—"}
        </strong>
      </div>
      <div>
        <span>NAPOLEON</span>
        <strong>
          {gameState.players.find(
            (player) => player.id === gameState.napoleonId,
          )?.username || "—"}
        </strong>
      </div>
      <div>
        <span>TRICKS</span>
        <strong>{gameState.completedTrickCount}/10</strong>
      </div>
    </GameAnimation>
  );
}

export default RoundInfo;
