function PairDisplay({ pairs }) {
    if (!pairs?.length) return null;
    return (
        <div className="jt-pair-toast">
            <span>PAIR FOUND</span>
            {pairs.map((pair, index) => (
                <strong key={index}>
                    {pair.map((card) => `${card.rank}${card.symbol}`).join("  +  ")}
                </strong>
            ))}
        </div>
    );
}

export default PairDisplay;
