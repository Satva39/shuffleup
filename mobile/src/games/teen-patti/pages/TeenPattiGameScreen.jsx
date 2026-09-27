import { useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../../context/AuthStore";
import { colors, radii } from "../../../theme";
import useTeenPattiSocket from "../hooks/useTeenPattiSocket";
import TeenPattiCard from "../components/TeenPattiCard";
import TeenPattiSeat from "../components/TeenPattiSeat";
import TeenPattiResultPanel from "../components/TeenPattiResultPanel";

const SEAT_POSITIONS = {
  3: [
    { left: "50%", bottom: 12 },
    { left: 8, top: 22 },
    { right: 8, top: 22 },
  ],
  4: [
    { left: "50%", bottom: 12 },
    { left: 8, top: "31%" },
    { left: "50%", top: 12 },
    { right: 8, top: "31%" },
  ],
  5: [
    { left: "50%", bottom: 12 },
    { left: 8, bottom: "25%" },
    { left: 12, top: 18 },
    { right: 12, top: 18 },
    { right: 8, bottom: "25%" },
  ],
  6: [
    { left: "50%", bottom: 10 },
    { left: 6, bottom: "21%" },
    { left: 10, top: 20 },
    { left: "50%", top: 10 },
    { right: 10, top: 20 },
    { right: 6, bottom: "21%" },
  ],
};

function getRelativePlayers(players, userId) {
  const local = players.find((player) => player.id === userId);
  if (!local) return players;
  return [...players]
    .sort((a, b) => a.seat - b.seat)
    .sort(
      (a, b) =>
        ((a.seat - local.seat + players.length) % players.length) -
        ((b.seat - local.seat + players.length) % players.length),
    );
}

export default function TeenPattiGameScreen({ route, navigation }) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const landscape = width > height;
  const roomCode = route.params?.roomCode;

  const {
    gameState,
    error,
    connection,
    connected,
    reconnecting,
    sendAction,
    reconnectGame,
  } = useTeenPattiSocket(roomCode, user?.id);

  const players = gameState?.players || [];
  const currentPlayer = players.find(
    (player) => player.id === gameState?.currentPlayerId,
  );
  const localPlayer = players.find((player) => player.id === user?.id);
  const isMyTurn =
    gameState?.currentPlayerId === user?.id && localPlayer?.status === "active";
  const legalActions = gameState?.legalActions || [];
  const relativePlayers = useMemo(
    () => getRelativePlayers(players, user?.id),
    [players, user?.id],
  );
  const seatPositions = SEAT_POSITIONS[players.length] || SEAT_POSITIONS[6];

  if (!gameState) {
    return (
      <View style={styles.loadingRoot}>
        <View style={styles.loadingIcon}>
          <Text style={styles.loadingIconText}>SU</Text>
        </View>
        <Text style={styles.eyebrow}>SHUFFLEUP · TEEN PATTI</Text>
        <Text style={styles.loadingTitle}>
          {reconnecting ? "RESTORING YOUR SEAT" : "JOINING THE LIVE TABLE"}
        </Text>
        <Text style={styles.loadingSub}>
          {reconnecting
            ? "Reconnecting and restoring the server-authoritative game state…"
            : "Preparing your cards and table…"}
        </Text>
        <ActivityIndicator color={colors.cyan} style={{ marginTop: 18 }} />
        {error ? <Text style={styles.loadingError}>{error}</Text> : null}
      </View>
    );
  }

  if (
    gameState.status === "complete" ||
    gameState.status === "round-complete"
  ) {
    return (
      <View style={styles.root}>
        <LinearGradient
          colors={["#071229", "#061019", "#07101B"]}
          style={StyleSheet.absoluteFillObject}
        />
        <TeenPattiResultPanel
          gameState={gameState}
          userId={user?.id}
          onNextRound={() => sendAction("next-round")}
          onLobby={() => navigation.navigate("Main", { screen: "Lobby" })}
        />
      </View>
    );
  }

  const connectionColor =
    connection === "connected"
      ? colors.green
      : connection === "error" || connection === "offline"
        ? colors.red
        : colors.gold;

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={landscape ? ["#061126", "#061019"] : ["#08152D", "#061019"]}
        style={StyleSheet.absoluteFillObject}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingHorizontal: landscape ? 26 : 16,
          paddingBottom: Math.max(insets.bottom, 12) + 14,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <View style={styles.brandBlock}>
            <View style={styles.brandIcon}>
              <Text style={styles.brandIconText}>SU</Text>
            </View>
            <View style={styles.brandText}>
              <Text style={styles.eyebrow}>SHUFFLEUP</Text>
              <Text style={styles.gameTitle}>Teen Patti</Text>
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
                style={[styles.liveDot, { backgroundColor: connectionColor }]}
              />
              <Text style={[styles.liveText, { color: connectionColor }]}>
                {connection === "connected"
                  ? "LIVE"
                  : connection === "reconnecting"
                    ? "RECONNECTING"
                    : connection === "connecting"
                      ? "CONNECTING"
                      : "OFFLINE"}
              </Text>
            </View>
          </View>
        </View>

        {error ? (
          <View style={styles.errorBanner}>
            <Ionicons name="warning-outline" size={16} color={colors.red} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {!connected && (
          <Pressable onPress={reconnectGame} style={styles.reconnectBanner}>
            <Ionicons name="refresh" size={15} color={colors.gold} />
            <Text style={styles.reconnectText}>Restore connection</Text>
          </Pressable>
        )}

        <View style={[styles.table, landscape && styles.tableLandscape]}>
          <View style={styles.tableGlow} />
          <View style={styles.tableBrand}>
            <Text style={styles.tableBrandTop}>TEEN PATTI</Text>
            <Text style={styles.tableBrandSub}>
              ROUND {gameState.round} / {gameState.totalRounds || 11}
            </Text>
          </View>

          <View style={styles.centerPot}>
            <View style={styles.potBadge}>
              <Text style={styles.potKicker}>PLAYING</Text>
              <Text style={styles.potValue}>
                {currentPlayer?.id === user?.id
                  ? "YOUR TURN"
                  : currentPlayer?.username || "WAITING"}
              </Text>
            </View>
          </View>

          {relativePlayers.map((player, index) => {
            const position = seatPositions[index];
            const offsetStyle = {
              position: "absolute",
              ...position,
              transform:
                typeof position.left === "string" ||
                typeof position.right === "string"
                  ? [{ translateX: -52 }]
                  : undefined,
            };
            return (
              <View key={player.id} style={offsetStyle}>
                <TeenPattiSeat
                  player={player}
                  isLocal={player.id === user?.id}
                  isTurn={player.id === gameState.currentPlayerId}
                />
              </View>
            );
          })}
        </View>

        <View style={styles.privateSection}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionKicker}>YOUR HAND</Text>
              <Text style={styles.sectionTitle}>Three cards</Text>
            </View>
            <Text style={styles.visibility}>PRIVATE</Text>
          </View>
          <View style={styles.handRow}>
            {(gameState.cards || []).map((card) => (
              <TeenPattiCard key={card.id} card={card} />
            ))}
          </View>
        </View>

        <View
          style={[styles.actionPanel, isMyTurn && styles.actionPanelActive]}
        >
          <View style={styles.actionHeader}>
            <View>
              <Text style={styles.sectionKicker}>ACTION</Text>
              <Text style={styles.sectionTitle}>
                {isMyTurn
                  ? "Your move"
                  : currentPlayer
                    ? `${currentPlayer.username}'s move`
                    : "Table state"}
              </Text>
            </View>
            <Text style={styles.turnRound}>
              {gameState.round} / {gameState.totalRounds || 11}
            </Text>
          </View>

          <View style={styles.actionRow}>
            <Pressable
              disabled={
                !connected || !isMyTurn || !legalActions.includes("play")
              }
              onPress={() => sendAction("play")}
              style={({ pressed }) => [
                styles.actionButton,
                styles.playButton,
                (!connected || !isMyTurn || !legalActions.includes("play")) &&
                  styles.disabled,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons name="play" size={18} color="#07101A" />
              <Text style={styles.playButtonText}>PLAY</Text>
            </Pressable>

            <Pressable
              disabled={
                !connected || !isMyTurn || !legalActions.includes("fold")
              }
              onPress={() => sendAction("fold")}
              style={({ pressed }) => [
                styles.actionButton,
                styles.foldButton,
                (!connected || !isMyTurn || !legalActions.includes("fold")) &&
                  styles.disabled,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons name="close" size={20} color={colors.text} />
              <Text style={styles.foldButtonText}>FOLD</Text>
            </Pressable>
          </View>

          <Text style={styles.actionNote}>
            Actions and turn validity are enforced by the ShuffleUp server.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  loadingRoot: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
  },
  loadingIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: "rgba(124,92,255,0.18)",
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingIconText: { color: colors.text, fontSize: 18, fontWeight: "900" },
  eyebrow: {
    color: colors.cyan,
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 1.3,
  },
  loadingTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 8,
  },
  loadingSub: {
    color: colors.muted,
    textAlign: "center",
    lineHeight: 20,
    marginTop: 7,
  },
  loadingError: { color: colors.red, textAlign: "center", marginTop: 14 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 8,
  },
  brandBlock: { flexDirection: "row", alignItems: "center", flex: 1 },
  brandText: { marginLeft: 9 },
  brandIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "rgba(124,92,255,0.18)",
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  brandIconText: { color: colors.text, fontSize: 13, fontWeight: "900" },
  gameTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: "900",
    marginTop: 2,
  },
  topMeta: { alignItems: "flex-end", gap: 6 },
  roomPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roomLabel: { color: colors.muted, fontSize: 8, fontWeight: "900" },
  roomCode: {
    color: colors.text,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
  livePill: { flexDirection: "row", alignItems: "center", gap: 5 },
  liveDot: { width: 7, height: 7, borderRadius: 4 },
  liveText: { fontSize: 8.5, fontWeight: "900", letterSpacing: 0.9 },
  errorBanner: {
    marginTop: 10,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,107,122,0.25)",
    backgroundColor: "rgba(255,107,122,0.08)",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  errorText: { flex: 1, color: "#FFADB7", fontSize: 11, lineHeight: 16 },
  reconnectBanner: {
    marginTop: 8,
    minHeight: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(247,198,93,0.22)",
    backgroundColor: "rgba(247,198,93,0.08)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  reconnectText: { color: colors.gold, fontSize: 11, fontWeight: "900" },
  table: {
    height: 390,
    marginTop: 10,
    borderRadius: 34,
    overflow: "hidden",
    backgroundColor: "#123D35",
    borderWidth: 8,
    borderColor: "#0A231F",
    position: "relative",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  tableLandscape: { height: 350 },
  tableGlow: {
    position: "absolute",
    left: "12%",
    right: "12%",
    top: "14%",
    bottom: "14%",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(116,255,211,0.18)",
    backgroundColor: "rgba(7,21,26,0.13)",
  },
  tableBrand: {
    position: "absolute",
    alignSelf: "center",
    top: "39%",
    alignItems: "center",
  },
  tableBrandTop: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1.7,
  },
  tableBrandSub: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginTop: 3,
  },
  centerPot: { position: "absolute", alignSelf: "center", top: "54%" },
  potBadge: {
    minWidth: 120,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
    backgroundColor: "rgba(3,11,14,0.6)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
  },
  potKicker: {
    color: colors.muted,
    fontSize: 7.5,
    fontWeight: "900",
    letterSpacing: 1,
  },
  potValue: {
    color: colors.text,
    fontSize: 10.5,
    fontWeight: "900",
    marginTop: 2,
  },
  privateSection: {
    marginTop: 12,
    padding: 14,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionKicker: {
    color: colors.cyan,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900",
    marginTop: 3,
  },
  visibility: {
    color: colors.green,
    fontSize: 8,
    fontWeight: "900",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(74,222,128,0.09)",
  },
  handRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginTop: 13,
  },
  actionPanel: {
    marginTop: 12,
    padding: 14,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 2,
  },
  actionPanelActive: {
    borderColor: "rgba(247,198,93,0.34)",
    backgroundColor: "rgba(247,198,93,0.045)",
  },
  actionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  turnRound: { color: colors.gold, fontSize: 10, fontWeight: "900" },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  actionButton: {
    flex: 1,
    minHeight: 56,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  playButton: { backgroundColor: colors.gold },
  foldButton: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  playButtonText: {
    color: "#07101A",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  foldButtonText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  disabled: { opacity: 0.35 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.985 }] },
  actionNote: {
    color: colors.muted,
    fontSize: 9.5,
    lineHeight: 14,
    textAlign: "center",
    marginTop: 10,
  },
});
