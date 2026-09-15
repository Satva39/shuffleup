import React from "react";
import TeamScore from "./TeamScore";

export default function ScoreBoard({ players = [], scores = {}, bags = {} }) {
    const teamA = players.filter((player) => player.team === "A").map((player) => player.username);
    const teamB = players.filter((player) => player.team === "B").map((player) => player.username);

    return (
        <section className="spades-scoreboard">
            <TeamScore team="A" score={scores.A} bags={bags.A} players={teamA} />
            <div className="scoreboard-vs">VS</div>
            <TeamScore team="B" score={scores.B} bags={bags.B} players={teamB} />
        </section>
    );
}
