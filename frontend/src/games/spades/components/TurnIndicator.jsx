import GameAnimation from "../../../components/game-animation/GameAnimation";
import { useGameAnimation } from "../../../hooks/useGameAnimation";
import { SEAT_LABELS } from "../logic/gameState";

export default function TurnIndicator({ seat, phase, spadesBroken }) {
  const label =
    phase === "bidding"
      ? `${SEAT_LABELS[seat] || seat} is bidding`
      : phase === "trick-play"
        ? `${SEAT_LABELS[seat] || seat} to play`
        : "Hand complete";
  const animationKey = useGameAnimation(`${seat || "none"}:${phase || "none"}`);

  return (
    <GameAnimation
      as="div"
      key={animationKey}
      variant="turn"
      className="spades-turn-indicator"
    >
      <div>
        <span className="eyebrow">TURN</span>
        <strong>{label}</strong>
      </div>
      <span className={`spades-state-pill ${spadesBroken ? "is-broken" : ""}`}>
        ♠ {spadesBroken ? "Broken" : "Unbroken"}
      </span>
    </GameAnimation>
  );
}
