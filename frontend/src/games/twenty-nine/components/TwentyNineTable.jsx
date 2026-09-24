import PlayerSeat from "./PlayerSeat";
import PlayerHand from "./PlayerHand";
import TrickArea from "./TrickArea";
import BiddingPanel from "./BiddingPanel";
import AuctionHistory from "./AuctionHistory";
import TrumpDisplay from "./TrumpDisplay";
import ScoreBoard from "./ScoreBoard";
import TurnIndicator from "./TurnIndicator";
import TrickCounter from "./TrickCounter";
import ContractDisplay from "./ContractDisplay";
import GameStatus from "./GameStatus";
import HandResult from "./HandResult";
import GameResult from "./GameResult";
import { trumpOptions } from "../logic/trump";

export default function TwentyNineTable({
  state,
  error,
  connected,
  submitBid,
  selectTrump,
  playCard,
  nextHand,
  user,
}) {
  const players = state.players || [];
  const bySeat = Object.fromEntries(
    players.map((player) => [player.seat, player]),
  );
  const me = players.find((player) => player.id === user?.id);
  const canChooseTrump =
    state.phase === "trump-selection" && state.canSelectTrump;
  const completed = state.completedTricks?.[state.completedTricks.length - 1];

  return (
    <main className="twenty-nine-page">
      <div className="twenty-nine-shell">
        <header className="twenty-nine-topbar">
          <div>
            <span className="twenty-nine-brand">SHUFFLEUP</span>
            <h1>Twenty-Nine</h1>
            <p>Partnership trick-taking · Room {state.roomCode}</p>
          </div>
          <div className="twenty-nine-top-meta">
            <TurnIndicator state={state} />
            <span
              className={`twenty-nine-connection ${connected ? "online" : "offline"}`}
            >
              {connected ? "Connected" : "Reconnecting…"}
            </span>
          </div>
        </header>

        <ScoreBoard state={state} />
        <GameStatus state={state} error={error} />

        <section className="twenty-nine-table-wrap">
          <div className="twenty-nine-table">
            <div className="twenty-nine-felt-glow" />
            <PlayerSeat
              player={bySeat.N}
              position="north"
              isCurrent={state.currentSeat === "N"}
              isSelf={bySeat.N?.id === user?.id}
            />
            <PlayerSeat
              player={bySeat.W}
              position="west"
              isCurrent={state.currentSeat === "W"}
              isSelf={bySeat.W?.id === user?.id}
            />
            <PlayerSeat
              player={bySeat.E}
              position="east"
              isCurrent={state.currentSeat === "E"}
              isSelf={bySeat.E?.id === user?.id}
            />

            <section className="twenty-nine-center">
              <div className="twenty-nine-center-top">
                <TrickCounter state={state} />
                <TrumpDisplay state={state} />
                <ContractDisplay state={state} />
              </div>
              <TrickArea
                trick={state.trick}
                players={players}
                completedTricks={state.completedTricks}
              />
              {completed && state.trick.length === 0 && (
                <div className="twenty-nine-last-winner">
                  Last trick: {completed.winnerSeat} won
                </div>
              )}
            </section>

            <section className="twenty-nine-south-zone">
              <PlayerSeat
                player={bySeat.S}
                position="south-seat"
                isCurrent={state.currentSeat === "S"}
                isSelf={bySeat.S?.id === user?.id}
              />

              <div className="twenty-nine-my-area">
                <div className="twenty-nine-my-label">
                  Your hand · {bySeat.S?.team === "A" ? "Team A" : "Team B"}
                </div>

                <PlayerHand
                  cards={state.myHand}
                  legalCardIds={state.legalCardIds}
                  isMyTurn={state.isMyTurn}
                  disabled={!connected}
                  onPlayCard={playCard}
                />
              </div>
            </section>
          </div>
        </section>

        <section className="twenty-nine-controls">
          {state.phase === "bidding" && (
            <BiddingPanel
              state={state}
              onBid={submitBid}
              onPass={() => submitBid(null)}
            />
          )}
          {canChooseTrump && (
            <section className="twenty-nine-panel trump-picker">
              <div className="twenty-nine-panel-title">Choose your trump</div>
              <p>Only you see the suit until a trump card is played.</p>
              <div className="twenty-nine-trump-options">
                {trumpOptions.map((option) => (
                  <button
                    key={option.suit}
                    type="button"
                    onClick={() => selectTrump(option.suit)}
                  >
                    <span>{option.symbol}</span>
                    {option.label}
                  </button>
                ))}
              </div>
            </section>
          )}
          <div className="twenty-nine-side-panels">
            <AuctionHistory history={state.auctionHistory} />
            <HandResult state={state} />
          </div>
        </section>

        <GameResult state={state} onNextHand={nextHand} />
      </div>
    </main>
  );
}
