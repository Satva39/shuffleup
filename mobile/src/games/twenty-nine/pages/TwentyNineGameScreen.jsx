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
import useTwentyNineSocket from "../hooks/useTwentyNineSocket";
import TwentyNineCard from "../components/TwentyNineCard";
import TwentyNineSeat from "../components/TwentyNineSeat";
import TwentyNineTrickArea from "../components/TwentyNineTrickArea";
import TwentyNineResultPanel from "../components/TwentyNineResultPanel";

const TRUMPS = [
  { suit: "S", symbol: "♠", label: "Spades" },
  { suit: "H", symbol: "♥", label: "Hearts" },
  { suit: "D", symbol: "♦", label: "Diamonds" },
  { suit: "C", symbol: "♣", label: "Clubs" },
];

export default function TwentyNineGameScreen({ route, navigation }) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const roomCode = route.params?.roomCode;
  const [selectedBid, setSelectedBid] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);

  const {
    gameState,
    error,
    connection,
    connected,
    reconnecting,
    submitBid,
    selectTrump,
    playCard,
    nextHand,
  } = useTwentyNineSocket(roomCode, user?.id);

  const players = gameState?.players || [];
  const bySeat = useMemo(
    () => Object.fromEntries(players.map((player) => [player.seat, player])),
    [players],
  );
  const currentPlayer = players.find(
    (player) => player.id === gameState?.currentPlayerId,
  );
  const legalBids = gameState?.legalBids || [];
  const playableIds = new Set(gameState?.legalCardIds || []);
  const isMyTurn = Boolean(gameState?.isMyTurn);
  const isBidTurn = gameState?.phase === "bidding" && isMyTurn;
  const isTrumpTurn =
    gameState?.phase === "trump-selection" && gameState?.canSelectTrump;
  const statusColor =
    connection === "connected"
      ? colors.green
      : connection === "error"
        ? colors.red
        : colors.gold;

  const handCards = gameState?.myHand || [];

  function pressCard(card) {
    if (
      !isMyTurn ||
      gameState?.phase !== "trick-play" ||
      !playableIds.has(card.id)
    )
      return;
    setSelectedCard((current) => (current === card.id ? null : card.id));
  }

  function confirmCard() {
    if (!selectedCard || !playableIds.has(selectedCard)) return;
    playCard(selectedCard);
    setSelectedCard(null);
  }

  function chooseBid(bid) {
    if (!isBidTurn) return;
    setSelectedBid((current) => (current === bid ? null : bid));
  }

  function submitSelectedBid() {
    if (!isBidTurn) return;
    submitBid(selectedBid);
    setSelectedBid(null);
  }

  if (!gameState) {
    return (
      <View style={styles.loadingRoot}>
        <View style={styles.loadingLogo}>
          <Text style={styles.loadingLogoText}>SU</Text>
        </View>
        <Text style={styles.loadingKicker}>SHUFFLEUP · TWENTY-NINE</Text>
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

  if (gameState.status === "game-complete") {
    return (
      <TwentyNineResultPanel
        gameState={gameState}
        onNextHand={nextHand}
        onLobby={() => navigation.navigate("Main", { screen: "Lobby" })}
      />
    );
  }

  const topOpponents = [bySeat.W, bySeat.N, bySeat.E].filter(Boolean);
  const lastWinnerPlayer = gameState.lastTrickWinner
    ? players.find((player) => player.seat === gameState.lastTrickWinner)
    : null;
  const teamPoints = gameState.tricks || { A: 0, B: 0 };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={["#081224", "#06131A", "#07131C"]}
        style={StyleSheet.absoluteFillObject}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingBottom: Math.max(insets.bottom, 12) + 24,
        }}
      >
        <View style={styles.topBar}>
          <View style={styles.brandBlock}>
            <View style={styles.brandIcon}>
              <Text style={styles.brandIconText}>SU</Text>
            </View>
            <View style={{ minWidth: 0 }}>
              <Text style={styles.eyebrow}>SHUFFLEUP</Text>
              <Text style={styles.gameTitle}>Twenty-Nine</Text>
            </View>
          </View>
          <View style={styles.topMeta}>
            <View style={styles.roomPill}>
              <Text style={styles.roomLabel}>ROOM</Text>
              <Text style={styles.roomCode}>
                {String(roomCode || gameState.roomCode).toUpperCase()}
              </Text>
            </View>
            <View style={styles.livePill}>
              <View
                style={[styles.liveDot, { backgroundColor: statusColor }]}
              />
              <Text style={[styles.liveText, { color: statusColor }]}>
                {connection === "connected" ? "LIVE" : connection.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {error ? (
          <View style={styles.errorBanner}>
            <Ionicons name="warning" size={16} color={colors.red} />
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
              Reconnecting to the live table…
            </Text>
          </View>
        ) : null}

        <View style={styles.overviewRow}>
          <View style={styles.infoCard}>
            <Text style={styles.cardKicker}>HAND</Text>
            <Text style={styles.infoValue}>{gameState.handNumber || 1}</Text>
            <Text style={styles.infoSub}>8 tricks</Text>
          </View>
          <View style={[styles.infoCard, isMyTurn && styles.yourTurnCard]}>
            <Text style={styles.cardKicker}>TURN</Text>
            <Text numberOfLines={1} style={styles.infoValue}>
              {isMyTurn ? "YOUR TURN" : currentPlayer?.username || "WAITING"}
            </Text>
            <Text style={styles.infoSub}>
              {gameState.phase.replace("-", " ")}
            </Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.cardKicker}>TRUMP</Text>
            <Text
              style={[
                styles.infoValue,
                { color: gameState.trump ? colors.gold : colors.muted },
              ]}
            >
              {gameState.trump?.symbol || "—"}{" "}
              {gameState.trump?.label ||
                (gameState.knownTrump ? "Hidden" : "Hidden")}
            </Text>
            <Text style={styles.infoSub}>
              {gameState.trumpRevealed ? "Revealed" : "Hidden"}
            </Text>
          </View>
        </View>

        <View style={styles.tableWrap}>
          <LinearGradient
            colors={["#0B4A3A", "#09382D", "#07271F"]}
            style={styles.table}
          >
            <View style={styles.tableInner} />
            <View style={styles.opponentGrid}>
              {topOpponents.map((player) => (
                <TwentyNineSeat
                  key={player.id}
                  player={player}
                  compact
                  current={gameState.currentSeat === player.seat}
                />
              ))}
            </View>

            <View style={styles.centerStatus}>
              <View style={styles.contractChip}>
                <Text style={styles.chipLabel}>CONTRACT</Text>
                <Text style={styles.chipValue}>
                  {gameState.contract
                    ? `Team ${gameState.contract.team} · ${gameState.contract.bid}`
                    : "Auction open"}
                </Text>
              </View>
              <Text style={styles.turnTitle}>
                {isMyTurn
                  ? "YOUR TURN"
                  : `${currentPlayer?.username || "Waiting"}'s turn`}
              </Text>
              <Text style={styles.trumpHint}>
                {gameState.trumpRevealed
                  ? `Trump ${gameState.trump?.symbol} ${gameState.trump?.label}`
                  : "Trump hidden"}
              </Text>
              <TwentyNineTrickArea
                trick={gameState.trick}
                players={players}
                lastWinner={lastWinnerPlayer?.username}
              />
            </View>

            <View style={styles.selfSeatWrap}>
              <TwentyNineSeat
                player={{ ...bySeat[gameState.mySeat], username: "You" }}
                self
                current={gameState.currentSeat === gameState.mySeat}
              />
            </View>
          </LinearGradient>
        </View>

        <View style={styles.scorePanel}>
          <View style={styles.panelHeader}>
            <View>
              <Text style={styles.panelKicker}>PARTNERSHIPS</Text>
              <Text style={styles.panelTitle}>Live score</Text>
            </View>
            <Text style={styles.panelHint}>
              {gameState.trickNumber}/8 tricks
            </Text>
          </View>
          <View style={styles.teamRow}>
            <View>
              <Text style={styles.teamName}>North + South</Text>
              <Text style={styles.teamMeta}>
                {teamPoints.A} tricks · Score {gameState.scores?.A ?? 0}
              </Text>
            </View>
            <Text style={styles.teamScore}>{gameState.scores?.A ?? 0}</Text>
          </View>
          <View style={styles.teamRow}>
            <View>
              <Text style={styles.teamName}>East + West</Text>
              <Text style={styles.teamMeta}>
                {teamPoints.B} tricks · Score {gameState.scores?.B ?? 0}
              </Text>
            </View>
            <Text style={styles.teamScore}>{gameState.scores?.B ?? 0}</Text>
          </View>
        </View>

        {isBidTurn ? (
          <View style={styles.actionPanel}>
            <View style={styles.panelHeader}>
              <View>
                <Text style={styles.panelKicker}>AUCTION</Text>
                <Text style={styles.panelTitle}>Your bid</Text>
              </View>
              <Text style={styles.panelHint}>16–28</Text>
            </View>
            <View style={styles.bidGrid}>
              {legalBids.map((bid) => (
                <Pressable
                  key={bid}
                  onPress={() => chooseBid(bid)}
                  style={[
                    styles.bidButton,
                    selectedBid === bid && styles.bidButtonSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.bidText,
                      selectedBid === bid && styles.bidTextSelected,
                    ]}
                  >
                    {bid}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.actionRow}>
              <Pressable
                onPress={submitSelectedBid}
                disabled={selectedBid == null}
                style={[
                  styles.primaryAction,
                  selectedBid == null && styles.disabledAction,
                ]}
              >
                <Text style={styles.primaryActionText}>CONFIRM BID</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  submitBid(null);
                  setSelectedBid(null);
                }}
                style={styles.secondaryAction}
              >
                <Text style={styles.secondaryActionText}>PASS</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {isTrumpTurn ? (
          <View style={styles.actionPanel}>
            <Text style={styles.panelKicker}>TRUMP</Text>
            <Text style={styles.panelTitle}>Choose your trump</Text>
            <Text style={styles.panelDesc}>
              Only you can see the selected suit until the trump is revealed.
            </Text>
            <View style={styles.trumpGrid}>
              {TRUMPS.map((item) => (
                <Pressable
                  key={item.suit}
                  onPress={() => selectTrump(item.suit)}
                  style={styles.trumpButton}
                >
                  <Text
                    style={[
                      styles.trumpSymbol,
                      (item.suit === "H" || item.suit === "D") && {
                        color: "#D92F58",
                      },
                    ]}
                  >
                    {item.symbol}
                  </Text>
                  <Text style={styles.trumpLabel}>{item.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.handPanel}>
          <View style={styles.panelHeader}>
            <View>
              <Text style={styles.panelKicker}>YOUR HAND</Text>
              <Text style={styles.panelTitle}>{handCards.length} cards</Text>
            </View>
            <View style={styles.privatePill}>
              <Text style={styles.privateText}>PRIVATE</Text>
            </View>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              gap: 10,
              paddingVertical: 12,
              paddingHorizontal: 2,
            }}
          >
            {handCards.map((card) => (
              <TwentyNineCard
                key={card.id}
                card={card}
                playable={
                  isMyTurn &&
                  gameState.phase === "trick-play" &&
                  playableIds.has(card.id)
                }
                selected={selectedCard === card.id}
                disabled={
                  !isMyTurn ||
                  gameState.phase !== "trick-play" ||
                  !playableIds.has(card.id)
                }
                onPress={pressCard}
              />
            ))}
          </ScrollView>
          {selectedCard ? (
            <Pressable onPress={confirmCard} style={styles.playSelected}>
              <Text style={styles.playSelectedText}>PLAY SELECTED CARD</Text>
            </Pressable>
          ) : (
            <Text style={styles.handHint}>
              {gameState.phase === "trick-play"
                ? isMyTurn
                  ? "Tap a legal card, then play it."
                  : "Waiting for the current player."
                : "Your hand stays ready for the next action."}
            </Text>
          )}
        </View>

        {gameState.phase === "hand-complete" ? (
          <View style={styles.resultCard}>
            <Text style={styles.panelKicker}>HAND RESULT</Text>
            <Text style={styles.panelTitle}>
              {gameState.handResult?.contract?.made
                ? "Contract made"
                : "Contract failed"}
            </Text>
            <Text style={styles.resultText}>
              Team {gameState.handResult?.contract?.team} · Bid{" "}
              {gameState.handResult?.contract?.bid} · Card points{" "}
              {gameState.handResult?.contract?.points}
            </Text>
            {gameState.isDealer && gameState.status !== "game-complete" ? (
              <Pressable onPress={nextHand} style={styles.primaryAction}>
                <Text style={styles.primaryActionText}>START NEXT HAND</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </View>
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
    backgroundColor: "#1A204A",
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  loadingLogoText: { color: colors.text, fontSize: 28, fontWeight: "900" },
  loadingKicker: {
    color: colors.cyan,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  loadingTitle: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "900",
    marginTop: 8,
    textAlign: "center",
  },
  loadingSub: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 8,
    textAlign: "center",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    gap: 12,
  },
  brandBlock: { flexDirection: "row", alignItems: "center", flex: 1, gap: 10 },
  brandIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "#1A204A",
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  brandIconText: { color: colors.text, fontSize: 21, fontWeight: "900" },
  eyebrow: {
    color: colors.cyan,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.6,
  },
  gameTitle: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "900",
    marginTop: 1,
  },
  topMeta: { alignItems: "flex-end", gap: 6 },
  roomPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roomLabel: { color: colors.muted, fontSize: 9, fontWeight: "900" },
  roomCode: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
  },
  livePill: { flexDirection: "row", alignItems: "center", gap: 6 },
  liveDot: { width: 8, height: 8, borderRadius: 8 },
  liveText: { fontSize: 10, fontWeight: "900" },
  errorBanner: {
    flexDirection: "row",
    gap: 10,
    marginHorizontal: 20,
    marginTop: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255,107,122,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,107,122,0.18)",
  },
  errorTitle: { color: colors.text, fontSize: 11, fontWeight: "900" },
  errorText: { color: colors.muted, fontSize: 10, marginTop: 2 },
  reconnectBanner: {
    flexDirection: "row",
    gap: 9,
    marginHorizontal: 20,
    marginTop: 10,
    padding: 10,
    borderRadius: 14,
    backgroundColor: colors.surface2,
  },
  reconnectText: { color: colors.muted, fontSize: 10, fontWeight: "700" },
  overviewRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    marginTop: 16,
  },
  infoCard: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 13,
  },
  yourTurnCard: { borderColor: colors.cyan },
  cardKicker: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  infoValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900",
    marginTop: 5,
  },
  infoSub: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: "700",
    marginTop: 3,
  },
  tableWrap: { marginHorizontal: 20, marginTop: 14 },
  table: {
    minHeight: 560,
    borderRadius: 34,
    padding: 14,
    overflow: "hidden",
    position: "relative",
  },
  tableInner: {
    position: "absolute",
    left: 26,
    right: 26,
    top: 26,
    bottom: 26,
    borderRadius: 240,
    borderWidth: 1,
    borderColor: "rgba(53,216,255,0.14)",
  },
  opponentGrid: { flexDirection: "row", gap: 8, alignItems: "stretch" },
  centerStatus: {
    marginTop: 12,
    flex: 1,
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  contractChip: {
    alignSelf: "center",
    minWidth: 160,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: "rgba(3,28,22,0.85)",
    borderWidth: 1,
    borderColor: "rgba(247,198,93,0.22)",
  },
  chipLabel: {
    color: colors.muted,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.2,
    textAlign: "center",
  },
  chipValue: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 3,
  },
  turnTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 10,
  },
  trumpHint: {
    color: colors.gold,
    fontSize: 10,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 10,
  },
  selfSeatWrap: { marginTop: 10 },
  scorePanel: {
    marginHorizontal: 20,
    marginTop: 14,
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  panelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 10,
  },
  panelKicker: {
    color: colors.cyan,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.3,
  },
  panelTitle: {
    color: colors.text,
    fontSize: 23,
    fontWeight: "900",
    marginTop: 3,
  },
  panelHint: { color: colors.muted, fontSize: 10, fontWeight: "800" },
  teamRow: {
    marginTop: 10,
    padding: 13,
    borderRadius: 17,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  teamName: { color: colors.text, fontSize: 13, fontWeight: "900" },
  teamMeta: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: "700",
    marginTop: 3,
  },
  teamScore: { color: colors.text, fontSize: 28, fontWeight: "900" },
  actionPanel: {
    marginHorizontal: 20,
    marginTop: 14,
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(247,198,93,0.2)",
    padding: 16,
  },
  bidGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 },
  bidButton: {
    width: "13.5%",
    minWidth: 44,
    minHeight: 46,
    borderRadius: 14,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  bidButtonSelected: { backgroundColor: colors.gold, borderColor: colors.gold },
  bidText: { color: colors.text, fontSize: 13, fontWeight: "900" },
  bidTextSelected: { color: "#1A1A1A" },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  primaryAction: {
    flex: 1,
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  primaryActionText: { color: "#1A1A1A", fontSize: 12, fontWeight: "900" },
  secondaryAction: {
    minWidth: 110,
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryActionText: { color: colors.text, fontSize: 12, fontWeight: "900" },
  disabledAction: { opacity: 0.35 },
  panelDesc: {
    color: colors.muted,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 6,
  },
  trumpGrid: { flexDirection: "row", gap: 8, marginTop: 14 },
  trumpButton: {
    flex: 1,
    minHeight: 76,
    borderRadius: 16,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  trumpSymbol: { color: colors.text, fontSize: 27, fontWeight: "800" },
  trumpLabel: {
    color: colors.muted,
    fontSize: 8,
    fontWeight: "900",
    marginTop: 3,
  },
  handPanel: {
    marginHorizontal: 20,
    marginTop: 14,
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  privatePill: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radii.pill,
    backgroundColor: "#0D2B32",
  },
  privateText: { color: colors.green, fontSize: 9, fontWeight: "900" },
  playSelected: {
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: colors.cyan,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  playSelectedText: { color: "#05141A", fontSize: 12, fontWeight: "900" },
  handHint: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 4,
  },
  resultCard: {
    marginHorizontal: 20,
    marginTop: 14,
    marginBottom: 8,
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  resultText: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 6,
    marginBottom: 12,
  },
});
