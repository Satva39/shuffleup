import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radii } from "../../../theme";
import { useAuth } from "../../../context/AuthStore";
import useIndianRummySocket from "../hooks/useIndianRummySocket";
import RummyCard from "../components/RummyCard";
import RummySeat, { OpponentCards } from "../components/RummySeat";
import RummyResultPanel from "../components/RummyResultPanel";

const ACTIONS = {
  DRAW_CLOSED: "draw-closed",
  DRAW_DISCARD: "draw-discard",
  DISCARD: "discard",
  DECLARE: "declare",
};

const statusMeta = {
  connected: { label: "LIVE", color: colors.green },
  reconnecting: { label: "RECONNECTING", color: colors.gold },
  connecting: { label: "CONNECTING", color: colors.gold },
  error: { label: "OFFLINE", color: colors.red },
  offline: { label: "OFFLINE", color: colors.red },
};

export default function IndianRummyGameScreen({ route, navigation }) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const landscape = width > height;
  const roomCode = route.params?.roomCode;
  const [selectedIds, setSelectedIds] = useState([]);

  const { gameState, error, connection, connected, reconnecting, action } =
    useIndianRummySocket(roomCode, user?.id);

  const players = gameState?.players || [];
  const you = gameState?.you;
  const currentPlayer = players.find(
    (player) => player.id === gameState?.currentPlayerId,
  );
  const yourTurn = gameState?.currentPlayerId === user?.id;
  const selectedCardId = selectedIds.length === 1 ? selectedIds[0] : null;
  const meta = statusMeta[connection] || statusMeta.connecting;
  const selectedCards = useMemo(
    () => (you?.cards || []).filter((card) => selectedIds.includes(card.id)),
    [selectedIds, you?.cards],
  );

  function toggleCard(cardId) {
    if (!yourTurn || !you) return;
    setSelectedIds((current) =>
      current.includes(cardId)
        ? current.filter((id) => id !== cardId)
        : [...current, cardId],
    );
  }

  function performAction(type, cardId = null) {
    setSelectedIds([]);
    action(type, cardId);
  }

  if (!gameState) {
    return (
      <View style={styles.loadingRoot}>
        <View style={styles.loadingLogo}>
          <Text style={styles.loadingLogoText}>SU</Text>
        </View>
        <Text style={styles.loadingKicker}>SHUFFLEUP · INDIAN RUMMY</Text>
        <Text style={styles.loadingTitle}>
          {reconnecting ? "RESTORING YOUR SEAT" : "JOINING THE LIVE TABLE"}
        </Text>
        <Text style={styles.loadingSub}>
          {reconnecting
            ? "Reconnecting and restoring server state…"
            : "Preparing your cards and table…"}
        </Text>
        <ActivityIndicator
          color={colors.cyan}
          size="small"
          style={{ marginTop: 18 }}
        />
      </View>
    );
  }

  if (gameState.status === "complete") {
    return (
      <RummyResultPanel
        result={gameState.result}
        userId={user?.id}
        onLobby={() => navigation.navigate("Main", { screen: "Lobby" })}
      />
    );
  }

  const opponents = players.filter((player) => player.id !== user?.id);
  const actionLocked = !yourTurn || !connected;
  const canDrawClosed = yourTurn && !you?.hasDrawn && gameState.drawCount > 0;
  const canDrawDiscard = yourTurn && !you?.hasDrawn && gameState.discardTop;
  const canDiscard =
    yourTurn &&
    Boolean(you?.hasDrawn) &&
    you?.cards?.length === 14 &&
    selectedCardId;
  const canDeclare =
    yourTurn &&
    Boolean(you?.hasDrawn) &&
    you?.cards?.length === 14 &&
    selectedCardId;

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={["#081226", "#07111A", "#07101A"]}
        style={StyleSheet.absoluteFillObject}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingBottom: Math.max(insets.bottom, 12) + 28,
          paddingHorizontal: landscape ? 16 : 12,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <View style={styles.brandBlock}>
            <View style={styles.brandIcon}>
              <Text style={styles.brandIconText}>SU</Text>
            </View>
            <View style={styles.brandCopy}>
              <Text style={styles.eyebrow}>SHUFFLEUP</Text>
              <Text style={styles.gameTitle}>Indian Rummy</Text>
            </View>
          </View>
          <View style={styles.topMeta}>
            <View style={styles.roomPill}>
              <Text style={styles.roomLabel}>ROOM</Text>
              <Text style={styles.roomCode}>
                {String(roomCode || gameState.roomCode || "").toUpperCase()}
              </Text>
            </View>
            <View style={styles.livePill}>
              <View style={[styles.liveDot, { backgroundColor: meta.color }]} />
              <Text style={[styles.liveText, { color: meta.color }]}>
                {meta.label}
              </Text>
            </View>
          </View>
        </View>

        {error ? (
          <View style={styles.errorBanner}>
            <Ionicons name="warning" size={16} color={colors.red} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.errorTitle}>Action unavailable</Text>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          </View>
        ) : null}

        {!connected ? (
          <View style={styles.connectionBanner}>
            <ActivityIndicator color={meta.color} size="small" />
            <Text style={styles.connectionText}>
              {connection === "error"
                ? "Connection error. Retrying…"
                : "Restoring the live table…"}
            </Text>
          </View>
        ) : null}

        <View style={styles.infoRow}>
          <View style={styles.infoCard}>
            <Text style={styles.infoKicker}>ROUND</Text>
            <Text style={styles.infoValue}>{gameState.round}</Text>
            <Text style={styles.infoSub}>Turn {gameState.turnNumber}</Text>
          </View>
          <View style={[styles.infoCard, yourTurn && styles.infoCardActive]}>
            <Text style={styles.infoKicker}>TURN</Text>
            <Text numberOfLines={1} style={styles.infoValue}>
              {yourTurn ? "YOUR TURN" : currentPlayer?.username || "WAITING"}
            </Text>
            <Text style={styles.infoSub}>
              {yourTurn ? "Choose your next action" : "Server-controlled turn"}
            </Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoKicker}>WILD JOKER</Text>
            <Text style={[styles.infoValue, { color: colors.gold }]}>
              {gameState.wildJoker || "—"}
            </Text>
            <Text style={styles.infoSub}>Rank is wild</Text>
          </View>
        </View>

        <View
          style={[styles.tableShell, landscape && styles.tableShellLandscape]}
        >
          <LinearGradient
            colors={["#0C4C3D", "#093C30", "#082B22"]}
            style={styles.table}
          >
            <View style={styles.tableRingOuter} />
            <View style={styles.tableRingInner} />
            <View style={styles.tableLabel}>
              <Text style={styles.tableTitle}>INDIAN RUMMY</Text>
              <Text style={styles.tableSub}>ROUND {gameState.round}</Text>
            </View>

            <View style={styles.opponentGrid}>
              {opponents.map((player) => (
                <View key={player.id} style={styles.opponentCard}>
                  <RummySeat
                    player={player}
                    isCurrentTurn={player.id === gameState.currentPlayerId}
                  />
                  <OpponentCards count={player.cardCount} />
                </View>
              ))}
            </View>

            <View style={styles.pilesRow}>
              <Pressable
                disabled={!canDrawClosed}
                onPress={() => performAction(ACTIONS.DRAW_CLOSED)}
                style={[
                  styles.pileButton,
                  !canDrawClosed && styles.pileDisabled,
                ]}
              >
                <View style={styles.deckStack}>
                  <View style={styles.deckBackShadow} />
                  <View style={styles.deckBack}>
                    <Text style={styles.deckMark}>SU</Text>
                    <Text style={styles.deckSuit}>♠</Text>
                  </View>
                </View>
                <Text style={styles.pileTitle}>DRAW</Text>
                <Text style={styles.pileCount}>
                  {gameState.drawCount} cards
                </Text>
              </Pressable>

              <View style={styles.pileDivider} />

              <Pressable
                disabled={!canDrawDiscard}
                onPress={() => performAction(ACTIONS.DRAW_DISCARD)}
                style={[
                  styles.pileButton,
                  !canDrawDiscard && styles.pileDisabled,
                ]}
              >
                {gameState.discardTop ? (
                  <RummyCard
                    card={gameState.discardTop}
                    compact
                    disabled={!canDrawDiscard}
                    emphasize
                  />
                ) : (
                  <View style={styles.emptyDiscard}>
                    <Text style={styles.emptyText}>EMPTY</Text>
                  </View>
                )}
                <Text style={styles.pileTitle}>DISCARD</Text>
                <Text style={styles.pileCount}>
                  {gameState.discardCount} cards
                </Text>
              </Pressable>
            </View>

            <View
              style={[styles.turnBanner, yourTurn && styles.turnBannerActive]}
            >
              <Text style={styles.turnKicker}>PLAYING</Text>
              <Text style={styles.turnName}>
                {yourTurn ? "YOUR TURN" : currentPlayer?.username || "WAITING"}
              </Text>
            </View>

            <View style={styles.youSeatWrap}>
              <RummySeat
                player={{ ...you, cardCount: you?.cards?.length || 0 }}
                isYou
                isCurrentTurn={yourTurn}
              />
            </View>
          </LinearGradient>
        </View>

        <View style={styles.handPanel}>
          <View style={styles.panelHeader}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.panelKicker}>YOUR HAND</Text>
              <Text style={styles.panelTitle}>
                {you?.cards?.length || 0} cards
              </Text>
            </View>
            <View style={styles.privatePill}>
              <Ionicons name="lock-closed" size={12} color={colors.green} />
              <Text style={styles.privateText}>PRIVATE</Text>
            </View>
          </View>

          <Text style={styles.helperText}>
            {yourTurn
              ? "Tap cards to select. Select one card to discard or to complete a declaration."
              : `Waiting for ${currentPlayer?.username || "the next player"}.`}
          </Text>

          <View style={styles.handGrid}>
            {(you?.cards || []).map((card) => {
              const wild =
                card.printedJoker || card.rank === gameState.wildJoker;
              return (
                <RummyCard
                  key={card.id}
                  card={card}
                  selected={selectedIds.includes(card.id)}
                  wild={wild}
                  disabled={!yourTurn}
                  onPress={() => toggleCard(card.id)}
                />
              );
            })}
          </View>

          {selectedCards.length ? (
            <View style={styles.selectedSummary}>
              <Ionicons name="checkmark-circle" size={15} color={colors.cyan} />
              <Text style={styles.selectedSummaryText}>
                {selectedCards.length} selected
              </Text>
              <Pressable onPress={() => setSelectedIds([])}>
                <Text style={styles.clearText}>CLEAR</Text>
              </Pressable>
            </View>
          ) : null}
        </View>

        <View style={styles.actionPanel}>
          <View style={styles.actionHeader}>
            <View>
              <Text style={styles.panelKicker}>ACTION</Text>
              <Text style={styles.panelTitle}>
                {yourTurn ? "Your move" : "Live table"}
              </Text>
            </View>
            <Text style={styles.actionState}>
              {you?.hasDrawn ? "14 CARDS" : "13 CARDS"}
            </Text>
          </View>

          <View style={styles.actionRow}>
            <Pressable
              disabled={actionLocked || !canDrawClosed}
              onPress={() => performAction(ACTIONS.DRAW_CLOSED)}
              style={({ pressed }) => [
                styles.actionButton,
                styles.actionPrimary,
                (pressed || actionLocked || !canDrawClosed) &&
                  styles.actionDisabled,
              ]}
            >
              <Ionicons name="layers" size={19} color="#08101C" />
              <Text style={styles.actionPrimaryText}>DRAW DECK</Text>
            </Pressable>
            <Pressable
              disabled={actionLocked || !canDrawDiscard}
              onPress={() => performAction(ACTIONS.DRAW_DISCARD)}
              style={({ pressed }) => [
                styles.actionButton,
                styles.actionSecondary,
                (pressed || actionLocked || !canDrawDiscard) &&
                  styles.actionDisabled,
              ]}
            >
              <Ionicons name="albums" size={19} color={colors.text} />
              <Text style={styles.actionSecondaryText}>PICK DISCARD</Text>
            </Pressable>
          </View>

          <View style={styles.actionRow}>
            <Pressable
              disabled={actionLocked || !canDiscard}
              onPress={() => performAction(ACTIONS.DISCARD, selectedCardId)}
              style={({ pressed }) => [
                styles.actionButton,
                styles.actionSecondary,
                (pressed || actionLocked || !canDiscard) &&
                  styles.actionDisabled,
              ]}
            >
              <Ionicons
                name="arrow-down-circle"
                size={19}
                color={colors.text}
              />
              <Text style={styles.actionSecondaryText}>DISCARD SELECTED</Text>
            </Pressable>
            <Pressable
              disabled={actionLocked || !canDeclare}
              onPress={() => performAction(ACTIONS.DECLARE, selectedCardId)}
              style={({ pressed }) => [
                styles.actionButton,
                styles.actionDeclare,
                (pressed || actionLocked || !canDeclare) &&
                  styles.actionDisabled,
              ]}
            >
              <Ionicons name="trophy" size={18} color="#08101C" />
              <Text style={styles.actionDeclareText}>DECLARE</Text>
            </Pressable>
          </View>

          <Text style={styles.actionNote}>
            The server validates every draw, discard and declaration. Mobile
            selection is only for interaction and does not decide the result.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#07101A" },
  scroll: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  brandBlock: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
  },
  brandIcon: {
    width: 58,
    height: 58,
    borderRadius: 19,
    backgroundColor: "#171A43",
    borderWidth: 1,
    borderColor: "#31386D",
    alignItems: "center",
    justifyContent: "center",
  },
  brandIconText: { color: colors.text, fontSize: 18, fontWeight: "900" },
  brandCopy: { marginLeft: 10, minWidth: 0 },
  eyebrow: {
    color: colors.cyan,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.7,
  },
  gameTitle: {
    color: colors.text,
    fontSize: 25,
    fontWeight: "900",
    marginTop: 3,
  },
  topMeta: { alignItems: "flex-end", gap: 9 },
  roomPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(18,27,49,0.94)",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  roomLabel: { color: colors.muted, fontSize: 9, fontWeight: "900" },
  roomCode: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1.1,
  },
  livePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingRight: 4,
  },
  liveDot: { width: 9, height: 9, borderRadius: 5 },
  liveText: { fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  errorBanner: {
    marginTop: 10,
    flexDirection: "row",
    gap: 9,
    padding: 11,
    borderRadius: 14,
    backgroundColor: "rgba(106,33,49,0.34)",
    borderWidth: 1,
    borderColor: "rgba(255,107,122,0.35)",
  },
  errorTitle: { color: colors.text, fontSize: 11, fontWeight: "900" },
  errorText: { color: "#FFCED7", fontSize: 10, lineHeight: 15, marginTop: 2 },
  connectionBanner: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 13,
    backgroundColor: "rgba(247,198,93,0.12)",
    borderWidth: 1,
    borderColor: "rgba(247,198,93,0.22)",
  },
  connectionText: { color: colors.text, fontSize: 10, fontWeight: "800" },
  infoRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  infoCard: {
    flex: 1,
    minWidth: 0,
    backgroundColor: "rgba(13,20,38,0.88)",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    padding: 10,
  },
  infoCardActive: {
    borderColor: "rgba(247,198,93,0.58)",
    backgroundColor: "rgba(46,37,13,0.82)",
  },
  infoKicker: {
    color: colors.muted,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
  },
  infoValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "900",
    marginTop: 5,
  },
  infoSub: { color: colors.muted, fontSize: 8, marginTop: 3 },
  tableShell: { marginTop: 13 },
  tableShellLandscape: { marginHorizontal: 30 },
  table: {
    minHeight: 545,
    borderRadius: 34,
    borderWidth: 9,
    borderColor: "rgba(4,23,18,0.65)",
    padding: 14,
    overflow: "hidden",
    position: "relative",
    justifyContent: "space-between",
  },
  tableRingOuter: {
    position: "absolute",
    left: "8%",
    right: "8%",
    top: 82,
    bottom: 88,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "rgba(101,190,167,0.22)",
  },
  tableRingInner: {
    position: "absolute",
    left: "20%",
    right: "20%",
    top: 143,
    bottom: 144,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(101,190,167,0.12)",
  },
  tableLabel: { alignItems: "center", marginTop: 184 },
  tableTitle: {
    color: "rgba(237,248,245,0.62)",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 2.2,
  },
  tableSub: {
    color: "rgba(237,248,245,0.36)",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.4,
    marginTop: 5,
  },
  opponentGrid: {
    position: "absolute",
    left: 14,
    right: 14,
    top: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    zIndex: 3,
  },
  opponentCard: { width: "48.7%", minWidth: 0 },
  pilesRow: {
    alignSelf: "center",
    marginTop: 106,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 4,
  },
  pileButton: {
    width: 112,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    borderRadius: 16,
  },
  pileDisabled: { opacity: 0.52 },
  deckStack: {
    width: 56,
    height: 78,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 7,
  },
  deckBackShadow: {
    position: "absolute",
    width: 51,
    height: 72,
    borderRadius: 10,
    backgroundColor: "#15203A",
    transform: [{ translateX: 6 }, { translateY: 4 }],
  },
  deckBack: {
    width: 56,
    height: 78,
    borderRadius: 11,
    backgroundColor: "#243352",
    borderWidth: 1,
    borderColor: "#64749D",
    alignItems: "center",
    justifyContent: "center",
  },
  deckMark: {
    color: "#A9B6D5",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.7,
  },
  deckSuit: { color: "#DFE5F2", fontSize: 24, marginTop: 1 },
  pileTitle: {
    color: colors.text,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.9,
  },
  pileCount: { color: colors.muted, fontSize: 8, marginTop: 3 },
  pileDivider: {
    width: 1,
    height: 82,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginHorizontal: 9,
  },
  emptyDiscard: {
    width: 43,
    height: 63,
    borderRadius: 9,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 13,
  },
  emptyText: { color: colors.muted, fontSize: 7, fontWeight: "900" },
  turnBanner: {
    alignSelf: "center",
    minWidth: 180,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 19,
    backgroundColor: "rgba(4,20,19,0.78)",
    borderWidth: 1,
    borderColor: "rgba(133,205,183,0.13)",
    alignItems: "center",
    zIndex: 5,
  },
  turnBannerActive: {
    borderColor: "rgba(247,198,93,0.36)",
    shadowColor: colors.gold,
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 3,
  },
  turnKicker: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  turnName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900",
    marginTop: 4,
  },
  youSeatWrap: {
    width: "54%",
    minWidth: 180,
    alignSelf: "center",
    marginBottom: 2,
    zIndex: 5,
  },
  handPanel: {
    marginTop: 13,
    backgroundColor: "rgba(13,20,38,0.96)",
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  panelHeader: { flexDirection: "row", alignItems: "center" },
  panelKicker: {
    color: colors.cyan,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.4,
  },
  panelTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900",
    marginTop: 4,
  },
  privatePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(74,222,128,0.10)",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
  },
  privateText: { color: colors.green, fontSize: 9, fontWeight: "900" },
  helperText: {
    color: colors.muted,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 8,
  },
  handGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 13,
  },
  selectedSummary: {
    marginTop: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  selectedSummaryText: {
    color: colors.cyan,
    fontSize: 10,
    fontWeight: "800",
    flex: 1,
  },
  clearText: { color: colors.muted, fontSize: 9, fontWeight: "900" },
  actionPanel: {
    marginTop: 13,
    backgroundColor: "rgba(10,12,21,0.92)",
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: "rgba(247,198,93,0.28)",
    padding: 14,
  },
  actionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  actionState: { color: colors.gold, fontSize: 11, fontWeight: "900" },
  actionRow: { flexDirection: "row", gap: 9, marginTop: 10 },
  actionButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
  },
  actionPrimary: { backgroundColor: colors.gold, borderColor: colors.gold },
  actionSecondary: { backgroundColor: colors.surface },
  actionDeclare: { backgroundColor: colors.cyan, borderColor: colors.cyan },
  actionPrimaryText: { color: "#08101C", fontSize: 9.5, fontWeight: "900" },
  actionSecondaryText: { color: colors.text, fontSize: 9.5, fontWeight: "900" },
  actionDeclareText: { color: "#08101C", fontSize: 9.5, fontWeight: "900" },
  actionDisabled: { opacity: 0.38 },
  actionNote: {
    color: colors.muted,
    fontSize: 9,
    lineHeight: 14,
    marginTop: 10,
  },
  loadingRoot: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
  },
  loadingLogo: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: "#171A43",
    borderWidth: 1,
    borderColor: "#31386D",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingLogoText: { color: colors.text, fontSize: 22, fontWeight: "900" },
  loadingKicker: {
    color: colors.cyan,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.6,
    marginTop: 18,
  },
  loadingTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 8,
  },
  loadingSub: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 7,
  },
});
