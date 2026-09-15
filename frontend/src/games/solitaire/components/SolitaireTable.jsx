import { useMemo, useState } from "react";
import PlayingCard from "./PlayingCard";
import TableauColumn from "./TableauColumn";
import Foundation from "./Foundation";
import GameTimer from "./GameTimer";
import OpponentList from "./OpponentList";
import GameResult from "./GameResult";

const SUITS = ["S", "H", "D", "C"];
const SUIT_SYMBOLS = {
    S: "♠",
    H: "♥",
    D: "♦",
    C: "♣",
};

export default function SolitaireTable({
    state,
    error,
    connected,
    onMove,
    onDraw,
    onLobby,
}) {
    const [selection, setSelection] = useState(null);

    const me = state.player;
    const publicPlayers = state.players || [];

    const selectedCard = useMemo(() => {
        if (!selection || !me) return null;

        if (selection.type === "waste") {
            return me.waste?.[me.waste.length - 1] || null;
        }

        return me.tableau?.[selection.columnIndex]?.[selection.cardIndex] || null;
    }, [me, selection]);

    function clearSelection() {
        setSelection(null);
    }

    function selectOrMove(destination) {
        if (!selection) {
            setSelection(destination);
            return;
        }

        if (
            selection.type === destination.type &&
            selection.columnIndex === destination.columnIndex &&
            selection.cardIndex === destination.cardIndex
        ) {
            clearSelection();
            return;
        }

        if (destination.type === "tableau") {
            onMove({
                from: selection,
                to: {
                    type: "tableau",
                    columnIndex: destination.columnIndex,
                },
            });
            clearSelection();
            return;
        }

        if (destination.type === "foundation") {
            onMove({
                from: selection,
                to: { type: "foundation" },
            });
            clearSelection();
        }
    }

    function handleTableauCard(columnIndex, cardIndex, card) {
        if (!card?.faceUp) {
            return;
        }

        selectOrMove({
            type: "tableau",
            columnIndex,
            cardIndex,
        });
    }

    function handleEmptyColumn(columnIndex) {
        if (!selection) return;

        selectOrMove({
            type: "tableau",
            columnIndex,
            cardIndex: 0,
        });
    }

    function handleWaste() {
        if (!me.waste?.length) return;

        selectOrMove({
            type: "waste",
        });
    }

    const completed = me.status === "COMPLETE";
    const canPlay = connected && !completed && state.status === "playing";

    return (
        <main className="solitaire-page">
            <div className="solitaire-shell">
                <header className="solitaire-header">
                    <div>
                        <span className="solitaire-eyebrow">
                            SHUFFLEUP · GAME 15
                        </span>
                        <h1>Solitaire</h1>
                        <p>Klondike · Draw 1 · Competitive race</p>
                    </div>

                    <div className="header-controls">
                        <div className={`connection-pill ${connected ? "online" : "offline"}`}>
                            {connected ? "CONNECTED" : "RECONNECTING"}
                        </div>

                        <GameTimer
                            startedAt={me.startedAt}
                            completionSeconds={me.completionSeconds}
                            completed={completed}
                        />
                    </div>
                </header>

                {error && (
                    <div className="solitaire-error">
                        <span>{error}</span>
                        <button type="button" onClick={() => window.location.reload()}>
                            Refresh
                        </button>
                    </div>
                )}

                <div className="solitaire-layout">
                    <section className="solitaire-board">
                        <div className="board-top">
                            <div className="stock-waste">
                                <button
                                    type="button"
                                    className={`stock-slot ${me.stockCount ? "" : "empty"}`}
                                    onClick={canPlay ? onDraw : undefined}
                                    disabled={!canPlay}
                                    aria-label={me.stockCount ? "Draw from stock" : "Redeal stock"}
                                >
                                    {me.stockCount ? (
                                        <span className="stock-back">
                                            <span />
                                        </span>
                                    ) : (
                                        <span className="redeal-mark">↻</span>
                                    )}
                                </button>

                                <button
                                    type="button"
                                    className="waste-slot"
                                    onClick={canPlay ? handleWaste : undefined}
                                    aria-label="Select waste"
                                    disabled={!canPlay || !me.waste?.length}
                                >
                                    {me.waste?.length ? (
                                        <PlayingCard
                                            card={me.waste[me.waste.length - 1]}
                                            selected={selection?.type === "waste"}
                                        />
                                    ) : (
                                        <span className="pile-label">WASTE</span>
                                    )}
                                </button>

                                <div className="stock-meta">
                                    <span>{me.stockCount} stock</span>
                                    <span>{me.redeals} redeals</span>
                                </div>
                            </div>

                            <div className="foundations">
                                {SUITS.map((suit) => (
                                    <Foundation
                                        key={suit}
                                        suit={SUIT_SYMBOLS[suit]}
                                        pile={me.foundations?.[suit]}
                                        onClick={() =>
                                            selectOrMove({
                                                type: "foundation",
                                            })
                                        }
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="board-stats">
                            <span>FOUNDATION <strong>{me.progress}/52</strong></span>
                            <span>MOVES <strong>{me.moves}</strong></span>
                            <span>SCORE <strong>{me.score}</strong></span>
                        </div>

                        <div className="tableau">
                            {me.tableau.map((column, index) => (
                                <TableauColumn
                                    key={`column-${index}`}
                                    column={column}
                                    columnIndex={index}
                                    selection={selection}
                                    onCardClick={handleTableauCard}
                                    onEmptyClick={handleEmptyColumn}
                                />
                            ))}
                        </div>

                        <div className={`selection-hint ${selectedCard ? "visible" : ""}`}>
                            {selectedCard
                                ? `${selectedCard.rank}${selectedCard.symbol} selected — tap a destination`
                                : "Select a face-up card or stack, then select a destination"}
                        </div>
                    </section>

                    <OpponentList
                        players={publicPlayers}
                        playerId={state.playerId}
                    />
                </div>

                <footer className="solitaire-footer">
                    <span>Standard Klondike · unlimited redeals</span>
                    <span>Your board is private; opponents see progress only.</span>
                </footer>
            </div>

            {state.status === "complete" && (
                <GameResult
                    rankings={state.rankings}
                    onLobby={onLobby}
                />
            )}
        </main>
    );
}
