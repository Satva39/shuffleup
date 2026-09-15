import React from "react";
import PlayerCardCount from "./PlayerCardCount";

export default function PlayerSeat({ player, viewerId, active }) {
    if (!player) return null;
    const isYou = player.id === viewerId;
    return (
        <article className={`bluff-seat ${active ? "active" : ""} ${isYou ? "you" : ""} ${!player.connected ? "offline" : ""}`}>
            <div className="bluff-seat-avatar">{isYou ? "YOU" : player.username?.slice(0, 1)?.toUpperCase()}</div>
            <div className="bluff-seat-copy">
                <strong>{isYou ? "You" : player.username}</strong>
                <span>Seat {player.seat + 1}</span>
            </div>
            <PlayerCardCount count={player.cardCount} />
        </article>
    );
}
