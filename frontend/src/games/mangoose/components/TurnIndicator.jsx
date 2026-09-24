import GameAnimation from "../../../components/game-animation/GameAnimation";
import { useGameAnimation } from "../../../hooks/useGameAnimation";

function TurnIndicator({
  isMyTurn,
  currentPlayer,
  pendingMongoose,
  isMongooseOffender,
}) {
  const animationKey = useGameAnimation(
    `${currentPlayer?.id || "none"}:${isMyTurn}:${pendingMongoose?.offenderUsername || "none"}`,
  );

  if (pendingMongoose) {
    return (
      <GameAnimation
        as="div"
        key={animationKey}
        variant="turn"
        className="mangoose-turn mangoose-turn-warning"
      >
        {isMongooseOffender
          ? "WAITING FOR MONGOOSE CALL"
          : `MONGOOSE CALL — ${pendingMongoose.offenderUsername}`}
      </GameAnimation>
    );
  }

  return (
    <GameAnimation
      as="div"
      key={animationKey}
      variant="turn"
      className={`mangoose-turn ${isMyTurn ? "mangoose-turn-mine" : ""}`}
    >
      {isMyTurn
        ? "YOUR TURN"
        : `WAITING FOR ${currentPlayer?.username || "PLAYER"}`}
    </GameAnimation>
  );
}

export default TurnIndicator;
