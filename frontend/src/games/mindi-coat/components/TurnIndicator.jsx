import GameAnimation from "../../../components/game-animation/GameAnimation";
import { useGameAnimation } from "../../../hooks/useGameAnimation";
import { SEAT_LABELS } from "../logic/cards";

export default function TurnIndicator({ seat, phase, actorId, userId }) {
  const myTurn = actorId === userId;
  const animationKey = useGameAnimation(
    `${seat || "none"}:${phase || "none"}:${actorId || "none"}`,
  );
  return (
    <GameAnimation
      as="div"
      key={animationKey}
      variant="turn"
      className={`mindi-turn ${myTurn ? "mine" : ""}`}
    >
      <span>{phase === "trump-select" ? "HUKUM SELECTION" : "TURN"}</span>
      <strong>{SEAT_LABELS[seat] || "—"}</strong>
      <small>{myTurn ? "Your action" : "Waiting"}</small>
    </GameAnimation>
  );
}
