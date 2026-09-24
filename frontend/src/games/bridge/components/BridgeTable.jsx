import PlayerSeat from "./PlayerSeat";
import BiddingPanel from "./BiddingPanel";
import AuctionHistory from "./AuctionHistory";
import ContractDisplay from "./ContractDisplay";
import TrickArea from "./TrickArea";
import TurnIndicator from "./TurnIndicator";
import ScoreBoard from "./ScoreBoard";
import GameStatus from "./GameStatus";
import GameResult from "./GameResult";
import { playableCardIds } from "../logic/tricks";

export default function BridgeTable({
  state,
  error,
  onBid,
  onCard,
  onNextDeal,
}) {
  const bySeat = Object.fromEntries(
    state.players.map((player) => [player.seat, player]),
  );
  const ownHand = bySeat[state.you.seat]?.hand || [];
  const isDeclarer = state.contract?.declarer === state.you.seat;
  const dummyPlayer = state.contract ? bySeat[state.contract.dummy] : null;
  const canOwnPlay =
    (state.phase === "trick-play" || state.phase === "opening-lead") &&
    state.turnActorId === state.you.id &&
    state.currentSeat === state.you.seat;
  const canDummyPlay =
    isDeclarer &&
    state.phase === "trick-play" &&
    state.currentSeat === state.contract?.dummy;
  const ownIds = canOwnPlay ? playableCardIds(ownHand, state.trick) : new Set();
  const dummyIds = canDummyPlay
    ? playableCardIds(dummyPlayer?.hand || [], state.trick)
    : new Set();

  const selectableIdsForSeat = (seat) => {
    if (state.phase !== "trick-play" && state.phase !== "opening-lead")
      return new Set();

    // During normal play the declarer controls the dummy hand. The server
    // still validates the requested source seat, but the UI must expose
    // the dummy's cards on whichever seat the dummy occupies (W/E/N/S).
    if (
      state.phase === "trick-play" &&
      canDummyPlay &&
      seat === state.contract?.dummy
    ) {
      return dummyIds;
    }

    if (
      seat === state.you.seat &&
      state.currentSeat === seat &&
      state.turnActorId === state.you.id
    ) {
      return ownIds;
    }

    return new Set();
  };

  return (
    <div className="bridge-shell">
      <header className="bridge-topbar">
        <div>
          <span className="bridge-eyebrow">SHUFFLEUP · BRIDGE</span>
          <h1>Partnership Table</h1>
        </div>
        <div className="bridge-top-meta">
          <span>Deal {state.dealNumber}</span>
          <span>Dealer {state.dealer}</span>
          <span>Vuln. {state.vulnerability}</span>
        </div>
      </header>

      <GameStatus phase={state.phase} error={error} />

      <div className="bridge-layout">
        <aside className="bridge-side-column left">
          <BiddingPanel state={state} onBid={onBid} />
          <ContractDisplay
            contract={state.contract}
            vulnerability={state.vulnerability}
          />
          <ScoreBoard state={state} />
        </aside>

        <main className="bridge-table-wrap">
          <div className="bridge-felt">
            <div className="bridge-table-grid">
              <PlayerSeat
                player={bySeat.N}
                viewerId={state.you.id}
                position="N"
                selectableIds={selectableIdsForSeat("N")}
                onCardClick={(card) => onCard(card, "N")}
                dummyRevealed={state.dummyRevealed}
                isCurrent={state.currentSeat === "N"}
              />
              <PlayerSeat
                player={bySeat.W}
                viewerId={state.you.id}
                position="W"
                selectableIds={selectableIdsForSeat("W")}
                onCardClick={(card) => onCard(card, "W")}
                dummyRevealed={state.dummyRevealed}
                isCurrent={state.currentSeat === "W"}
              />
              <div className="bridge-center">
                <TurnIndicator state={state} />
                <TrickArea
                  trick={state.trick}
                  winnerSeat={state.lastTrickWinner}
                  players={state.players}
                />
                <div className="bridge-table-caption">
                  {state.contract
                    ? `${state.contract.level}${state.contract.strain === "NT" ? "NT" : state.contract.strain} · ${state.contract.doubled === 2 ? "Redoubled" : state.contract.doubled === 1 ? "Doubled" : "Undoubled"}`
                    : "Bidding is open"}
                </div>
              </div>
              <PlayerSeat
                player={bySeat.E}
                viewerId={state.you.id}
                position="E"
                selectableIds={selectableIdsForSeat("E")}
                onCardClick={(card) => onCard(card, "E")}
                dummyRevealed={state.dummyRevealed}
                isCurrent={state.currentSeat === "E"}
              />
              <PlayerSeat
                player={bySeat.S}
                viewerId={state.you.id}
                position="S"
                selectableIds={selectableIdsForSeat("S")}
                onCardClick={(card) => onCard(card, "S")}
                dummyRevealed={state.dummyRevealed}
                isCurrent={state.currentSeat === "S"}
              />
            </div>
          </div>
        </main>

        <aside className="bridge-side-column right">
          <section className="bridge-panel">
            <div className="bridge-panel-head">
              <div>
                <span className="bridge-eyebrow">AUCTION HISTORY</span>
                <h2>Calls</h2>
              </div>
              <strong>{state.currentSeat}</strong>
            </div>
            <AuctionHistory auction={state.auction} />
          </section>
          {state.phase === "opening-lead" && (
            <section className="bridge-panel bridge-tip">
              <span className="bridge-eyebrow">OPENING LEAD</span>
              <strong>
                {state.currentSeat === state.you.seat
                  ? "Play from your hand."
                  : "Waiting for the opening leader."}
              </strong>
            </section>
          )}
          {state.dummyRevealed && (
            <section className="bridge-panel bridge-tip">
              <span className="bridge-eyebrow">DUMMY</span>
              <strong>
                Dummy is exposed. The declarer controls those cards.
              </strong>
            </section>
          )}
          <GameResult state={state} onNextDeal={onNextDeal} />
        </aside>
      </div>
    </div>
  );
}
