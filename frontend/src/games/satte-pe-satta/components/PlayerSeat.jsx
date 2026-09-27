import React from "react";
import BotBadge from "../../../components/BotBadge";

export default function PlayerSeat({ player, active, isMe }) {
  return (
    <div
      className={`sps-player-seat ${active ? "sps-player-seat--active" : ""} ${isMe ? "sps-player-seat--me" : ""}`}
    >
      <div className="sps-seat-avatar">
        {player.username?.charAt(0)?.toUpperCase() || "?"}
      </div>
      <div className="sps-seat-copy">
        <strong>
          {isMe ? "You" : player.username}
          <BotBadge player={player} />
        </strong>
        <span>
          {player.cardCount} card{player.cardCount === 1 ? "" : "s"}
        </span>
      </div>
      {active && <span className="sps-turn-dot">TURN</span>}
    </div>
  );
}
