export default function CardStack({ count }) {
    const layers = Math.min(5, Math.ceil(count / 6));
    return (
        <div className="war-stack" aria-label={`${count} cards remaining`}>
            {Array.from({ length: Math.max(1, layers) }).map((_, index) => (
                <div key={index} className="war-stack-card"><span>♠</span></div>
            ))}
            <strong>{count}</strong>
        </div>
    );
}
