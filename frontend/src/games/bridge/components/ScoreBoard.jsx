export default function ScoreBoard({ state }) {
    const ns = state.result?.nsScore ?? 0;
    const ew = state.result?.ewScore ?? 0;
    return (
        <section className="bridge-scoreboard bridge-panel">
            <div><span>NS</span><strong>{ns}</strong></div>
            <div><span>EW</span><strong>{ew}</strong></div>
            <div><span>Tricks played</span><strong>{state.completedTricks}/13</strong></div>
        </section>
    );
}
