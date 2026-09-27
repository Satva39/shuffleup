import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, radii } from "../../../theme";
import { useAuth } from "../../../context/AuthStore";
import useUnoSocket from "../hooks/useUnoSocket";
import UnoCard from "../components/UnoCard";
import UnoSeat from "../components/UnoSeat";
import UnoResultPanel from "../components/UnoResultPanel";

const UNO_COLORS = [
  { key: "red", label: "RED", color: "#F43F5E" },
  { key: "yellow", label: "YELLOW", color: "#F7C948" },
  { key: "green", label: "GREEN", color: "#22C55E" },
  { key: "blue", label: "BLUE", color: "#3B82F6" },
];

const ACTIONS = {
  PLAY_CARD: "play-card",
  DRAW_CARD: "draw-card",
  CHOOSE_COLOR: "choose-color",
  DECLARE_UNO: "uno",
  CALL_UNO: "call-uno",
  NEXT_ROUND: "next-round",
};

export default function UnoGameScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const roomCode = route?.params?.roomCode;
  const {
    gameState,
    connection,
    connected,
    reconnecting,
    error,
    notice,
    sendAction,
  } = useUnoSocket(roomCode, user?.id);
  const [selectedCardId, setSelectedCardId] = useState(null);

  const localPlayer = useMemo(
    () => gameState?.players?.find((player) => player.id === user?.id) || null,
    [gameState?.players, user?.id],
  );

  const isMyTurn =
    gameState?.currentPlayerId === user?.id && gameState?.status === "playing";
  const playable = gameState?.playableCardIds || [];
  const hand = gameState?.hand || [];
  const canDraw = Boolean(
    gameState?.legalActions?.includes(ACTIONS.DRAW_CARD) && isMyTurn,
  );
  const canPlay = Boolean(
    gameState?.legalActions?.includes(ACTIONS.PLAY_CARD) && isMyTurn,
  );
  const canUno = Boolean(
    gameState?.legalActions?.includes(ACTIONS.DECLARE_UNO),
  );
  const canCallUno = Boolean(
    gameState?.canCallUno && gameState?.pendingUno?.playerId,
  );
  const pendingColor = gameState?.pendingColorChoice?.playerId === user?.id;
  const selectedCard = hand.find((card) => card.id === selectedCardId) || null;
  const currentPlayer = gameState?.players?.find(
    (player) => player.id === gameState?.currentPlayerId,
  );
  const isHostSeat = localPlayer?.seat === 0;

  useEffect(() => {
    setSelectedCardId(null);
  }, [gameState?.turnNumber, gameState?.discardTop?.id]);

  function selectCard(card) {
    if (!isMyTurn || !canPlay || !playable.includes(card.id)) return;
    setSelectedCardId((current) => (current === card.id ? null : card.id));
  }

  function playSelected() {
    if (!selectedCard || !playable.includes(selectedCard.id)) return;
    sendAction(ACTIONS.PLAY_CARD, { cardId: selectedCard.id });
    setSelectedCardId(null);
  }

  function drawCard() {
    if (!canDraw) return;
    sendAction(ACTIONS.DRAW_CARD);
    setSelectedCardId(null);
  }

  function chooseColor(color) {
    sendAction(ACTIONS.CHOOSE_COLOR, { color });
  }

  function nextRound() {
    sendAction(ACTIONS.NEXT_ROUND);
  }

  function callUno() {
    const targetId = gameState?.pendingUno?.playerId;
    if (!targetId || !canCallUno) return;
    sendAction(ACTIONS.CALL_UNO, { targetId });
  }

  if (!gameState) {
    return (
      <View style={styles.loadingRoot}>
        <LinearGradient
          colors={["#090F22", "#07111D", "#060A15"]}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.loadingLogo}>
          <Text style={styles.loadingLogoText}>SU</Text>
        </View>
        <Text style={styles.loadingKicker}>SHUFFLEUP · UNO</Text>
        <Text style={styles.loadingTitle}>
          {reconnecting ? "RESTORING YOUR SEAT" : "JOINING THE LIVE TABLE"}
        </Text>
        <Text style={styles.loadingSub}>
          {reconnecting
            ? "Reconnecting and restoring server state…"
            : "Preparing your cards and table…"}
        </Text>
        {connection === "error" ? (
          <Pressable onPress={() => null} style={styles.loadingStatus}>
            <Ionicons name="warning" size={16} color={colors.red} />
            <Text style={styles.loadingStatusText}>
              Connection error. Retrying…
            </Text>
          </Pressable>
        ) : (
          <ActivityIndicator
            color={colors.cyan}
            size="small"
            style={{ marginTop: 18 }}
          />
        )}
      </View>
    );
  }

  const statusColor =
    connection === "connected"
      ? colors.green
      : connection === "error" || connection === "offline"
        ? colors.red
        : colors.gold;

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={["#091128", "#07141C", "#071018"]}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: Math.max(insets.top, 8) + 8,
          paddingBottom: Math.max(insets.bottom, 12) + 18,
        }}
      >
        <View style={styles.topBar}>
          <View style={styles.brandBlock}>
            <View style={styles.brandIcon}>
              <Text style={styles.brandIconText}>SU</Text>
            </View>
            <View>
              <Text style={styles.eyebrow}>SHUFFLEUP</Text>
              <Text style={styles.gameTitle}>UNO</Text>
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
              <View
                style={[styles.liveDot, { backgroundColor: statusColor }]}
              />
              <Text style={[styles.liveText, { color: statusColor }]}>
                {connection === "connected"
                  ? "LIVE"
                  : connection === "reconnecting" || connection === "connecting"
                    ? "RECONNECTING"
                    : "OFFLINE"}
              </Text>
            </View>
          </View>
        </View>

        {notice ? (
          <View style={styles.noticeBanner}>
            <Ionicons name="flash" size={15} color={colors.gold} />
            <Text style={styles.noticeText}>{notice}</Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorBanner}>
            <Ionicons name="warning" size={15} color={colors.red} />
            <View style={{ flex: 1 }}>
              <Text style={styles.errorTitle}>Action unavailable</Text>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          </View>
        ) : null}

        {!connected ? (
          <View style={styles.reconnectBanner}>
            <ActivityIndicator size="small" color={statusColor} />
            <Text style={styles.reconnectText}>
              {connection === "error"
                ? "Connection error. Retrying…"
                : "Reconnecting to the live table…"}
            </Text>
          </View>
        ) : null}

        <View style={styles.infoRow}>
          <View style={styles.infoCard}>
            <Text style={styles.kicker}>ROUND</Text>
            <Text style={styles.infoValue}>{gameState.round}</Text>
            <Text style={styles.infoSub}>Target 500 pts</Text>
          </View>
          <View style={[styles.infoCard, isMyTurn && styles.turnCard]}>
            <Text style={styles.kicker}>TURN</Text>
            <Text numberOfLines={1} style={styles.infoValue}>
              {isMyTurn ? "YOUR TURN" : currentPlayer?.username || "WAITING"}
            </Text>
            <Text style={styles.infoSub}>
              {isMyTurn ? "Choose an action" : "Live server turn"}
            </Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.kicker}>COLOR</Text>
            <Text
              style={[
                styles.infoValue,
                {
                  color: gameState.activeColor
                    ? colorFor(gameState.activeColor)
                    : colors.text,
                },
              ]}
            >
              {gameState.activeColor
                ? gameState.activeColor.toUpperCase()
                : "WILD"}
            </Text>
            <Text style={styles.infoSub}>Active color</Text>
          </View>
        </View>

        <View style={styles.playerStripHeader}>
          <View>
            <Text style={styles.kicker}>PLAYERS</Text>
            <Text style={styles.sectionTitle}>
              {gameState.players.length} at the table
            </Text>
          </View>
          {canCallUno ? (
            <Pressable onPress={callUno} style={styles.callUnoMain}>
              <Ionicons name="megaphone" size={14} color={colors.white} />
              <Text style={styles.callUnoMainText}>CALL UNO</Text>
            </Pressable>
          ) : null}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.playerStrip}
        >
          {gameState.players.map((player) => (
            <UnoSeat
              key={player.id}
              player={player}
              local={player.id === user?.id}
              active={player.id === gameState.currentPlayerId}
              onCallUno={
                player.id === gameState.pendingUno?.playerId
                  ? () => callUno()
                  : null
              }
            />
          ))}
        </ScrollView>

        <View style={styles.tableWrap}>
          <LinearGradient
            colors={["#0A473A", "#08372D", "#07251F"]}
            style={styles.table}
          >
            <View style={styles.tableOuter} />
            <View style={styles.tableInner} />
            <View style={styles.tableTitleWrap}>
              <Text style={styles.tableKicker}>SHUFFLEUP</Text>
              <Text style={styles.tableTitle}>UNO TABLE</Text>
              <Text style={styles.tableSub}>
                {isMyTurn
                  ? "YOUR TURN"
                  : `${currentPlayer?.username || "Waiting"} TO PLAY`}
              </Text>
            </View>

            <View style={styles.centerPiles}>
              <View style={styles.pileBlock}>
                <Pressable
                  onPress={drawCard}
                  disabled={!canDraw}
                  style={[
                    styles.pileButton,
                    canDraw && styles.pileButtonActive,
                  ]}
                >
                  <UnoCard small faceDown />
                </Pressable>
                <Text style={styles.pileLabel}>DRAW</Text>
              </View>
              <View style={styles.pileBlock}>
                <View style={styles.discardCardWrap}>
                  <UnoCard card={gameState.discardTop} small emphasize />
                </View>
                <Text style={styles.pileLabel}>DISCARD</Text>
              </View>
            </View>

            <View style={styles.tableStatus}>
              <View
                style={[styles.statusDot, { backgroundColor: statusColor }]}
              />
              <Text style={styles.tableStatusText}>
                {isMyTurn ? "Your turn" : currentPlayer?.username || "Waiting"}
              </Text>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.handPanel}>
          <View style={styles.handHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.kicker}>YOUR HAND</Text>
              <Text style={styles.handTitle}>{hand.length} cards</Text>
            </View>
            <View style={styles.handBadge}>
              <Text style={styles.handBadgeText}>
                {isMyTurn ? "YOUR TURN" : "PRIVATE"}
              </Text>
            </View>
          </View>

          <ScrollView
            horizontal
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.handScroll}
          >
            {hand.map((card) => {
              const isPlayable = playable.includes(card.id);
              return (
                <View key={card.id} style={styles.handCardWrap}>
                  <UnoCard
                    card={card}
                    playable={isPlayable && isMyTurn}
                    selected={selectedCardId === card.id}
                    disabled={!isPlayable || !isMyTurn}
                    onPress={() => selectCard(card)}
                  />
                </View>
              );
            })}
          </ScrollView>

          <View style={styles.actionPanel}>
            <View style={styles.actionTitleRow}>
              <View>
                <Text style={styles.kicker}>ACTION</Text>
                <Text style={styles.actionTitle}>
                  {isMyTurn
                    ? selectedCard
                      ? "Card selected"
                      : "Choose your move"
                    : "Waiting for turn"}
                </Text>
              </View>
              {canUno ? <Text style={styles.unoReady}>UNO READY</Text> : null}
            </View>

            <View style={styles.actionGrid}>
              <Pressable
                onPress={playSelected}
                disabled={
                  !selectedCard || !canPlay || pendingColor || !connected
                }
                style={({ pressed }) => [
                  styles.actionButton,
                  styles.primaryAction,
                  (!selectedCard || !canPlay || pendingColor || !connected) &&
                    styles.disabledAction,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons name="play" size={18} color={colors.text} />
                <Text style={styles.actionButtonText}>PLAY CARD</Text>
              </Pressable>
              <Pressable
                onPress={drawCard}
                disabled={!canDraw || !connected}
                style={({ pressed }) => [
                  styles.actionButton,
                  styles.secondaryAction,
                  (!canDraw || !connected) && styles.disabledAction,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons name="download" size={18} color={colors.text} />
                <Text style={styles.actionButtonText}>DRAW</Text>
              </Pressable>
            </View>

            <View style={styles.actionGrid}>
              <Pressable
                onPress={() => sendAction(ACTIONS.DECLARE_UNO)}
                disabled={!canUno || !connected}
                style={({ pressed }) => [
                  styles.wideAction,
                  styles.unoAction,
                  (!canUno || !connected) && styles.disabledAction,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons name="megaphone" size={17} color={colors.text} />
                <Text style={styles.actionButtonText}>UNO!</Text>
              </Pressable>
              <Pressable
                onPress={callUno}
                disabled={!canCallUno || !connected}
                style={({ pressed }) => [
                  styles.wideAction,
                  styles.callAction,
                  (!canCallUno || !connected) && styles.disabledAction,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons name="alert-circle" size={17} color={colors.text} />
                <Text style={styles.actionButtonText}>CALL UNO</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.scoresPanel}>
          <View style={styles.scoresHeader}>
            <View>
              <Text style={styles.kicker}>SCOREBOARD</Text>
              <Text style={styles.sectionTitle}>Live points</Text>
            </View>
            <Text style={styles.targetText}>FIRST TO 500</Text>
          </View>
          {gameState.players.map((player) => (
            <View key={player.id} style={styles.scoreRow}>
              <View style={styles.scoreUser}>
                <View
                  style={[
                    styles.scoreDot,
                    player.id === gameState.currentPlayerId && {
                      backgroundColor: colors.gold,
                    },
                  ]}
                />
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={1} style={styles.scoreName}>
                    {player.username}
                    {player.id === user?.id ? " · YOU" : ""}
                  </Text>
                  <Text style={styles.scoreMeta}>
                    {player.cardCount} cards
                    {player.unoDeclared && player.cardCount === 1
                      ? " · UNO"
                      : ""}
                  </Text>
                </View>
              </View>
              <Text style={styles.scoreValue}>{player.score}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {pendingColor ? (
        <Modal transparent visible animationType="fade">
          <View style={styles.modalBackdrop}>
            <View style={styles.colorModal}>
              <Text style={styles.kicker}>WILD CARD</Text>
              <Text style={styles.colorTitle}>CHOOSE COLOR</Text>
              <Text style={styles.colorSub}>
                The server is waiting for your selection.
              </Text>
              <View style={styles.colorGrid}>
                {UNO_COLORS.map((item) => (
                  <Pressable
                    key={item.key}
                    onPress={() => chooseColor(item.key)}
                    style={[
                      styles.colorButton,
                      { backgroundColor: item.color },
                    ]}
                  >
                    <Text style={styles.colorButtonText}>{item.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        </Modal>
      ) : null}

      {gameState.status === "round-complete" ||
      gameState.status === "game-complete" ? (
        <UnoResultPanel
          gameState={gameState}
          canNextRound={!gameState.result?.gameComplete && isHostSeat}
          onNextRound={nextRound}
          onLobby={() => navigation.navigate("Main", { screen: "Lobby" })}
        />
      ) : null}
    </View>
  );
}

function colorFor(color) {
  return UNO_COLORS.find((item) => item.key === color)?.color || colors.text;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  loadingRoot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
    backgroundColor: colors.bg,
  },
  loadingLogo: {
    width: 86,
    height: 86,
    borderRadius: 28,
    backgroundColor: "#191E4A",
    borderWidth: 1,
    borderColor: "#46508A",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingLogoText: { color: colors.white, fontSize: 30, fontWeight: "900" },
  loadingKicker: {
    color: colors.cyan,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.3,
    marginTop: 26,
  },
  loadingTitle: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 10,
  },
  loadingSub: {
    color: colors.muted,
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginTop: 8,
  },
  loadingStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 18,
  },
  loadingStatusText: { color: colors.red, fontWeight: "800" },
  topBar: {
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  brandBlock: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
    flex: 1,
  },
  brandIcon: {
    width: 50,
    height: 50,
    borderRadius: 17,
    backgroundColor: "#191E4A",
    borderWidth: 1,
    borderColor: "#46508A",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },
  brandIconText: { color: colors.white, fontSize: 20, fontWeight: "900" },
  eyebrow: {
    color: colors.cyan,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.4,
  },
  gameTitle: {
    color: colors.text,
    fontSize: 27,
    fontWeight: "900",
    marginTop: 1,
  },
  topMeta: { alignItems: "flex-end" },
  roomPill: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "rgba(18,27,49,0.72)",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  roomLabel: { color: colors.muted, fontSize: 10, fontWeight: "900" },
  roomCode: { color: colors.text, fontSize: 13, fontWeight: "900" },
  livePill: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 7,
    gap: 6,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  liveText: { fontSize: 11, fontWeight: "900", letterSpacing: 1 },
  noticeBanner: {
    marginHorizontal: 20,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: "rgba(247,198,93,0.10)",
    borderWidth: 1,
    borderColor: "rgba(247,198,93,0.28)",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  noticeText: { color: colors.gold, fontWeight: "800", fontSize: 12, flex: 1 },
  errorBanner: {
    marginHorizontal: 20,
    marginTop: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255,107,122,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,107,122,0.28)",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  errorTitle: { color: colors.text, fontWeight: "900", fontSize: 12 },
  errorText: { color: colors.red, fontSize: 12, marginTop: 2, lineHeight: 17 },
  reconnectBanner: {
    marginHorizontal: 20,
    marginTop: 10,
    padding: 10,
    borderRadius: 12,
    backgroundColor: "rgba(247,198,93,0.08)",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  reconnectText: { color: colors.gold, fontSize: 12, fontWeight: "800" },
  infoRow: {
    paddingHorizontal: 20,
    marginTop: 14,
    flexDirection: "row",
    gap: 9,
  },
  infoCard: {
    flex: 1,
    minWidth: 0,
    padding: 12,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "rgba(13,20,38,0.9)",
  },
  turnCard: {
    borderColor: colors.gold,
    backgroundColor: "rgba(247,198,93,0.08)",
  },
  kicker: {
    color: colors.cyan,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  infoValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900",
    marginTop: 7,
  },
  infoSub: { color: colors.muted, fontSize: 10, marginTop: 3 },
  playerStripHeader: {
    paddingHorizontal: 20,
    marginTop: 18,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 10,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
    marginTop: 3,
  },
  callUnoMain: {
    minHeight: 36,
    paddingHorizontal: 11,
    borderRadius: 12,
    backgroundColor: colors.red,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  callUnoMainText: { color: colors.white, fontSize: 11, fontWeight: "900" },
  playerStrip: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 3,
    gap: 9,
  },
  tableWrap: { marginHorizontal: 20, marginTop: 14 },
  table: {
    minHeight: 360,
    borderRadius: 30,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#1A5748",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  tableOuter: {
    position: "absolute",
    width: "86%",
    height: "84%",
    borderRadius: 180,
    borderWidth: 1,
    borderColor: "rgba(72,205,169,0.28)",
  },
  tableInner: {
    position: "absolute",
    width: "66%",
    height: "62%",
    borderRadius: 150,
    borderWidth: 1,
    borderColor: "rgba(72,205,169,0.14)",
  },
  tableTitleWrap: { position: "absolute", top: 30, alignItems: "center" },
  tableKicker: {
    color: "rgba(209,255,243,0.56)",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  tableTitle: {
    color: "rgba(232,255,249,0.86)",
    fontSize: 23,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginTop: 4,
  },
  tableSub: {
    color: colors.gold,
    fontSize: 11,
    fontWeight: "900",
    marginTop: 5,
    letterSpacing: 1,
  },
  centerPiles: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 30,
  },
  pileBlock: { alignItems: "center" },
  pileButton: {
    padding: 3,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "transparent",
  },
  pileButtonActive: {
    borderColor: colors.gold,
    shadowColor: colors.gold,
    shadowOpacity: 0.45,
    shadowRadius: 10,
  },
  discardCardWrap: {
    padding: 3,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  pileLabel: {
    color: "rgba(231,255,248,0.72)",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
    marginTop: 7,
  },
  tableStatus: {
    position: "absolute",
    bottom: 25,
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 13,
    backgroundColor: "rgba(4,18,15,0.72)",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  tableStatusText: { color: colors.text, fontSize: 12, fontWeight: "900" },
  handPanel: {
    marginHorizontal: 20,
    marginTop: 14,
    backgroundColor: "rgba(13,20,38,0.95)",
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  handHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  handTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900",
    marginTop: 4,
  },
  handBadge: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#112539",
  },
  handBadgeText: { color: colors.cyan, fontSize: 9, fontWeight: "900" },
  handScroll: {
    paddingTop: 15,
    paddingBottom: 8,
    paddingHorizontal: 2,
    gap: 9,
  },
  handCardWrap: { paddingTop: 8, paddingRight: 2 },
  actionPanel: {
    marginTop: 4,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 11,
  },
  actionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900",
    marginTop: 3,
  },
  unoReady: {
    color: colors.gold,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
  actionGrid: { flexDirection: "row", gap: 9, marginTop: 8 },
  actionButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
  },
  wideAction: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
  },
  primaryAction: { backgroundColor: colors.primary },
  secondaryAction: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  unoAction: { backgroundColor: "#8B4DFF" },
  callAction: { backgroundColor: colors.red },
  disabledAction: { opacity: 0.38 },
  pressed: { transform: [{ scale: 0.985 }] },
  actionButtonText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.7,
  },
  scoresPanel: {
    marginHorizontal: 20,
    marginTop: 14,
    backgroundColor: "rgba(13,20,38,0.95)",
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  scoresHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  targetText: {
    color: colors.gold,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
  scoreRow: {
    minHeight: 54,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  scoreUser: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
  },
  scoreDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.muted,
    marginRight: 9,
  },
  scoreName: { color: colors.text, fontSize: 12, fontWeight: "900" },
  scoreMeta: { color: colors.muted, fontSize: 10, marginTop: 3 },
  scoreValue: {
    color: colors.gold,
    fontSize: 18,
    fontWeight: "900",
    marginLeft: 10,
  },
  unoReady: {
    color: colors.gold,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(2,5,14,0.86)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  colorModal: {
    width: "100%",
    maxWidth: 450,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 22,
  },
  colorTitle: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "900",
    marginTop: 5,
  },
  colorSub: { color: colors.muted, marginTop: 5, lineHeight: 20 },
  colorGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 18 },
  colorButton: {
    width: "48%",
    minHeight: 58,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  colorButtonText: { color: colors.white, fontWeight: "900", letterSpacing: 1 },
});
