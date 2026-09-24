import GameAnimation from "../../../components/game-animation/GameAnimation";
import { useGameAnimation } from "../../../hooks/useGameAnimation";

function TurnIndicator({ yourTurn, currentPlayerName, phase }) {
  const animationKey = useGameAnimation(
    `${currentPlayerName || "none"}:${phase || "none"}:${yourTurn}`,
  );
  return (
    <GameAnimation
      as="div"
      key={animationKey}
      variant="turn"
      className={`turn-indicator ${yourTurn ? "your-turn" : ""}`}
    >
      <small>{phase}</small>
      <strong>
        {yourTurn
          ? "YOUR TURN"
          : `WAITING FOR ${currentPlayerName?.toUpperCase()}`}
      </strong>
    </GameAnimation>
  );
}

export default TurnIndicator;
