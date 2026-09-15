function TrumpIndicator({ trump }) {
    if (!trump) return null;

    return (
        <div className="kachuful-trump">
            <span className="trump-label">
                TRUMP
            </span>

            <span
                className={`trump-symbol ${trump.suit === "hearts" ||
                        trump.suit === "diamonds"
                        ? "trump-red"
                        : "trump-black"
                    }`}
            >
                {trump.symbol}
            </span>

            <strong>
                {trump.kachuful}
            </strong>

            <small>
                {trump.english}
            </small>
        </div>
    );
}

export default TrumpIndicator;