import TeamScore from "./TeamScore";

export default function ScoreBoard({ state }) {
    return (
        <section className="twenty-nine-scoreboard">
            <TeamScore team="A" score={state.scores?.A} tricks={state.tricks?.A} bidTeam={state.bidTeam} bid={state.highestBid} />
            <TeamScore team="B" score={state.scores?.B} tricks={state.tricks?.B} bidTeam={state.bidTeam} bid={state.highestBid} />
            <div className="twenty-nine-score-target">First to {state.targetScore}</div>
        </section>
    );
}
