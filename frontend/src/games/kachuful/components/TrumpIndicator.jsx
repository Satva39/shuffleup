function TrumpIndicator({ trump }) {
    if (!trump) return null;

    const isRed = trump.suit === "hearts" || trump.suit === "diamonds";

    return (
        <div className="kachuful-trump-display">
            <span className="kachuful-eyebrow">TRUMP</span>
            <div className="trump-main">
                <span className={`trump-symbol ${isRed ? "is-red" : "is-black"}`}>
                    {trump.symbol}
                </span>
                <div>
                    <strong>{trump.english}</strong>
                    <small>{trump.kachuful}</small>
                </div>
            </div>
        </div>
    );
}

export default TrumpIndicator;
