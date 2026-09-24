import React from "react";
import PlayerSeat from "./PlayerSeat";
import TrickArea from "./TrickArea";
import TrumpSelector from "./TrumpSelector";
import TrumpDisplay from "./TrumpDisplay";
import ScoreBoard from "./ScoreBoard";
import TurnIndicator from "./TurnIndicator";
import TrickCounter from "./TrickCounter";
import GameStatus from "./GameStatus";
import KeyCardTracker from "./KeyCardTracker";
import CoatBanner from "./CoatBanner";
import HandResult from "./HandResult";
import GameResult from "./GameResult";
import { playerForSeat } from "../logic/cards";

export default function MindiCoatTable({
  state,
  user,
  error,
  selectTrump,
  openHukum,
  playCard,
  nextHand,
  onReturnToLobby,
}) {
  const viewer = state.players.find((player) => player.id === user.id) || null;
  const seatPlayers = {
    N: playerForSeat(state.players, "N"),
    E: playerForSeat(state.players, "E"),
    S: playerForSeat(state.players, "S"),
    W: playerForSeat(state.players, "W"),
  };
  const myTurn = state.turnActorId === user.id;
  const tens = {
    A:
      state.handResult?.tens?.A ??
      state.players
        .filter((p) => p.team === "A")
        .reduce((n, p) => n + p.tensCaptured, 0),
    B:
      state.handResult?.tens?.B ??
      state.players
        .filter((p) => p.team === "B")
        .reduce((n, p) => n + p.tensCaptured, 0),
  };

  const gameFinished =
    state.status === "game-complete" || state.phase === "game-complete";
  const winningTeam = state.winnerTeam;
  const winnerLabel =
    winningTeam === "A" ? "Team A" : winningTeam === "B" ? "Team B" : "Winner";

  return (
    <main className="mindi-page">
      <div className="mindi-shell">
        <header className="mindi-topbar">
          <div className="mindi-brand">
            <div className="mindi-brand-mark">SU</div>
            <div>
              <span>SHUFFLEUP</span>
              <h1>Mindi Coat</h1>
            </div>
          </div>
          <GameStatus
            phase={state.phase}
            handNumber={state.handNumber}
            targetScore={state.targetScore}
          />
        </header>

        <ScoreBoard
          scores={state.scores}
          targetScore={state.targetScore}
          tens={tens}
        />

        <section className="mindi-table-wrap">
          <div className="mindi-table">
            <div className="mindi-seat-area north">
              <PlayerSeat
                player={seatPlayers.N}
                viewer={viewer}
                hand={viewer?.seat === "N" ? state.hand : []}
                legalCardIds={state.legalCardIds}
                onPlayCard={playCard}
                currentTurn={state.currentSeat === "N" && myTurn}
                trumpSelector={state.phase === "trump-select"}
              />
            </div>

            <div className="mindi-seat-area west">
              <PlayerSeat
                player={seatPlayers.W}
                viewer={viewer}
                hand={viewer?.seat === "W" ? state.hand : []}
                legalCardIds={state.legalCardIds}
                onPlayCard={playCard}
                currentTurn={state.currentSeat === "W" && myTurn}
                trumpSelector={state.phase === "trump-select"}
              />
            </div>

            <div className="mindi-center">
              <div className="mindi-center-tools">
                <TrumpDisplay
                  suit={state.trumpSuit}
                  revealed={state.trumpRevealed}
                />
                <TurnIndicator
                  seat={state.currentSeat}
                  phase={state.phase}
                  actorId={state.turnActorId}
                  userId={user.id}
                />
                <TrickCounter count={state.trickCount} />
              </div>

              <TrickArea
                trick={state.trick}
                trickCount={state.trickCount}
                winnerSeat={state.lastTrickWinner}
                completedTricks={state.completedTricks}
              />

              {state.canOpenHukum && (
                <div className="mindi-hukum-action">
                  <div>
                    <strong>You cannot follow the led suit.</strong>
                    <span>
                      Open Hukum to reveal the hidden card. The player who hid
                      it gets the card back and may use it normally.
                    </span>
                  </div>
                  <button
                    className="mindi-primary"
                    type="button"
                    onClick={openHukum}
                  >
                    Open Hukum
                  </button>
                </div>
              )}

              <KeyCardTracker tens={tens} />
            </div>

            <div className="mindi-seat-area east">
              <PlayerSeat
                player={seatPlayers.E}
                viewer={viewer}
                hand={viewer?.seat === "E" ? state.hand : []}
                legalCardIds={state.legalCardIds}
                onPlayCard={playCard}
                currentTurn={state.currentSeat === "E" && myTurn}
                trumpSelector={state.phase === "trump-select"}
              />
            </div>

            <div className="mindi-seat-area south">
              <PlayerSeat
                player={seatPlayers.S}
                viewer={viewer}
                hand={viewer?.seat === "S" ? state.hand : []}
                legalCardIds={state.legalCardIds}
                onPlayCard={playCard}
                currentTurn={state.currentSeat === "S" && myTurn}
                trumpSelector={state.phase === "trump-select"}
              />
            </div>
          </div>
        </section>

        <section className="mindi-action-area">
          {state.phase === "trump-select" &&
            state.trumpSelectorId === user.id && (
              <TrumpSelector
                hand={state.hand}
                onSelect={selectTrump}
                disabled={!state.canSelectTrump}
              />
            )}

          {state.phase === "trump-select" &&
            state.trumpSelectorId !== user.id && (
              <div className="mindi-waiting">
                {seatPlayers[state.currentSeat]?.username || "The selector"} is
                choosing the hidden Hukum.
              </div>
            )}

          {state.trumpRevealed && state.trumpCard && (
            <div className="mindi-hukum-reveal">
              <strong>
                Hukum opened: {state.trumpCard.rank}
                {state.trumpCard.suit}
              </strong>
              <span>
                {seatPlayers[state.hukumOpenedById]?.username || "A player"}{" "}
                opened it.{" "}
                {seatPlayers[state.trumpSelectorId]?.username ||
                  "The Hukum holder"}{" "}
                now has the card and may use it normally.
              </span>
            </div>
          )}

          {error && <div className="mindi-error">{error}</div>}
          <CoatBanner result={state.handResult} />
          <HandResult result={state.handResult} />
          {!gameFinished && (
            <GameResult winnerTeam={state.winnerTeam} scores={state.scores} />
          )}
          {state.canStartNextHand && (
            <button
              className="mindi-primary next-hand"
              type="button"
              onClick={nextHand}
            >
              Start Next Hand
            </button>
          )}
        </section>
      </div>

      {gameFinished && (
        <div className="mindi-game-finish-overlay" role="presentation">
          <div
            className="mindi-game-finish-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mindi-game-finish-title"
          >
            <div className="mindi-game-finish-badge">GAME FINISHED</div>
            <div className="mindi-game-finish-icon">♛</div>
            <h2 id="mindi-game-finish-title">{winnerLabel} Wins!</h2>
            <p className="mindi-game-finish-subtitle">
              Congratulations to {winnerLabel} on winning the Mindi Coat game.
            </p>

            <div className="mindi-game-finish-score">
              <div>
                <span>TEAM A</span>
                <strong>{state.scores?.A ?? 0}</strong>
              </div>
              <div className="mindi-game-finish-divider">VS</div>
              <div>
                <span>TEAM B</span>
                <strong>{state.scores?.B ?? 0}</strong>
              </div>
            </div>

            <button
              className="mindi-game-finish-button"
              type="button"
              onClick={onReturnToLobby}
            >
              Return to Lobby
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
