import PlayingCard from "./PlayingCard";
import { SUIT_SYMBOLS } from "../logic/cards";

function TrickArea({
    centerStacks,
    legalTargets,
    onCenterTarget,
}) {
    return (
        <section className="mangoose-center-area">
            <div className="mangoose-center-title">
                <span>SHUFFLEUP</span>
                <strong>MONGOOSE</strong>
            </div>

            <div className="mangoose-center-stacks">
                {centerStacks.map((stack) => {
                    const canPlay =
                        legalTargets.center.includes(
                            stack.suit
                        );

                    const topCard =
                        stack.topCard;

                    return (
                        <div
                            key={stack.suit}
                            className={`mangoose-center-stack ${canPlay
                                    ? "mangoose-target"
                                    : ""
                                } ${!topCard
                                    ? "mangoose-center-empty"
                                    : ""
                                }`}
                            onClick={() => {
                                if (canPlay) {
                                    onCenterTarget(
                                        stack.suit
                                    );
                                }
                            }}
                            role="button"
                            tabIndex={canPlay ? 0 : -1}
                            aria-disabled={!canPlay}
                            onKeyDown={(event) => {
                                if (
                                    canPlay &&
                                    (event.key === "Enter" ||
                                        event.key === " ")
                                ) {
                                    event.preventDefault();
                                    onCenterTarget(stack.suit);
                                }
                            }}
                        >
                            {topCard ? (
                                <PlayingCard
                                    card={topCard}
                                />
                            ) : (
                                <span className="mangoose-empty-foundation">
                                    A
                                    <span>
                                        {
                                            SUIT_SYMBOLS[
                                            stack.suit
                                            ]
                                        }
                                    </span>
                                </span>
                            )}

                            <span>
                                {stack.cardCount}
                            </span>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

export default TrickArea;
