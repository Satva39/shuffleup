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
import { useAuth } from "../../../context/AuthStore";
import { colors, radii } from "../../../theme";
import useJackThiefSocket from "../hooks/useJackThiefSocket";
import JackThiefCard, { JackThiefCardBack } from "../components/JackThiefCard";
import JackThiefSeat from "../components/JackThiefSeat";
import JackThiefResultPanel from "../components/JackThiefResultPanel";

export default function JackThiefGameScreen({ route, navigation }) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const landscape = width > height;
  const roomCode = route.params?.roomCode;

  const {
    gameState,
    connection,
    connected,
    reconnecting,
    error,
    notice,
    drawCard,
  } = useJackThiefSocket(roomCode, user?.id);

  if (!gameState) {
    return (
      <View style={styles.loadingRoot}>
        <LinearGradient
          colors={["#091228", "#06101A", "#070B17"]}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.loadingLogo}>
          <Text style={styles.loadingLogoText}>SU</Text>
        </View>
        <Text style={styles.loadingKicker}>SHUFFLEUP · JACK THIEF</Text>
        <Text style={styles.loadingTitle}>
          {reconnecting ? "RESTORING YOUR SEAT" : "JOINING THE LIVE TABLE"}
        </Text>
        <Text style={styles.loadingSub}>
          {reconnecting
            ? "Reconnecting and restoring server state…"
            : "Preparing your table and cards…"}
        </Text>
        <ActivityIndicator
          color={colors.cyan}
          size="small"
          style={{ marginTop: 18 }}
        />
        {error ? <Text style={styles.loadingError}>{error}</Text> : null}
      </View>
    );
  }

  if (gameState.status === "complete") {
    return (
      <JackThiefResultPanel
        gameState={gameState}
        onLobby={() => navigation.navigate("Main", { screen: "Lobby" })}
      />
    );
  }

  const players = gameState.players || [];
  const me = players.find((player) => player.id === user?.id);
  const target = players.find(
    (player) => player.id === gameState.targetPlayerId,
  );
  const current = players.find(
    (player) => player.id === gameState.currentPlayerId,
  );
  const isYourTurn =
    gameState.currentPlayerId === user?.id && gameState.status === "playing";
  const canDraw =
    isYourTurn &&
    (gameState.legalActions || []).includes("draw-card") &&
    Boolean(target);
  const statusText = connected
    ? "LIVE"
    : connection === "reconnecting"
      ? "RECONNECTING"
      : connection === "connecting"
        ? "CONNECTING"
        : "OFFLINE";
  const statusColor = connected
    ? colors.green
    : connection === "error" || connection === "offline"
      ? colors.red
      : colors.gold;

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={["#091228", "#06101A", "#07101B"]}
        style={StyleSheet.absoluteFillObject}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingBottom: Math.max(insets.bottom, 14) + 14,
          paddingHorizontal: 14,
        }}
      >
        <View style={styles.header}>
          <View style={styles.brandBlock}>
            <View style={styles.brandIcon}>
              <Text style={styles.brandIconText}>SU</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>SHUFFLEUP</Text>
              <Text style={styles.title}>Jack Thief</Text>
            </View>
          </View>
          <View style={styles.headerMeta}>
            <View style={styles.roomPill}>
              <Text style={styles.roomLabel}>ROOM</Text>
              <Text style={styles.roomCode}>
                {String(roomCode || gameState.roomCode || "").toUpperCase()}
              </Text>
            </View>
            <View style={styles.liveRow}>
              <View
                style={[styles.liveDot, { backgroundColor: statusColor }]}
              />
              <Text style={[styles.liveText, { color: statusColor }]}>
                {statusText}
              </Text>
            </View>
          </View>
        </View>

        {!connected || error ? (
          <View style={[styles.banner, error && styles.errorBanner]}>
            <Ionicons
              name={error ? "warning" : "sync"}
              size={16}
              color={error ? colors.red : colors.gold}
            />
            <Text style={styles.bannerText}>
              {error || "Reconnecting to the live table…"}
            </Text>
          </View>
        ) : null}

        {notice ? (
          <View style={styles.noticeBanner}>
            <Ionicons name="notifications" size={15} color={colors.cyan} />
            <Text style={styles.bannerText}>{notice}</Text>
          </View>
        ) : null}

        <View style={styles.overviewRow}>
          <Info
            label="TURN"
            value={isYourTurn ? "YOUR TURN" : current?.username || "WAITING"}
            highlight={isYourTurn}
          />
          <Info label="TARGET" value={target?.username || "—"} />
          <Info label="PLAYERS" value={`${players.length}/12`} />
        </View>

        <View
          style={[styles.tableWrap, landscape && styles.tableWrapLandscape]}
        >
          <LinearGradient
            colors={["#0B493A", "#0A382D", "#08271F"]}
            style={styles.table}
          >
            <View style={styles.tableOuter} />
            <View style={styles.tableInner} />
            <View style={styles.centerArea}>
              <Text style={styles.centerKicker}>JACK THIEF</Text>
              <Text style={styles.centerTitle}>
                {isYourTurn
                  ? "YOUR TURN"
                  : current
                    ? `${current.username}'S TURN`
                    : "ROUND COMPLETE"}
              </Text>
              <Text style={styles.centerSub}>
                {target
                  ? `DRAW A HIDDEN CARD FROM ${target.username.toUpperCase()}`
                  : "KEEP YOUR MATCHES MOVING"}
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.seatStrip}
            >
              {players
                .filter((player) => player.id !== user?.id)
                .map((player) => (
                  <JackThiefSeat
                    key={player.id}
                    player={player}
                    isYou={false}
                    isCurrentTurn={player.id === gameState.currentPlayerId}
                    isTarget={player.id === gameState.targetPlayerId}
                  />
                ))}
            </ScrollView>

            {target ? (
              <View
                style={[
                  styles.targetPanel,
                  !canDraw && styles.targetPanelInactive,
                ]}
              >
                <View style={styles.targetHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.targetKicker}>DRAW TARGET</Text>
                    <Text numberOfLines={1} style={styles.targetName}>
                      {target.username}
                    </Text>
                  </View>
                  <View style={styles.cardCountPill}>
                    <Text style={styles.cardCountText}>
                      {target.cardCount} CARDS
                    </Text>
                  </View>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.hiddenCards}
                >
                  {Array.from({ length: target.cardCount }).map((_, index) => (
                    <JackThiefCardBack
                      key={`${target.id}-${index}`}
                      index={index}
                      disabled={!canDraw}
                      onPress={() => drawCard(target.id, index)}
                    />
                  ))}
                </ScrollView>
                <Text style={styles.targetHint}>
                  {canDraw
                    ? "Tap any hidden card to draw it."
                    : "The server controls when you can draw."}
                </Text>
              </View>
            ) : null}
          </LinearGradient>
        </View>

        <View style={styles.handPanel}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionKicker}>YOUR HAND</Text>
              <Text style={styles.sectionTitle}>
                {me?.cardCount || gameState.hand?.length || 0} cards
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
            {(gameState.hand || []).map((card) => (
              <JackThiefCard key={card.id} card={card} disabled />
            ))}
          </ScrollView>
          {!gameState.hand?.length ? (
            <Text style={styles.emptyHand}>
              {me?.status === "finished"
                ? "You have finished."
                : "Waiting for your cards…"}
            </Text>
          ) : null}
        </View>

        <View style={styles.actionPanel}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionKicker}>ACTION</Text>
              <Text style={styles.sectionTitle}>
                {isYourTurn
                  ? "Choose a hidden card"
                  : current
                    ? `${current.username}'s move`
                    : "Table updating"}
              </Text>
            </View>
            <View style={[styles.turnPill, isYourTurn && styles.turnPillMine]}>
              <Text style={styles.turnPillText}>
                {isYourTurn ? "YOUR TURN" : "WAITING"}
              </Text>
            </View>
          </View>
          <View style={styles.actionHintRow}>
            <Ionicons
              name="hand-left"
              size={18}
              color={isYourTurn ? colors.cyan : colors.muted}
            />
            <Text style={styles.actionHint}>
              {isYourTurn && target
                ? `Select one of ${target.cardCount} hidden cards from ${target.username}.`
                : "Card ownership, turn order, and legal moves stay server-authoritative."}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function Info({ label, value, highlight }) {
  return (
    <View style={[styles.infoCard, highlight && styles.infoCardHighlight]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text numberOfLines={1} style={styles.infoValue}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  loadingRoot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
    padding: 22,
  },
  loadingLogo: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: "#191D49",
    borderWidth: 1,
    borderColor: "#3A4777",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingLogoText: { color: colors.text, fontSize: 32, fontWeight: "900" },
  loadingKicker: {
    color: colors.cyan,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.6,
    marginTop: 22,
  },
  loadingTitle: {
    color: colors.text,
    fontSize: 25,
    fontWeight: "900",
    marginTop: 10,
    textAlign: "center",
  },
  loadingSub: {
    color: colors.muted,
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },
  loadingError: {
    color: colors.red,
    fontSize: 12,
    marginTop: 14,
    textAlign: "center",
  },
  header: {
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
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: "#191D49",
    borderWidth: 1,
    borderColor: "#36436F",
    alignItems: "center",
    justifyContent: "center",
  },
  brandIconText: { color: colors.text, fontSize: 22, fontWeight: "900" },
  eyebrow: {
    color: colors.cyan,
    fontSize: 10.5,
    fontWeight: "900",
    letterSpacing: 1.4,
    marginLeft: 10,
  },
  title: {
    color: colors.text,
    fontSize: 27,
    fontWeight: "900",
    marginTop: 3,
    marginLeft: 10,
  },
  headerMeta: { alignItems: "flex-end" },
  roomPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roomLabel: { color: colors.muted, fontSize: 10, fontWeight: "900" },
  roomCode: { color: colors.text, fontSize: 13, fontWeight: "900" },
  liveRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 7,
    marginRight: 5,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  liveText: { fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  banner: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "rgba(247,198,93,0.10)",
    borderWidth: 1,
    borderColor: "rgba(247,198,93,0.22)",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  errorBanner: {
    backgroundColor: "rgba(255,107,122,0.10)",
    borderColor: "rgba(255,107,122,0.28)",
  },
  noticeBanner: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
    backgroundColor: "rgba(53,216,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(53,216,255,0.16)",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bannerText: {
    flex: 1,
    color: colors.text,
    fontSize: 11.5,
    fontWeight: "700",
  },
  overviewRow: { flexDirection: "row", gap: 8, marginTop: 14 },
  infoCard: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 11,
  },
  infoCardHighlight: {
    borderColor: colors.gold,
    backgroundColor: "rgba(56,43,16,0.94)",
  },
  infoLabel: {
    color: colors.muted,
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  infoValue: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "900",
    marginTop: 6,
  },
  tableWrap: {
    marginTop: 14,
    borderRadius: 30,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#133F35",
    backgroundColor: "#08231D",
  },
  tableWrapLandscape: { maxHeight: 430 },
  table: { minHeight: 520, padding: 12, position: "relative" },
  tableOuter: {
    position: "absolute",
    left: 12,
    right: 12,
    top: 12,
    bottom: 12,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: "rgba(38,115,98,0.50)",
  },
  tableInner: {
    position: "absolute",
    left: 42,
    right: 42,
    top: 94,
    bottom: 84,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(58,151,130,0.36)",
  },
  centerArea: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 36,
    paddingHorizontal: 24,
  },
  centerKicker: {
    color: "rgba(232,246,240,0.56)",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 2.4,
  },
  centerTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900",
    marginTop: 7,
    textAlign: "center",
  },
  centerSub: {
    color: "rgba(232,246,240,0.62)",
    fontSize: 10.5,
    fontWeight: "800",
    marginTop: 6,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  seatStrip: {
    paddingHorizontal: 8,
    gap: 8,
    paddingTop: 26,
    paddingBottom: 18,
  },
  targetPanel: {
    marginTop: 2,
    marginHorizontal: 4,
    padding: 14,
    borderRadius: 22,
    backgroundColor: "rgba(6,16,23,0.78)",
    borderWidth: 1,
    borderColor: "rgba(77,172,150,0.30)",
  },
  targetPanelInactive: { opacity: 0.86 },
  targetHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  targetKicker: {
    color: colors.cyan,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.4,
  },
  targetName: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
    marginTop: 2,
  },
  cardCountPill: {
    backgroundColor: colors.surface2,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardCountText: { color: colors.muted, fontSize: 9, fontWeight: "900" },
  hiddenCards: { gap: 7, paddingTop: 12, paddingBottom: 4 },
  targetHint: {
    color: colors.muted,
    fontSize: 9.5,
    fontWeight: "700",
    marginTop: 6,
  },
  handPanel: {
    marginTop: 14,
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 15,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  sectionKicker: {
    color: colors.cyan,
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: "900",
    marginTop: 4,
  },
  privatePill: {
    backgroundColor: "rgba(74,222,128,0.10)",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
  },
  privateText: { color: colors.green, fontSize: 9, fontWeight: "900" },
  handRow: { gap: 8, paddingTop: 14, paddingBottom: 2 },
  emptyHand: { color: colors.muted, fontSize: 11, marginTop: 14 },
  actionPanel: {
    marginTop: 14,
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 15,
  },
  turnPill: {
    backgroundColor: colors.surface2,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  turnPillMine: { backgroundColor: "rgba(247,198,93,0.15)" },
  turnPillText: { color: colors.muted, fontSize: 8.5, fontWeight: "900" },
  actionHintRow: {
    marginTop: 13,
    padding: 12,
    borderRadius: 16,
    backgroundColor: "#101A2C",
    flexDirection: "row",
    gap: 9,
    alignItems: "center",
  },
  actionHint: {
    flex: 1,
    color: colors.muted,
    fontSize: 11,
    lineHeight: 17,
    fontWeight: "700",
  },
});
