import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radii } from "../../../theme";
import { useAuth } from "../../../context/AuthStore";
import { useSattePeSattaSocket } from "../hooks/useSattePeSattaSocket";
import SattePeSattaCard from "../components/SattePeSattaCard";
import SattePeSattaSeat from "../components/SattePeSattaSeat";
import SattePeSattaResultPanel from "../components/SattePeSattaResultPanel";

const SUITS = [
  { key: "spades", label: "SPADES", symbol: "♠", red: false },
  { key: "hearts", label: "HEARTS", symbol: "♥", red: true },
  { key: "diamonds", label: "DIAMONDS", symbol: "♦", red: true },
  { key: "clubs", label: "CLUBS", symbol: "♣", red: false },
];

function sortCards(cards = []) {
  const suitOrder = new Map(SUITS.map((suit, index) => [suit.key, index]));
  return [...cards].sort(
    (a, b) =>
      (suitOrder.get(a.suit) || 0) - (suitOrder.get(b.suit) || 0) ||
      (a.value || 0) - (b.value || 0),
  );
}

function shortName(value) {
  const name = String(value || "Player");
  return name.length > 15 ? `${name.slice(0, 15)}…` : name;
}

export default function SattePeSattaGameScreen({ route, navigation }) {
  const { roomCode } = route.params || {};
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { state, error, connection, connected, playCard, pass } =
    useSattePeSattaSocket({ roomCode, user });
  const [selectedId, setSelectedId] = useState(null);

  const me = state?.me;
  const isMyTurn = Boolean(
    state?.status === "playing" && state?.currentPlayerId === user?.id,
  );
  const legalIds = useMemo(
    () => new Set(me?.legalMoves || []),
    [me?.legalMoves],
  );
  const sortedHand = useMemo(() => sortCards(me?.hand || []), [me?.hand]);
  const topPlayers = (state?.players || []).filter(
    (player) => player.id !== user?.id,
  );
  const currentPlayer = state?.players?.find(
    (player) => player.id === state.currentPlayerId,
  );
  const roundResult = state?.status === "round-complete" ? state.result : null;
  const gameResult = state?.status === "complete" ? state.result : null;
  const result = roundResult || gameResult;
  const statusColor = connected
    ? colors.green
    : connection === "error"
      ? colors.red
      : colors.amber || colors.gold;

  function handleCardPress(card) {
    if (!isMyTurn || !legalIds.has(card.id)) return;
    setSelectedId(card.id);
    playCard(card.id);
  }

  if (!state) {
    return (
      <View style={styles.loadingRoot}>
        <View style={styles.loadingLogo}>
          <Text style={styles.loadingLogoText}>SU</Text>
        </View>
        <Text style={styles.eyebrow}>SHUFFLEUP · CLASSIC</Text>
        <Text style={styles.loadingTitle}>
          {connection === "reconnecting"
            ? "RESTORING YOUR SEAT"
            : "JOINING THE LIVE TABLE"}
        </Text>
        <Text style={styles.loadingText}>
          {error || "Preparing your cards and sequence table…"}
        </Text>
        <ActivityIndicator color={colors.cyan} style={{ marginTop: 18 }} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={["#07111D", "#06101A", "#07131B"]}
        style={StyleSheet.absoluteFillObject}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingBottom: Math.max(insets.bottom, 12) + 24,
          paddingHorizontal: 12,
        }}
      >
        <View style={styles.topBar}>
          <View style={styles.brand}>
            <View style={styles.brandIcon}>
              <Text style={styles.brandIconText}>SU</Text>
            </View>
            <View style={styles.brandCopy}>
              <Text style={styles.eyebrow}>SHUFFLEUP · CLASSIC</Text>
              <Text style={styles.title}>Satte Pe Satta</Text>
            </View>
          </View>
          <View style={styles.metaWrap}>
            <View style={styles.roomPill}>
              <Text style={styles.roomLabel}>ROOM</Text>
              <Text style={styles.roomCode}>
                {String(roomCode || "").toUpperCase()}
              </Text>
            </View>
            <View style={styles.liveRow}>
              <View
                style={[styles.liveDot, { backgroundColor: statusColor }]}
              />
              <Text style={[styles.liveText, { color: statusColor }]}>
                {connected ? "LIVE" : connection.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {!connected || error ? (
          <View style={styles.banner}>
            <Ionicons
              name={error ? "warning" : "sync"}
              size={15}
              color={error ? colors.red : colors.gold}
            />
            <Text style={styles.bannerText}>
              {error ||
                (connection === "reconnecting"
                  ? "Reconnecting and restoring the table…"
                  : "Connecting to the live table…")}
            </Text>
          </View>
        ) : null}

        <View style={styles.infoRow}>
          <View style={styles.infoCard}>
            <Text style={styles.infoKicker}>ROUND</Text>
            <Text style={styles.infoValue}>{state.roundNumber}/?</Text>
            <Text style={styles.infoSub}>{state.targetScore} point target</Text>
          </View>
          <View style={[styles.infoCard, isMyTurn && styles.infoActive]}>
            <Text style={styles.infoKicker}>TURN</Text>
            <Text numberOfLines={1} style={styles.infoValue}>
              {isMyTurn ? "YOUR TURN" : shortName(currentPlayer?.username)}
            </Text>
            <Text style={styles.infoSub}>Turn {state.turnNumber}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoKicker}>PLAYERS</Text>
            <Text style={styles.infoValue}>{state.players?.length || 0}</Text>
            <Text style={styles.infoSub}>3–8 supported</Text>
          </View>
        </View>

        <View style={styles.tableShell}>
          <LinearGradient
            colors={["#0B4B3A", "#08392D", "#06281F"]}
            style={styles.table}
          >
            <View style={styles.tableRingOuter} />
            <View style={styles.tableRingInner} />

            <View style={styles.playerGrid}>
              {topPlayers.map((player) => (
                <SattePeSattaSeat
                  key={player.id}
                  player={player}
                  active={player.id === state.currentPlayerId}
                />
              ))}
            </View>

            <View style={styles.currentBanner}>
              <Text style={styles.currentKicker}>CURRENT PLAYER</Text>
              <Text style={styles.currentTitle}>
                {isMyTurn
                  ? "YOUR TURN"
                  : `${currentPlayer?.username || "Waiting"}’s turn`}
              </Text>
              <Text style={styles.currentSub}>
                {me?.legalMoves?.length
                  ? "Highlighted cards can be played."
                  : "No legal card available — pass is enabled."}
              </Text>
            </View>

            <View style={styles.sequenceCard}>
              <View style={styles.sequenceHeader}>
                <View>
                  <Text style={styles.sequenceKicker}>CENTRAL SEQUENCE</Text>
                  <Text style={styles.sequenceTitle}>
                    Build outward from the 7s
                  </Text>
                </View>
                <View style={styles.turnPill}>
                  <Text style={styles.turnPillText}>{state.turnNumber}</Text>
                </View>
              </View>

              <View style={styles.sequenceRows}>
                {SUITS.map((suit) => {
                  const row = state.layout?.[suit.key];
                  const cards = [...(row?.cards || [])].sort(
                    (a, b) => (a.value || 0) - (b.value || 0),
                  );
                  return (
                    <View key={suit.key} style={styles.suitRow}>
                      <View style={styles.suitLabelBox}>
                        <Text
                          style={[
                            styles.suitSymbol,
                            suit.red && styles.redText,
                          ]}
                        >
                          {suit.symbol}
                        </Text>
                        <Text style={styles.suitLabel}>{suit.label}</Text>
                      </View>
                      <View style={styles.rowCards}>
                        {cards.length ? (
                          cards.map((card, index) => (
                            <View
                              key={card.id}
                              style={index > 0 ? styles.rowCardOverlap : null}
                            >
                              <SattePeSattaCard card={card} compact />
                            </View>
                          ))
                        ) : (
                          <Text style={styles.emptyRowText}>
                            7 {suit.symbol} opens this row
                          </Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            <View style={styles.youWrap}>
              <SattePeSattaSeat
                player={state.players?.find((p) => p.id === user?.id)}
                isYou
                active={isMyTurn}
              />
            </View>
          </LinearGradient>
        </View>

        <View style={styles.handPanel}>
          <View style={styles.panelHead}>
            <View>
              <Text style={styles.panelKicker}>YOUR HAND</Text>
              <Text style={styles.panelTitle}>{sortedHand.length} cards</Text>
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
            {sortedHand.map((card) => (
              <View key={card.id} style={styles.handCardWrap}>
                <SattePeSattaCard
                  card={card}
                  playable={isMyTurn && legalIds.has(card.id)}
                  selected={selectedId === card.id}
                  onPress={() => handleCardPress(card)}
                />
              </View>
            ))}
          </ScrollView>
          <Text style={styles.handHint}>
            {isMyTurn
              ? legalIds.size
                ? "Tap a highlighted card to place it on the sequence."
                : "No legal card is available. Pass the turn."
              : "Waiting for the current player."}
          </Text>
        </View>

        <View style={styles.scorePanel}>
          <View style={styles.panelHead}>
            <View>
              <Text style={styles.panelKicker}>PENALTIES</Text>
              <Text style={styles.panelTitle}>Live scoreboard</Text>
            </View>
            <Text style={styles.targetText}>TARGET {state.targetScore}</Text>
          </View>
          <View style={styles.scoreList}>
            {[...(state.players || [])]
              .sort(
                (a, b) =>
                  (a.score || 0) - (b.score || 0) ||
                  (a.seat || 0) - (b.seat || 0),
              )
              .map((player, index) => (
                <View
                  key={player.id}
                  style={[
                    styles.scoreRow,
                    player.id === user?.id && styles.scoreRowYou,
                  ]}
                >
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankBadgeText}>{index + 1}</Text>
                  </View>
                  <View style={styles.scoreIdentity}>
                    <Text numberOfLines={1} style={styles.scoreName}>
                      {player.id === user?.id ? "You" : player.username}
                    </Text>
                    <Text style={styles.scoreMeta}>
                      {player.roundScore || 0} this round · {player.cardCount}{" "}
                      cards
                    </Text>
                  </View>
                  <Text style={styles.scoreValue}>{player.score || 0}</Text>
                </View>
              ))}
          </View>
        </View>

        <View style={styles.actionPanel}>
          <View style={styles.panelHead}>
            <View>
              <Text style={styles.panelKicker}>ACTION</Text>
              <Text style={styles.panelTitle}>
                {isMyTurn ? "Your move" : "Waiting"}
              </Text>
            </View>
          </View>
          <Pressable
            disabled={!isMyTurn || legalIds.size > 0 || !connected}
            onPress={pass}
            style={({ pressed }) => [
              styles.passButton,
              (!isMyTurn || legalIds.size > 0 || !connected) &&
                styles.passDisabled,
              pressed && isMyTurn && legalIds.size === 0 && styles.passPressed,
            ]}
          >
            <Ionicons name="play-skip-forward" size={19} color={colors.gold} />
            <Text style={styles.passText}>PASS TURN</Text>
          </Pressable>
          <Text style={styles.actionHint}>
            Pass is available only when the server reports no legal card.
          </Text>
        </View>
      </ScrollView>

      {result ? (
        <SattePeSattaResultPanel
          result={result}
          complete={state.status === "complete"}
          onLobby={() => navigation.navigate("Main", { screen: "Lobby" })}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  loadingRoot: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  loadingLogo: {
    width: 82,
    height: 82,
    borderRadius: 24,
    backgroundColor: "#1E2450",
    borderWidth: 1,
    borderColor: "#3D4C8C",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  loadingLogoText: {
    color: colors.text,
    fontWeight: "900",
    fontSize: 28,
  },
  eyebrow: {
    color: colors.cyan,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  loadingTitle: {
    marginTop: 10,
    color: colors.text,
    fontSize: 28,
    fontWeight: "900",
    textAlign: "center",
  },
  loadingText: {
    marginTop: 8,
    color: colors.muted,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  brand: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
  },
  brandIcon: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: "#1B214E",
    borderWidth: 1,
    borderColor: "#3B4C89",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },
  brandIconText: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900",
  },
  brandCopy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "900",
    marginTop: 2,
  },
  metaWrap: {
    alignItems: "flex-end",
  },
  roomPill: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.surface,
  },
  roomLabel: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
    textAlign: "center",
  },
  roomCode: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900",
    marginTop: 2,
  },
  liveRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 7,
    marginRight: 4,
  },
  liveDot: {
    width: 9,
    height: 9,
    borderRadius: radii.pill,
    marginRight: 6,
  },
  liveText: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  banner: {
    marginTop: 11,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bannerText: {
    flex: 1,
    color: colors.text,
    fontSize: 11,
    lineHeight: 16,
  },
  infoRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },
  infoCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 13,
  },
  infoActive: {
    borderColor: colors.cyan,
    shadowColor: colors.cyan,
    shadowOpacity: 0.12,
    shadowRadius: 9,
  },
  infoKicker: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },
  infoValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
    marginTop: 5,
  },
  infoSub: {
    color: colors.muted,
    fontSize: 9,
    marginTop: 3,
  },
  tableShell: {
    marginTop: 14,
    borderRadius: 30,
    backgroundColor: "#041A12",
    padding: 7,
    overflow: "hidden",
  },
  table: {
    borderRadius: 24,
    padding: 14,
    overflow: "hidden",
    minHeight: 650,
  },
  tableRingOuter: {
    position: "absolute",
    top: 88,
    left: 24,
    right: 24,
    bottom: 64,
    borderRadius: 280,
    borderWidth: 1,
    borderColor: "rgba(102, 226, 186, 0.16)",
  },
  tableRingInner: {
    position: "absolute",
    top: 170,
    left: 74,
    right: 74,
    bottom: 142,
    borderRadius: 220,
    borderWidth: 1,
    borderColor: "rgba(102, 226, 186, 0.12)",
  },
  playerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  currentBanner: {
    marginTop: 13,
    alignSelf: "center",
    minWidth: "68%",
    borderRadius: 18,
    backgroundColor: "rgba(4, 27, 22, 0.9)",
    borderWidth: 1,
    borderColor: "#20584B",
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  currentKicker: {
    color: colors.cyan,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  currentTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900",
    marginTop: 5,
    textAlign: "center",
  },
  currentSub: {
    color: colors.muted,
    fontSize: 10,
    marginTop: 4,
    textAlign: "center",
  },
  sequenceCard: {
    marginTop: 13,
    borderRadius: 20,
    backgroundColor: "rgba(2, 20, 16, 0.9)",
    borderWidth: 1,
    borderColor: "#15534A",
    padding: 12,
  },
  sequenceHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sequenceKicker: {
    color: colors.cyan,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  sequenceTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900",
    marginTop: 3,
  },
  turnPill: {
    minWidth: 34,
    height: 34,
    paddingHorizontal: 9,
    borderRadius: 17,
    backgroundColor: "#153429",
    alignItems: "center",
    justifyContent: "center",
  },
  turnPillText: {
    color: colors.gold,
    fontSize: 11,
    fontWeight: "900",
  },
  sequenceRows: {
    marginTop: 10,
    gap: 5,
  },
  suitRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 53,
    borderRadius: 12,
    paddingHorizontal: 6,
    backgroundColor: "rgba(255,255,255,0.025)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.035)",
  },
  suitLabelBox: {
    width: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  suitSymbol: {
    color: colors.text,
    fontSize: 19,
    fontWeight: "900",
  },
  redText: {
    color: "#EF8290",
  },
  suitLabel: {
    color: colors.muted,
    fontSize: 6,
    fontWeight: "900",
    letterSpacing: 0.5,
    marginTop: 2,
  },
  rowCards: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
    overflow: "hidden",
    paddingLeft: 2,
  },
  rowCardOverlap: {
    marginLeft: -10,
  },
  emptyRowText: {
    color: "#7B9C8E",
    fontSize: 9,
  },
  youWrap: {
    marginTop: 12,
  },
  handPanel: {
    marginTop: 14,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  panelHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  panelKicker: {
    color: colors.cyan,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  panelTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900",
    marginTop: 4,
  },
  privatePill: {
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: "#0D2A2A",
  },
  privateText: {
    color: colors.green,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  handRow: {
    paddingTop: 15,
    paddingHorizontal: 7,
    paddingBottom: 4,
  },
  handCardWrap: {
    marginRight: -11,
    paddingBottom: 4,
  },
  handHint: {
    color: colors.muted,
    fontSize: 10,
    marginTop: 8,
    lineHeight: 15,
  },
  scorePanel: {
    marginTop: 14,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  targetText: {
    color: colors.gold,
    fontSize: 10,
    fontWeight: "900",
  },
  scoreList: {
    marginTop: 10,
    gap: 7,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 13,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 9,
  },
  scoreRowYou: {
    borderColor: colors.cyan,
  },
  rankBadge: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: "#1C2A4A",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
  },
  rankBadgeText: {
    color: colors.gold,
    fontSize: 10,
    fontWeight: "900",
  },
  scoreIdentity: {
    flex: 1,
  },
  scoreName: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "900",
  },
  scoreMeta: {
    color: colors.muted,
    fontSize: 9,
    marginTop: 3,
  },
  scoreValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
  },
  actionPanel: {
    marginTop: 14,
    borderRadius: radii.lg,
    backgroundColor: "#101420",
    borderWidth: 1,
    borderColor: "#4D4022",
    padding: 14,
  },
  passButton: {
    minHeight: 52,
    marginTop: 12,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.gold,
    backgroundColor: "#2B2416",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  passDisabled: {
    opacity: 0.38,
  },
  passPressed: {
    transform: [{ scale: 0.99 }],
  },
  passText: {
    color: colors.gold,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.7,
  },
  actionHint: {
    color: colors.muted,
    fontSize: 9,
    marginTop: 8,
    textAlign: "center",
  },
});
