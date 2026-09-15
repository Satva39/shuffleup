import PlayingCard from "./PlayingCard";

function PlayerHand({
    closedCount,
    flippedCard,
    openCount,
    openTopCard,
    canFlip,
    canOpenPlay,
    onFlip,
    onOpenPlay,
}) {
    return (
        <div className="mangoose-hand">
            <div className="mangoose-hand-pile">
                <span className="mangoose-pile-label">
                    CLOSED PILE
                </span>

                <PlayingCard
                    hidden
                    onClick={onFlip}
                    disabled={!canFlip}
                />

                <strong>{closedCount}</strong>
            </div>

            <div className="mangoose-hand-flipped">
                <span className="mangoose-pile-label">
                    REVEALED CARD
                </span>

                {flippedCard ? (
                    <PlayingCard
                        card={flippedCard}
                        selected
                    />
                ) : (
                    <div className="mangoose-empty-slot">
                        Choose a card
                    </div>
                )}
            </div>

            <div
                className={`mangoose-own-pile ${canOpenPlay
                        ? "mangoose-own-pile-active"
                        : ""
                    }`}
                onClick={() => {
                    if (canOpenPlay) {
                        onOpenPlay();
                    }
                }}
                onKeyDown={(event) => {
                    if (
                        canOpenPlay &&
                        (event.key === "Enter" ||
                            event.key === " ")
                    ) {
                        event.preventDefault();
                        onOpenPlay();
                    }
                }}
                role="button"
                tabIndex={canOpenPlay ? 0 : -1}
                aria-disabled={!canOpenPlay}
            >
                <span className="mangoose-pile-label">
                    YOUR OPEN PILE
                </span>

                {openTopCard ? (
                    <PlayingCard
                        card={openTopCard}
                        small
                        disabled
                    />
                ) : (
                    <span className="mangoose-open-empty">
                        EMPTY
                    </span>
                )}

                <strong>{openCount}</strong>
            </div>
        </div>
    );
}

export default PlayerHand;
