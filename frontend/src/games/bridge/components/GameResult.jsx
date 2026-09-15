import { formatScore } from "../logic/scoring";

export default function GameResult({ state, onNextDeal }) {
    if (state.status !== "round-complete" || !state.result) return null;
    if (state.result.passedOut) {
        return (
            <section className="bridge-result bridge-panel">
                <span className="bridge-eyebrow">DEAL RESULT</span>
                <h2>Passed Out</h2>
                <p>No contract was reached on deal {state.result.dealNumber}.</p>
                <button type="button" onClick={onNextDeal}>Start Next Deal</button>
            </section>
        );
    }
    const declarerMade = state.result.made;
    return (
        <section className="bridge-result bridge-panel">
            <span className="bridge-eyebrow">DEAL RESULT</span>
            <h2>{state.result.contractLabel} · {declarerMade ? "Made" : "Down"}</h2>
            <p>{state.result.madeTricks} tricks won · {formatScore(state.result.score)} to the declaring side.</p>
            <p>Required {state.result.requiredTricks} tricks · vulnerability: {state.result.vulnerable ? "yes" : "no"}.</p>
            <button type="button" onClick={onNextDeal}>Start Next Deal</button>
        </section>
    );
}
