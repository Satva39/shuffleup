function TrumpIndicator({ trump }) {
    if (!trump) return null;
    const isRed = trump.suit === "hearts" || trump.suit === "diamonds";

    return (
        <div className="kachuful-trump context-card">
            <div className="trump-icon-wrap">
                <span className={isRed ? "trump-symbol trump-red" : "trump-symbol trump-black"}>{trump.symbol}</span>
            </div>
            <div className="context-copy">
                <span>TRUMP</span>
                <strong>{trump.kachuful}</strong>
                <small>{trump.english}</small>
            </div>
        </div>
    );
}

export default TrumpIndicator;
