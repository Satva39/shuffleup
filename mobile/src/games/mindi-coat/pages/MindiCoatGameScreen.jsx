import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../../../components/Screen";
import { colors, radii } from "../../../theme";
import { useAuth } from "../../../context/AuthStore";
import useMindiCoatSocket from "../hooks/useMindiCoatSocket";
import MindiCoatCard from "../components/MindiCoatCard";
import MindiCoatSeat from "../components/MindiCoatSeat";
import MindiCoatTrickArea from "../components/MindiCoatTrickArea";
import {
  GameResultPanel,
  HandResultPanel,
} from "../components/MindiCoatResultPanel";
import { seatLabel, teamLabel, teamName } from "../utils/cards";

export default function MindiCoatGameScreen({ route, navigation }) {
  const { roomCode } = route.params;
  const { user } = useAuth();
  const {
    gameState,
    error,
    connection,
    reconnecting,
    selectTrump,
    openHukum,
    playCard,
    nextHand,
    refreshState,
  } = useMindiCoatSocket(roomCode, user?.id);
  const [selectedCardId, setSelectedCardId] = useState(null);

  const normalized = String(roomCode || "")
    .trim()
    .toUpperCase();
  const viewer = useMemo(
    () => (gameState?.players || []).find((player) => player.id === user?.id),
    [gameState?.players, user?.id],
  );
  const orderedOpponents = useMemo(
    () =>
      ["N", "E", "S", "W"]
        .map((seat) =>
          (gameState?.players || []).find((player) => player.seat === seat),
        )
        .filter((player) => player && player.id !== user?.id),
    [gameState?.players, user?.id],
  );
  const currentSeat = gameState?.currentSeat;
  const isMyTurn = gameState?.turnActorId === user?.id;
  const legalIds = new Set(gameState?.legalCardIds || []);
  const isTrumpSelecting =
    gameState?.phase === "trump-select" && gameState?.canSelectTrump;
  const isGameComplete =
    gameState?.phase === "game-complete" ||
    gameState?.status === "game-complete";
  const isHandComplete =
    gameState?.phase === "hand-complete" && !isGameComplete;

  function handleCardPress(card) {
    if (isTrumpSelecting) {
      selectTrump(card.id);
      setSelectedCardId(null);
      return;
    }
    setSelectedCardId((current) => (current === card.id ? null : card.id));
  }

  function commitPlay() {
    if (!selectedCardId || !legalIds.has(selectedCardId)) {
      setSelectedCardId(null);
      return;
    }
    playCard(selectedCardId);
    setSelectedCardId(null);
  }

  if (!gameState) {
    return (
      <Screen scroll={false} contentStyle={styles.loadingScreen}>
        <View style={styles.loadingCard}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>SU</Text>
          </View>
          <Text style={styles.loadingKicker}>SHUFFLEUP · MINDI COAT</Text>
          <Text style={styles.loadingTitle}>JOINING THE LIVE TABLE</Text>
          <Text style={styles.loadingSub}>
            {error ||
              (reconnecting
                ? "Reconnecting to the table…"
                : `Preparing room ${normalized}…`)}
          </Text>
          <ActivityIndicator
            size="small"
            color={colors.cyan}
            style={{ marginTop: 15 }}
          />
        </View>
      </Screen>
    );
  }

  const tablePlayers = orderedOpponents;

  return (
    <Screen scroll={false} contentStyle={styles.screen}>
      {isGameComplete ? (
        <GameResultPanel
          gameState={gameState}
          onLobby={() => navigation.replace("Main")}
        />
      ) : null}
      {isHandComplete ? (
        <HandResultPanel gameState={gameState} onContinue={nextHand} />
      ) : null}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.topbar}>
          <View style={styles.brandRow}>
            <View style={styles.brandMark}>
              <Text style={styles.brandMarkText}>SU</Text>
            </View>
            <View>
              <Text style={styles.brand}>SHUFFLEUP · MINDI COAT</Text>
              <Text style={styles.title}>Mindi Coat</Text>
            </View>
          </View>
          <View style={styles.roomPill}>
            <Text style={styles.roomLabel}>ROOM</Text>
            <Text style={styles.roomCode}>{normalized}</Text>
          </View>
        </View>

        <View style={styles.statusRow}>
          <View>
            <Text style={styles.statusLabel}>HAND</Text>
            <Text style={styles.statusValue}>{gameState.handNumber}</Text>
            <Text style={styles.statusSub}>13 tricks</Text>
          </View>
          <View>
            <Text style={styles.statusLabel}>TURN</Text>
            <Text style={styles.statusValue}>
              {gameState.turnActorId === user?.id
                ? "You"
                : seatLabel(currentSeat)}
            </Text>
            <Text style={styles.statusSub}>
              {gameState.phase === "trump-select"
                ? "Hukum select"
                : "Trick play"}
            </Text>
          </View>
          <View>
            <Text style={styles.statusLabel}>TRUMP</Text>
            <Text
              style={[
                styles.statusValue,
                !gameState.trumpRevealed && styles.hiddenTrump,
              ]}
            >
              {gameState.trumpRevealed ? gameState.trumpSuit : "— Hidden"}
            </Text>
            <Text style={styles.statusSub}>
              {gameState.trumpRevealed ? "Revealed" : "Hidden"}
            </Text>
          </View>
        </View>

        <View style={styles.tableShell}>
          <View style={styles.opponentRow}>
            {tablePlayers.slice(0, 3).map((player) => (
              <MindiCoatSeat
                key={player.id}
                player={player}
                isYou={false}
                isCurrentTurn={player.id === gameState.turnActorId}
              />
            ))}
          </View>

          <View style={styles.tableCenterHeader}>
            <Text style={styles.centerKicker}>
              {gameState.trumpRevealed
                ? `TRUMP · ${gameState.trumpSuit}`
                : "HUKUM"}
            </Text>
            <Text style={styles.centerTitle}>
              {isMyTurn ? "YOUR TURN" : `${seatLabel(currentSeat)}'s turn`}
            </Text>
          </View>

          <MindiCoatTrickArea
            trick={gameState.trick}
            lastTrickWinner={gameState.lastTrickWinner}
          />

          <View style={styles.youWrap}>
            <MindiCoatSeat
              player={{
                ...viewer,
                tricksWon: viewer?.tricksWon,
                tensCaptured: viewer?.tensCaptured,
              }}
              isYou
              isCurrentTurn={isMyTurn}
            />
          </View>
        </View>

        <View style={styles.scorePanel}>
          <View style={styles.panelHeading}>
            <View>
              <Text style={styles.kicker}>PARTNERSHIPS</Text>
              <Text style={styles.panelTitle}>Live score</Text>
            </View>
            <Text style={styles.trickCount}>{gameState.trickCount}/13</Text>
          </View>
          <TeamScore
            team="A"
            score={gameState.scores?.A}
            players={gameState.players}
          />
          <TeamScore
            team="B"
            score={gameState.scores?.B}
            players={gameState.players}
          />
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="warning" size={15} color={colors.red} />
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={refreshState}>
              <Text style={styles.retry}>RETRY</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.handPanel}>
          <View style={styles.panelHeading}>
            <View>
              <Text style={styles.kicker}>YOUR HAND</Text>
              <Text style={styles.panelTitle}>
                {gameState.hand?.length ?? 0} cards
              </Text>
            </View>
            <View style={styles.privatePill}>
              <Text style={styles.privateText}>PRIVATE</Text>
            </View>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.handRow}
          >
            {(gameState.hand || []).map((card) => {
              const hidden = Boolean(card?.hidden);
              const playable = isTrumpSelecting
                ? true
                : legalIds.has(card.id) && isMyTurn;
              return (
                <MindiCoatCard
                  key={card.id}
                  card={card}
                  hidden={hidden}
                  playable={playable}
                  selected={selectedCardId === card.id}
                  onPress={() => handleCardPress(card)}
                />
              );
            })}
          </ScrollView>
          <Text style={styles.handHint}>
            {isTrumpSelecting
              ? "Choose one hidden Hukum position."
              : isMyTurn
                ? "Tap a playable card, then play it."
                : "Waiting for the current player."}
          </Text>
        </View>

        <View style={styles.actionPanel}>
          <View style={styles.panelHeading}>
            <View>
              <Text style={styles.kicker}>ACTION</Text>
              <Text style={styles.panelTitle}>
                {isTrumpSelecting
                  ? "Choose Hukum"
                  : isMyTurn
                    ? "Your move"
                    : "Table action"}
              </Text>
            </View>
            <Text style={styles.phaseText}>{gameState.phase}</Text>
          </View>
          {isTrumpSelecting ? (
            <Text style={styles.actionHint}>
              Tap any hidden card position above. The actual card stays private
              until Hukum is opened.
            </Text>
          ) : (
            <View style={styles.actionRow}>
              <Pressable
                disabled={
                  !isMyTurn || !selectedCardId || !legalIds.has(selectedCardId)
                }
                onPress={commitPlay}
                style={({ pressed }) => [
                  styles.primaryButton,
                  (!isMyTurn ||
                    !selectedCardId ||
                    !legalIds.has(selectedCardId)) &&
                    styles.disabledButton,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons name="play" size={18} color="#08101E" />
                <Text style={styles.primaryText}>PLAY CARD</Text>
              </Pressable>
              <Pressable
                disabled={!gameState.canOpenHukum}
                onPress={openHukum}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  !gameState.canOpenHukum && styles.disabledSecondary,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons
                  name="eye"
                  size={18}
                  color={gameState.canOpenHukum ? colors.cyan : colors.muted}
                />
                <Text style={styles.secondaryText}>OPEN HUKUM</Text>
              </Pressable>
            </View>
          )}
        </View>

        {gameState.handResult ? (
          <View style={styles.resultPreview}>
            <Text style={styles.kicker}>LATEST RESULT</Text>
            <Text style={styles.resultTitle}>
              {gameState.handResult.winnerTeam
                ? teamName(gameState.handResult.winnerTeam)
                : "Hand settled"}
            </Text>
            <Text style={styles.resultMeta}>
              {gameState.handResult.tens?.A ?? 0} key cards ·{" "}
              {gameState.handResult.tens?.B ?? 0} key cards
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function TeamScore({ team, score, players }) {
  const teamPlayers = (players || []).filter((player) => player.team === team);
  const tricks = teamPlayers.reduce(
    (sum, player) => sum + (player.tricksWon || 0),
    0,
  );
  const tens = teamPlayers.reduce(
    (sum, player) => sum + (player.tensCaptured || 0),
    0,
  );
  return (
    <View style={styles.teamRow}>
      <View style={styles.teamBadge}>
        <Text style={styles.teamBadgeText}>{team}</Text>
      </View>
      <View style={styles.teamMain}>
        <Text style={styles.teamName}>{teamName(team)}</Text>
        <Text style={styles.teamMeta}>
          {tricks} tricks · {tens} key cards
        </Text>
      </View>
      <Text style={styles.teamScore}>{score ?? 0}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingScreen: { flex: 1, justifyContent: "center", padding: 22 },
  loadingCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    alignItems: "center",
  },
  logo: {
    width: 70,
    height: 70,
    borderRadius: 22,
    backgroundColor: "#1B2253",
    borderWidth: 1,
    borderColor: "#313E79",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: { color: colors.text, fontSize: 27, fontWeight: "900" },
  loadingKicker: {
    color: colors.cyan,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.1,
    marginTop: 17,
  },
  loadingTitle: {
    color: colors.text,
    fontSize: 23,
    fontWeight: "900",
    marginTop: 5,
    textAlign: "center",
  },
  loadingSub: {
    color: colors.muted,
    fontSize: 11,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 17,
  },
  screen: { flex: 1 },
  scrollContent: { paddingBottom: 32 },
  topbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  brandMark: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "#1B2253",
    borderWidth: 1,
    borderColor: "#313E79",
    alignItems: "center",
    justifyContent: "center",
  },
  brandMarkText: { color: colors.text, fontSize: 25, fontWeight: "900" },
  brand: {
    color: colors.cyan,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.1,
  },
  title: { color: colors.text, fontSize: 28, fontWeight: "900", marginTop: 2 },
  roomPill: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  roomLabel: { color: colors.muted, fontSize: 8, fontWeight: "900" },
  roomCode: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "900",
    marginTop: 1,
  },
  statusRow: { flexDirection: "row", gap: 8, marginTop: 16 },
  statusLabel: {
    color: colors.muted,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
  },
  statusValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900",
    marginTop: 3,
  },
  hiddenTrump: { color: colors.gold },
  statusSub: { color: colors.muted, fontSize: 8, marginTop: 1 },
  tableShell: {
    marginTop: 14,
    backgroundColor: "#074236",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#0E644F",
    padding: 12,
    overflow: "hidden",
  },
  opponentRow: { flexDirection: "row", gap: 7 },
  tableCenterHeader: { alignItems: "center", marginTop: 12, marginBottom: 10 },
  centerKicker: {
    color: colors.cyan,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  centerTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900",
    marginTop: 3,
  },
  youWrap: { marginTop: 10 },
  scorePanel: {
    marginTop: 12,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  handPanel: {
    marginTop: 12,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  actionPanel: {
    marginTop: 12,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  panelHeading: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 10,
  },
  kicker: {
    color: colors.cyan,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  panelTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900",
    marginTop: 3,
  },
  trickCount: { color: colors.muted, fontSize: 9, fontWeight: "900" },
  teamRow: {
    minHeight: 62,
    marginTop: 8,
    borderRadius: 15,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 9,
    gap: 9,
  },
  teamBadge: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "#223254",
    alignItems: "center",
    justifyContent: "center",
  },
  teamBadgeText: { color: colors.gold, fontSize: 13, fontWeight: "900" },
  teamMain: { flex: 1, minWidth: 0 },
  teamName: { color: colors.text, fontSize: 11, fontWeight: "900" },
  teamMeta: { color: colors.muted, fontSize: 8.5, marginTop: 2 },
  teamScore: { color: colors.text, fontSize: 21, fontWeight: "900" },
  privatePill: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(74,222,128,0.10)",
  },
  privateText: { color: colors.green, fontSize: 8.5, fontWeight: "900" },
  handRow: { paddingTop: 5, paddingBottom: 5, paddingRight: 10 },
  handHint: { color: colors.muted, fontSize: 9.5, marginTop: 1 },
  actionRow: { flexDirection: "row", gap: 8 },
  primaryButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 15,
    backgroundColor: colors.gold,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  disabledButton: { opacity: 0.38 },
  secondaryButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 15,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  disabledSecondary: { opacity: 0.5 },
  primaryText: { color: "#08101E", fontSize: 11, fontWeight: "900" },
  secondaryText: { color: colors.text, fontSize: 10, fontWeight: "900" },
  actionHint: { color: colors.muted, fontSize: 10.5, lineHeight: 17 },
  phaseText: { color: colors.gold, fontSize: 8.5, fontWeight: "900" },
  errorBox: {
    marginTop: 10,
    borderRadius: 13,
    backgroundColor: "rgba(255,107,122,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,107,122,0.20)",
    padding: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  errorText: { color: colors.text, flex: 1, fontSize: 9.5, lineHeight: 14 },
  retry: { color: colors.cyan, fontSize: 8.5, fontWeight: "900" },
  resultPreview: {
    marginTop: 12,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
    padding: 12,
  },
  resultTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900",
    marginTop: 3,
  },
  resultMeta: { color: colors.muted, fontSize: 9.5, marginTop: 4 },
  pressed: { opacity: 0.84 },
});
