export default function TrickCounter({ state }) {
    return <div className="twenty-nine-trick-counter">Trick {Math.min((state.completedTricks?.length || 0) + 1, 8)} / 8</div>;
}
