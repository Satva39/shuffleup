import React from "react";

export default function PlayerCardCount({ player }) {
    return <span className="sps-count-pill">{player.cardCount}</span>;
}
