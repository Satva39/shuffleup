import GameAnimation from "../../../components/game-animation/GameAnimation";
import { useGameAnimation } from "../../../hooks/useGameAnimation";

function TurnIndicator({ currentPlayer, isYourTurn }) {
  const animationKey = useGameAnimation(
    `${currentPlayer?.id || "none"}:${isYourTurn}`,
  );
  return (
    <GameAnimation
      as="div"
      key={animationKey}
      variant="turn"
      className={`kachuful-turn-indicator ${isYourTurn ? "is-mine" : ""}`}
    >
      <i />
      <div>
        <span>{isYourTurn ? "YOUR TURN" : "CURRENT TURN"}</span>
        <strong>
          {isYourTurn
            ? "Play when ready"
            : `${currentPlayer?.username || "Player"} is playing`}
        </strong>
      </div>
    </GameAnimation>
  );
}

export default TurnIndicator;
