import GameAnimation from "../../../components/game-animation/GameAnimation";
import PlayerSeat from "./PlayerSeat";
import PlayerHand from "./PlayerHand";
import ClosedDeck from "./ClosedDeck";
import DiscardPile from "./DiscardPile";
import TurnIndicator from "./TurnIndicator";
import ActionPanel from "./ActionPanel";
import ScoreBoard from "./ScoreBoard";

export default function RummyTable({
  gameState,
  userId,
  cards,
  selectedIds,
  setSelectedIds,
  onMove,
  onDrawClosed,
  onDrawDiscard,
  onDiscard,
  onDeclare,
}) {
  const you = gameState.you;
  const current = gameState.players.find(
    (player) => player.id === gameState.currentPlayerId,
  );
  const yourTurn = gameState.currentPlayerId === userId;
  const selectedCardId = selectedIds.length === 1 ? selectedIds[0] : null;

  return (
    <div className="rummy-shell">
      <header className="rummy-topbar">
        <div>
          <span>SHUFFLEUP</span>
          <h1>Indian Rummy</h1>
        </div>
        <div className="rummy-wild">
          WILD JOKER <b>{gameState.wildJoker}</b>
        </div>
      </header>
      <div className="rummy-layout">
        <main className="rummy-table">
          <div className="rummy-status-row">
            <TurnIndicator
              yourTurn={yourTurn}
              currentName={current?.username}
            />
            <GameAnimation
              as="span"
              key={`round-${gameState.round}`}
              variant="round"
            >
              Round {gameState.round}
            </GameAnimation>
          </div>
          <div className="rummy-seats">
            {gameState.players
              .filter((p) => p.id !== userId)
              .map((player) => (
                <PlayerSeat
                  key={player.id}
                  player={player}
                  isTurn={player.id === gameState.currentPlayerId}
                />
              ))}
          </div>
          <div className="rummy-center">
            <ClosedDeck
              count={gameState.drawCount}
              disabled={!yourTurn || you.hasDrawn}
              onDraw={onDrawClosed}
            />
            <div className="rummy-center-divider" />
            <DiscardPile
              card={gameState.discardTop}
              count={gameState.discardCount}
              disabled={!yourTurn || you.hasDrawn}
              onDraw={onDrawDiscard}
            />
          </div>
          <PlayerSeat
            player={{ ...you, cardCount: you.cards.length }}
            isYou
            isTurn={yourTurn}
          />
          <PlayerHand
            cards={cards}
            selectedIds={selectedIds}
            onToggle={(id) =>
              setSelectedIds((ids) =>
                ids.includes(id)
                  ? ids.filter((item) => item !== id)
                  : [...ids, id],
              )
            }
            onMoveLeft={() => onMove(-1)}
            onMoveRight={() => onMove(1)}
          />
          <ActionPanel
            yourTurn={yourTurn}
            hasDrawn={you.hasDrawn}
            selectedCardId={selectedCardId}
            onDrawClosed={onDrawClosed}
            onDrawDiscard={onDrawDiscard}
            onDiscard={onDiscard}
            onDeclare={onDeclare}
          />
        </main>
        <aside>
          <ScoreBoard players={gameState.players} />
        </aside>
      </div>
    </div>
  );
}
