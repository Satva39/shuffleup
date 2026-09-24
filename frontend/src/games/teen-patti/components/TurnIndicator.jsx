import GameAnimation from "../../../components/game-animation/GameAnimation";
import { useGameAnimation } from "../../../hooks/useGameAnimation";

function TurnIndicator({ isMyTurn, currentPlayer }) {
  const animationKey = useGameAnimation(
    `${currentPlayer?.id || "none"}:${isMyTurn}`,
  );

  if (isMyTurn) {
    return (
      <GameAnimation
        as="div"
        key={animationKey}
        variant="turn"
        className="teen-turn-indicator teen-my-turn"
      >
        YOUR TURN
      </GameAnimation>
    );
  }

  if (!currentPlayer) {
    return null;
  }

  return (
    <GameAnimation
      as="div"
      key={animationKey}
      variant="turn"
      className="teen-turn-indicator"
    >
      WAITING FOR <strong>{currentPlayer.username}</strong>
    </GameAnimation>
  );
}

export default TurnIndicator;
