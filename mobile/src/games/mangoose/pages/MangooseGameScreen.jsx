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
import useMangooseSocket from "../hooks/useMangooseSocket";
import MangooseCard from "../components/MangooseCard";
import MangooseSeat from "../components/MangooseSeat";
import MangooseResultPanel from "../components/MangooseResultPanel";

const SUITS = ["spades", "hearts", "diamonds", "clubs"];
const SUIT_SYMBOLS = { spades: "♠", hearts: "♥", diamonds: "♦", clubs: "♣" };
const ACTIONS = {
  FLIP: "flip",
  PLAY_CENTER: "play-center",
  PLAY_OPPONENT: "play-opponent",
  PLAY_OPEN: "play-open",
  PLAY_OWN: "play-own",
  CALL_MONGOOSE: "call-mongoose",
};

export default function MangooseGameScreen({ route, navigation }) {
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
    sendAction,
  } = useMangooseSocket(roomCode, user?.id);

  if (!gameState) {
    return (
      <View style={styles.loadingRoot}>
        <View style={styles.loadingLogo}>
          <Text style={styles.loadingLogoText}>SU</Text>
        </View>
        <Text style={styles.loadingKicker}>SHUFFLEUP · MANGOOSE</Text>
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
        {error ? <Text style={styles.loadingError}>{error}</Text> : null}
      </View>
    );
  }

  if (gameState.status === "complete") {
    return (
      <MangooseResultPanel
        result={gameState.result}
        players={gameState.players || []}
        onLobby={() => navigation.navigate("Main", { screen: "Lobby" })}
      />
    );
  }

  const players = gameState.players || [];
  const opponents = players.filter((player) => player.id !== user?.id);
  const currentPlayer = players.find(
    (player) => player.id === gameState.currentPlayerId,
  );
  const isYourTurn = gameState.currentPlayerId === user?.id;
  const legalActions = gameState.legalActions || [];
  const legalTargets = gameState.legalTargets || {
    center: [],
    opponents: [],
    canSelfDrop: false,
  };
  const pending = gameState.pendingMongoose;
  const canCall =
    gameState.canCallMongoose && legalActions.includes(ACTIONS.CALL_MONGOOSE);

  const send = (action, target = null) => sendAction(action, target);

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={["#071426", "#061019", "#08131E"]}
        style={StyleSheet.absoluteFillObject}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingBottom: Math.max(insets.bottom, 14) + 18,
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
              <Text style={styles.gameTitle}>Mangoose</Text>
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
                style={[
                  styles.liveDot,
                  { backgroundColor: connected ? colors.green : colors.gold },
                ]}
              />
              <Text
                style={[
                  styles.liveText,
                  { color: connected ? colors.green : colors.gold },
                ]}
              >
                {connection === "connected"
                  ? "LIVE"
                  : connection === "reconnecting"
                    ? "RECONNECTING"
                    : connection.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {!connected || error ? (
          <View style={[styles.banner, error ? styles.errorBanner : null]}>
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
            <Ionicons name="megaphone" size={15} color={colors.cyan} />
            <Text style={styles.bannerText}>{notice.message}</Text>
          </View>
        ) : null}

        <View style={[styles.infoRow, landscape && styles.infoRowLandscape]}>
          <Info
            label="TURN"
            value={
              isYourTurn ? "YOUR TURN" : currentPlayer?.username || "WAITING"
            }
            highlight={isYourTurn}
          />
          <Info label="TURN #" value={String(gameState.turnNumber || 1)} />
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

            <View style={styles.opponentsRow}>
              {opponents.slice(0, landscape ? 6 : 4).map((player) => (
                <MangooseSeat
                  key={player.id}
                  player={player}
                  isYou={false}
                  isCurrentTurn={player.id === gameState.currentPlayerId}
                  canTarget={legalTargets.opponents?.includes(player.id)}
                  onTarget={(id) => send(ACTIONS.PLAY_OPPONENT, id)}
                />
              ))}
            </View>

            <View style={styles.centerContent}>
              <Text style={styles.centerKicker}>MONGOOSE</Text>
              <Text style={styles.centerRound}>
                TURN {gameState.turnNumber || 1}
              </Text>
              <View
                style={[
                  styles.turnCard,
                  isYourTurn && styles.turnCardMine,
                  pending && styles.turnCardPending,
                ]}
              >
                <Text style={styles.turnKicker}>
                  {pending
                    ? canCall
                      ? "MONGOOSE CALL"
                      : "WAITING"
                    : isYourTurn
                      ? "PLAYING"
                      : "CURRENT TURN"}
                </Text>
                <Text numberOfLines={1} style={styles.turnValue}>
                  {pending
                    ? pending.offenderUsername
                    : isYourTurn
                      ? "YOUR TURN"
                      : currentPlayer?.username || "PLAYER"}
                </Text>
              </View>

              <View style={styles.centerStacksRow}>
                {gameState.centerStacks?.map((stack) => {
                  const canPlay = legalTargets.center?.includes(stack.suit);
                  const topCard = stack.topCard;
                  return (
                    <Pressable
                      key={stack.suit}
                      onPress={
                        canPlay
                          ? () => send(ACTIONS.PLAY_CENTER, stack.suit)
                          : undefined
                      }
                      disabled={!canPlay}
                      style={[
                        styles.foundation,
                        canPlay && styles.foundationTarget,
                      ]}
                    >
                      {topCard ? (
                        <MangooseCard card={topCard} compact disabled />
                      ) : (
                        <Text style={styles.foundationEmpty}>
                          A{SUIT_SYMBOLS[stack.suit]}
                        </Text>
                      )}
                      <Text style={styles.foundationCount}>
                        {stack.cardCount || 0}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.localSeatWrap}>
              <MangooseSeat
                player={
                  players.find((player) => player.id === user?.id) || {
                    username: "You",
                  }
                }
                isYou
                isCurrentTurn={isYourTurn}
              />
            </View>
          </LinearGradient>
        </View>

        <View style={styles.handPanel}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionKicker}>YOUR PILES</Text>
              <Text style={styles.sectionTitle}>Your cards</Text>
            </View>
            <View style={styles.countPill}>
              <Text style={styles.countPillText}>
                {(gameState.closedCount || 0) +
                  (gameState.openCount || 0) +
                  (gameState.flippedCard ? 1 : 0)}{" "}
                CARDS
              </Text>
            </View>
          </View>

          <View style={styles.pileRow}>
            <Pile
              title="CLOSED PILE"
              count={gameState.closedCount}
              cardHidden
              onPress={
                legalActions.includes(ACTIONS.FLIP)
                  ? () => send(ACTIONS.FLIP)
                  : undefined
              }
            />
            <Pile title="REVEALED" card={gameState.flippedCard} selected />
            <Pile
              title="YOUR OPEN PILE"
              count={gameState.openCount}
              card={gameState.openTopCard}
              onPress={
                legalActions.includes(ACTIONS.PLAY_OPEN)
                  ? () => send(ACTIONS.PLAY_OPEN)
                  : undefined
              }
            />
          </View>
        </View>

        <View style={styles.actionPanel}>
          <View style={styles.actionHeader}>
            <View>
              <Text style={styles.sectionKicker}>ACTION</Text>
              <Text style={styles.sectionTitle}>
                {pending
                  ? canCall
                    ? "Call Mongoose"
                    : "Table decision"
                  : isYourTurn
                    ? "Your move"
                    : `${currentPlayer?.username || "Player"}'s move`}
              </Text>
            </View>
          </View>

          {pending ? (
            canCall ? (
              <Pressable
                onPress={() => send(ACTIONS.CALL_MONGOOSE, pending.offenderId)}
                style={({ pressed }) => [
                  styles.primaryButton,
                  styles.mongooseButton,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons name="alert-circle" size={22} color="#08101E" />
                <Text style={styles.primaryButtonText}>MONGOOSE!</Text>
              </Pressable>
            ) : (
              <View style={styles.waitingAction}>
                <ActivityIndicator color={colors.gold} size="small" />
                <Text style={styles.waitingText}>WAITING FOR THE TABLE…</Text>
              </View>
            )
          ) : gameState.flippedCard ? (
            <View style={styles.actionButtons}>
              <Pressable
                disabled={
                  !isYourTurn || !legalActions.includes(ACTIONS.PLAY_OWN)
                }
                onPress={() => send(ACTIONS.PLAY_OWN)}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  (!isYourTurn || !legalActions.includes(ACTIONS.PLAY_OWN)) &&
                    styles.disabledButton,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons
                  name="arrow-down-circle"
                  size={20}
                  color={colors.text}
                />
                <Text style={styles.secondaryButtonText}>DROP / END TURN</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.actionButtons}>
              <Pressable
                disabled={!isYourTurn || !legalActions.includes(ACTIONS.FLIP)}
                onPress={() => send(ACTIONS.FLIP)}
                style={({ pressed }) => [
                  styles.primaryButton,
                  (!isYourTurn || !legalActions.includes(ACTIONS.FLIP)) &&
                    styles.disabledButton,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons name="layers" size={20} color="#08101E" />
                <Text style={styles.primaryButtonText}>TAKE FROM CLOSED</Text>
              </Pressable>
              <Pressable
                disabled={
                  !isYourTurn || !legalActions.includes(ACTIONS.PLAY_OPEN)
                }
                onPress={() => send(ACTIONS.PLAY_OPEN)}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  (!isYourTurn || !legalActions.includes(ACTIONS.PLAY_OPEN)) &&
                    styles.disabledButton,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons name="albums" size={20} color={colors.text} />
                <Text style={styles.secondaryButtonText}>TAKE FROM OPEN</Text>
              </Pressable>
            </View>
          )}

          {gameState.flippedCard && isYourTurn ? (
            <Text style={styles.helperText}>
              {legalTargets.center?.length || legalTargets.opponents?.length
                ? "Choose a highlighted destination or drop the card onto your own pile."
                : "No legal destination. Drop the revealed card to end your turn."}
            </Text>
          ) : null}
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

function Pile({ title, count = 0, card, cardHidden, selected, onPress }) {
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      style={[styles.pile, onPress && styles.pileActive]}
    >
      <Text style={styles.pileTitle}>{title}</Text>
      {cardHidden ? (
        <MangooseCard hidden onPress={onPress} disabled={!onPress} />
      ) : card ? (
        <MangooseCard card={card} selected={selected} disabled />
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyCardText}>EMPTY</Text>
        </View>
      )}
      <View style={styles.pileCount}>
        <Text style={styles.pileCountText}>{count}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  loadingRoot: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  loadingLogo: {
    width: 74,
    height: 74,
    borderRadius: 24,
    backgroundColor: "#171C4C",
    borderWidth: 1,
    borderColor: "#344170",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingLogoText: { color: colors.text, fontSize: 27, fontWeight: "900" },
  loadingKicker: {
    color: colors.cyan,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginTop: 18,
  },
  loadingTitle: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 10,
  },
  loadingSub: {
    color: colors.muted,
    fontSize: 13,
    textAlign: "center",
    marginTop: 8,
  },
  loadingError: {
    color: colors.red,
    fontSize: 12,
    textAlign: "center",
    marginTop: 14,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  brandBlock: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  brandIcon: {
    width: 55,
    height: 55,
    borderRadius: 18,
    backgroundColor: "#171C4C",
    borderWidth: 1,
    borderColor: "#2D3C69",
    alignItems: "center",
    justifyContent: "center",
  },
  brandIconText: { color: colors.text, fontSize: 21, fontWeight: "900" },
  eyebrow: {
    color: colors.cyan,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.3,
  },
  gameTitle: {
    color: colors.text,
    fontSize: 25,
    fontWeight: "900",
    marginTop: 3,
  },
  headerMeta: { alignItems: "flex-end", gap: 8 },
  roomPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(14,22,43,0.95)",
    borderWidth: 1,
    borderColor: colors.border,
  },
  roomLabel: { color: colors.muted, fontSize: 9, fontWeight: "900" },
  roomCode: { color: colors.text, fontSize: 13, fontWeight: "900" },
  liveRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  liveText: { fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  banner: {
    minHeight: 40,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(247,198,93,0.24)",
    backgroundColor: "rgba(247,198,93,0.08)",
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  errorBanner: {
    borderColor: "rgba(255,107,122,0.28)",
    backgroundColor: "rgba(255,107,122,0.08)",
  },
  noticeBanner: {
    minHeight: 40,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(53,216,255,0.24)",
    backgroundColor: "rgba(53,216,255,0.08)",
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  bannerText: {
    color: colors.text,
    fontSize: 10.5,
    fontWeight: "800",
    flex: 1,
  },
  infoRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  infoRowLandscape: { maxWidth: 720, alignSelf: "center", width: "100%" },
  infoCard: {
    flex: 1,
    minWidth: 0,
    padding: 10,
    borderRadius: 15,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoCardHighlight: {
    borderColor: colors.cyan,
    backgroundColor: "rgba(53,216,255,0.08)",
  },
  infoLabel: {
    color: colors.muted,
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 1.1,
  },
  infoValue: {
    color: colors.text,
    fontSize: 11,
    fontWeight: "900",
    marginTop: 4,
  },
  tableWrap: {
    width: "100%",
    aspectRatio: 0.82,
    maxHeight: 570,
    borderRadius: 34,
    overflow: "hidden",
    marginBottom: 14,
  },
  tableWrapLandscape: {
    aspectRatio: 1.45,
    maxHeight: 520,
    maxWidth: 860,
    alignSelf: "center",
  },
  table: { flex: 1, position: "relative", alignItems: "center", padding: 14 },
  tableOuter: {
    position: "absolute",
    inset: 7,
    borderRadius: 31,
    borderWidth: 1,
    borderColor: "rgba(52,160,135,0.34)",
  },
  tableInner: {
    position: "absolute",
    left: "16%",
    right: "16%",
    top: "19%",
    bottom: "19%",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(52,160,135,0.25)",
  },
  opponentsRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "flex-start",
    gap: 8,
    flexWrap: "wrap",
    zIndex: 2,
    minHeight: 92,
  },
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    zIndex: 1,
  },
  centerKicker: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 3,
  },
  centerRound: {
    color: "rgba(255,255,255,0.38)",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.4,
    marginTop: 3,
  },
  turnCard: {
    marginTop: 12,
    minWidth: 190,
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 22,
    backgroundColor: "rgba(4,22,23,0.88)",
    borderWidth: 1,
    borderColor: "rgba(99,178,158,0.20)",
    alignItems: "center",
  },
  turnCardMine: {
    borderColor: colors.cyan,
    backgroundColor: "rgba(53,216,255,0.08)",
  },
  turnCardPending: {
    borderColor: colors.gold,
    backgroundColor: "rgba(247,198,93,0.08)",
  },
  turnKicker: {
    color: colors.muted,
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  turnValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900",
    marginTop: 4,
    maxWidth: 200,
  },
  centerStacksRow: {
    marginTop: 18,
    flexDirection: "row",
    gap: 7,
    justifyContent: "center",
  },
  foundation: {
    width: 64,
    minHeight: 87,
    borderRadius: 16,
    backgroundColor: "rgba(4,26,28,0.70)",
    borderWidth: 1,
    borderColor: "rgba(67,116,108,0.35)",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 5,
  },
  foundationTarget: {
    borderColor: colors.cyan,
    backgroundColor: "rgba(53,216,255,0.10)",
  },
  foundationEmpty: {
    color: "rgba(255,255,255,0.56)",
    fontSize: 20,
    fontWeight: "900",
  },
  foundationCount: {
    color: colors.muted,
    fontSize: 8,
    fontWeight: "900",
    marginTop: 2,
  },
  localSeatWrap: { width: "100%", alignItems: "center", zIndex: 2 },
  handPanel: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 15,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  sectionKicker: {
    color: colors.cyan,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.25,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900",
    marginTop: 3,
  },
  countPill: {
    borderRadius: 999,
    backgroundColor: "rgba(74,222,128,0.10)",
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  countPillText: { color: colors.green, fontSize: 9, fontWeight: "900" },
  pileRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 13,
  },
  pile: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    padding: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
  },
  pileActive: {
    borderColor: colors.cyan,
    backgroundColor: "rgba(53,216,255,0.06)",
  },
  pileTitle: {
    color: colors.muted,
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 0.7,
    marginBottom: 7,
  },
  pileCount: {
    marginTop: 6,
    minWidth: 24,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 3,
    backgroundColor: colors.surface,
  },
  pileCountText: {
    color: colors.text,
    fontSize: 9,
    fontWeight: "900",
    textAlign: "center",
  },
  emptyCard: {
    width: 68,
    height: 94,
    borderRadius: radii.md,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyCardText: { color: colors.muted, fontSize: 8, fontWeight: "900" },
  actionPanel: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 15,
  },
  actionHeader: { marginBottom: 12 },
  actionButtons: { gap: 9 },
  primaryButton: {
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: colors.gold,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  secondaryButton: {
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  mongooseButton: { backgroundColor: colors.gold },
  primaryButtonText: {
    color: "#08101E",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 11.5,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
  disabledButton: { opacity: 0.45 },
  waitingAction: {
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  waitingText: { color: colors.muted, fontSize: 11, fontWeight: "900" },
  helperText: {
    color: colors.muted,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 10,
    textAlign: "center",
  },
  pressed: { opacity: 0.84 },
});
