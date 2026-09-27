import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
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
import useNapoleonSocket from "../hooks/useNapoleonSocket";
import NapoleonCard from "../components/NapoleonCard";
import NapoleonSeat from "../components/NapoleonSeat";
import NapoleonResultPanel from "../components/NapoleonResultPanel";

const SUITS = [
  { id: "clubs", symbol: "♣", name: "Clubs", color: colors.text },
  { id: "diamonds", symbol: "♦", name: "Diamonds", color: colors.red },
  { id: "hearts", symbol: "♥", name: "Hearts", color: colors.red },
  { id: "spades", symbol: "♠", name: "Spades", color: colors.text },
];
const RANKS = [
  "A",
  "K",
  "Q",
  "J",
  "10",
  "9",
  "8",
  "7",
  "6",
  "5",
  "4",
  "3",
  "2",
];
const BID_MIN = 11;
const BID_MAX = 20;
const SUIT_ORDER = { clubs: 0, diamonds: 1, hearts: 2, spades: 3 };

function canBeatBid(amount, suit, currentBid) {
  if (!currentBid) return amount >= BID_MIN && amount <= BID_MAX;
  return (
    amount > currentBid.amount ||
    (amount === currentBid.amount &&
      SUIT_ORDER[suit] > SUIT_ORDER[currentBid.suit])
  );
}

function cardId(card) {
  return `${card?.suit}-${card?.rank}`;
}

function playableCardIds(cards, trick) {
  if (!trick?.length) return new Set((cards || []).map((card) => card.id));
  const leadSuit = trick[0]?.card?.suit;
  const hasLead = (cards || []).some((card) => card.suit === leadSuit);
  if (!hasLead) return new Set((cards || []).map((card) => card.id));
  return new Set(
    (cards || [])
      .filter((card) => card.suit === leadSuit)
      .map((card) => card.id),
  );
}

export default function NapoleonGameScreen({ route, navigation }) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const landscape = width > height;
  const roomCode = route.params?.roomCode;
  const {
    gameState,
    error,
    connected,
    reconnecting,
    submitBid,
    callPartner,
    discard,
    playCard,
    nextRound,
  } = useNapoleonSocket(roomCode, user?.id);

  const [bidAmount, setBidAmount] = useState(11);
  const [bidSuit, setBidSuit] = useState("clubs");
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedCallCard, setSelectedCallCard] = useState(null);
  const [showCallModal, setShowCallModal] = useState(false);

  const players = gameState?.players || [];
  const me = players.find((player) => player.id === user?.id);
  const currentPlayer = players.find(
    (player) => player.id === gameState?.currentPlayerId,
  );
  const isYourTurn = gameState?.currentPlayerId === user?.id;
  const isNapoleon = gameState?.napoleonId === user?.id;
  const selectableForPlay = useMemo(
    () =>
      gameState?.phase === "playing" && isYourTurn
        ? playableCardIds(
            gameState?.yourCards || [],
            gameState?.currentTrick || [],
          )
        : new Set(),
    [
      gameState?.phase,
      gameState?.yourCards,
      gameState?.currentTrick,
      isYourTurn,
    ],
  );

  const bidOptions = useMemo(() => {
    const out = [];
    for (let amount = BID_MIN; amount <= BID_MAX; amount += 1) {
      for (const suit of SUITS) {
        if (canBeatBid(amount, suit.id, gameState?.currentBid)) {
          out.push({ amount, suit: suit.id });
        }
      }
    }
    return out;
  }, [gameState?.currentBid]);

  if (!gameState) {
    return (
      <View style={styles.loadingRoot}>
        <View style={styles.loadingLogo}>
          <Text style={styles.loadingLogoText}>SU</Text>
        </View>
        <Text style={styles.loadingKicker}>SHUFFLEUP · NAPOLEON</Text>
        <Text style={styles.loadingTitle}>
          {reconnecting ? "RESTORING YOUR SEAT" : "JOINING THE LIVE TABLE"}
        </Text>
        <Text style={styles.loadingSub}>
          {reconnecting
            ? "Reconnecting and restoring server state…"
            : "Preparing your cards and table…"}
        </Text>
        <ActivityIndicator color={colors.cyan} style={{ marginTop: 18 }} />
      </View>
    );
  }

  if (
    gameState.status === "game-complete" ||
    gameState.status === "round-complete"
  ) {
    return (
      <NapoleonResultPanel
        gameState={gameState}
        onNextRound={() => {
          setSelectedIds([]);
          setSelectedCallCard(null);
          nextRound();
        }}
        onLobby={() => navigation.navigate("Main", { screen: "Lobby" })}
      />
    );
  }

  function toggleSelected(id) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  const displayCards =
    gameState.phase === "blind" && isNapoleon
      ? [...(gameState.yourCards || []), ...(gameState.yourBlind || [])]
      : gameState.yourCards || [];

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={["#081225", "#061019", "#07131D"]}
        style={StyleSheet.absoluteFillObject}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingBottom: Math.max(insets.bottom, 14) + 18,
        }}
      >
        <View style={styles.topBar}>
          <View style={styles.brandRow}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>SU</Text>
            </View>
            <View>
              <Text style={styles.eyebrow}>SHUFFLEUP</Text>
              <Text style={styles.gameTitle}>Napoleon</Text>
            </View>
          </View>
          <View style={styles.topMeta}>
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
                {connected ? "LIVE" : reconnecting ? "RECONNECTING" : "OFFLINE"}
              </Text>
            </View>
          </View>
        </View>

        {error ? (
          <View style={styles.errorBanner}>
            <Ionicons name="warning" size={16} color={colors.red} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.overviewRow}>
          <View style={styles.infoCard}>
            <Text style={styles.cardKicker}>ROUND</Text>
            <Text style={styles.infoValue}>
              {gameState.round}/{gameState.totalRounds}
            </Text>
            <Text style={styles.infoSub}>5 players</Text>
          </View>
          <View style={[styles.infoCard, isYourTurn && styles.turnCard]}>
            <Text style={styles.cardKicker}>TURN</Text>
            <Text numberOfLines={1} style={styles.infoValue}>
              {isYourTurn ? "YOUR TURN" : currentPlayer?.username || "WAITING"}
            </Text>
            <Text style={styles.infoSub}>{gameState.phase.toUpperCase()}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.cardKicker}>TRUMP</Text>
            <Text style={[styles.infoValue, { color: colors.gold }]}>
              {gameState.trump?.symbol || "—"}{" "}
              {gameState.trump?.name || "Not set"}
            </Text>
            <Text style={styles.infoSub}>
              {gameState.contract
                ? `${gameState.contract.amount} bid`
                : "Bidding"}
            </Text>
          </View>
        </View>

        <View style={styles.tableShell}>
          <LinearGradient
            colors={["#0A4738", "#093328", "#08271F"]}
            style={styles.table}
          >
            <View style={styles.tableRingOuter} />
            <View style={styles.tableRingInner} />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.playerStrip}
            >
              {players.map((player) => (
                <NapoleonSeat
                  key={player.id}
                  player={player}
                  active={gameState.currentPlayerId === player.id}
                  you={player.id === user?.id}
                  napoleon={gameState.napoleonId === player.id}
                  partner={
                    gameState.partnerRevealed &&
                    gameState.partnerId === player.id
                  }
                />
              ))}
            </ScrollView>

            <View style={styles.centerZone}>
              <View style={styles.contractPill}>
                <Text style={styles.contractLabel}>
                  {gameState.phase.toUpperCase()}
                </Text>
                <Text style={styles.contractValue}>
                  {currentPlayer?.username || "TABLE"}
                </Text>
              </View>

              <View style={styles.trickArea}>
                {(gameState.currentTrick || []).map((play, index) => (
                  <View
                    key={`${play.playerId}-${play.card.id}`}
                    style={styles.trickSlot}
                  >
                    <NapoleonCard
                      card={play.card}
                      table
                      latest={index === gameState.currentTrick.length - 1}
                    />
                    <Text numberOfLines={1} style={styles.trickName}>
                      {players.find((p) => p.id === play.playerId)?.username ||
                        "Player"}
                    </Text>
                  </View>
                ))}
                {!gameState.currentTrick?.length ? (
                  <Text style={styles.emptyTrick}>TRICK</Text>
                ) : null}
              </View>

              {gameState.lastCompletedTrick ? (
                <Text style={styles.lastTrickText}>
                  TRICK {gameState.lastCompletedTrick.number} •{" "}
                  {players.find(
                    (p) => p.id === gameState.lastCompletedTrick.winnerId,
                  )?.username || "Winner"}
                </Text>
              ) : null}
            </View>
          </LinearGradient>
        </View>

        <View style={styles.handPanel}>
          <View style={styles.panelHeader}>
            <View>
              <Text style={styles.panelKicker}>
                {gameState.phase === "blind" ? "BLIND + HAND" : "YOUR HAND"}
              </Text>
              <Text style={styles.panelTitle}>{displayCards.length} cards</Text>
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
            {displayCards.map((card) => {
              const selectable =
                gameState.phase === "blind" && isNapoleon
                  ? true
                  : selectableForPlay.has(card.id);
              const selected = selectedIds.includes(card.id);
              return (
                <NapoleonCard
                  key={card.id}
                  card={card}
                  playable={selectable || selected}
                  selected={selected}
                  onPress={() =>
                    gameState.phase === "blind" && isNapoleon
                      ? toggleSelected(card.id)
                      : selectable
                        ? playCard(card.id)
                        : null
                  }
                />
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.actionPanel}>
          <Text style={styles.panelKicker}>ACTION</Text>
          {gameState.phase === "bidding" ? (
            <>
              <Text style={styles.sectionTitle}>Make a bid</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.bidRow}
              >
                {bidOptions.map((option) => (
                  <Pressable
                    key={`${option.amount}-${option.suit}`}
                    disabled={!isYourTurn}
                    onPress={() => {
                      setBidAmount(option.amount);
                      setBidSuit(option.suit);
                    }}
                    style={[
                      styles.bidChip,
                      bidAmount === option.amount &&
                        bidSuit === option.suit &&
                        styles.bidChipSelected,
                    ]}
                  >
                    <Text style={styles.bidChipText}>{option.amount}</Text>
                    <Text
                      style={[
                        styles.bidChipSuit,
                        {
                          color: SUITS.find((s) => s.id === option.suit)?.color,
                        },
                      ]}
                    >
                      {SUITS.find((s) => s.id === option.suit)?.symbol}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
              <View style={styles.actionRow}>
                <Pressable
                  disabled={!isYourTurn}
                  onPress={() =>
                    submitBid({ amount: bidAmount, suit: bidSuit })
                  }
                  style={styles.primaryAction}
                >
                  <Text style={styles.primaryActionText}>
                    BID {bidAmount}{" "}
                    {SUITS.find((s) => s.id === bidSuit)?.symbol}
                  </Text>
                </Pressable>
                <Pressable
                  disabled={!isYourTurn}
                  onPress={() => submitBid("pass")}
                  style={styles.secondaryAction}
                >
                  <Text style={styles.secondaryActionText}>PASS</Text>
                </Pressable>
              </View>
            </>
          ) : null}

          {gameState.phase === "contract" && isNapoleon ? (
            <View>
              <Text style={styles.sectionTitle}>Call the partner card</Text>
              <Text style={styles.helper}>
                Choose the exact card that becomes your hidden partner call.
              </Text>
              <Pressable
                onPress={() => setShowCallModal(true)}
                style={styles.primaryAction}
              >
                <Text style={styles.primaryActionText}>
                  {selectedCallCard
                    ? `CALL ${selectedCallCard.rank}${SUITS.find((s) => s.id === selectedCallCard.suit)?.symbol}`
                    : "CHOOSE CARD"}
                </Text>
              </Pressable>
            </View>
          ) : null}

          {gameState.phase === "blind" && isNapoleon ? (
            <View>
              <Text style={styles.sectionTitle}>
                Take the blind and discard two
              </Text>
              <Text style={styles.helper}>
                Select exactly two cards from your combined 12-card hand.
              </Text>
              <Pressable
                disabled={selectedIds.length !== 2}
                onPress={() => {
                  discard(selectedIds);
                  setSelectedIds([]);
                }}
                style={[
                  styles.primaryAction,
                  selectedIds.length !== 2 && styles.disabledAction,
                ]}
              >
                <Text style={styles.primaryActionText}>
                  DISCARD {selectedIds.length}/2
                </Text>
              </Pressable>
            </View>
          ) : null}

          {gameState.phase === "playing" ? (
            <View>
              <Text style={styles.sectionTitle}>
                {isYourTurn
                  ? "Play a legal card"
                  : `${currentPlayer?.username || "Player"}'s turn`}
              </Text>
              <Text style={styles.helper}>
                {gameState.trump
                  ? `Trump: ${gameState.trump.symbol} ${gameState.trump.name}`
                  : "Follow the leading suit when required."}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.scorePanel}>
          <Text style={styles.panelKicker}>SCORES</Text>
          {players.map((player) => (
            <View key={player.id} style={styles.scoreRow}>
              <Text style={styles.scoreName}>{player.username}</Text>
              <Text style={styles.scoreValue}>{player.score}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <Modal
        visible={showCallModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCallModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose partner card</Text>
              <Pressable onPress={() => setShowCallModal(false)}>
                <Ionicons name="close" size={22} color={colors.text} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.callGrid}>
              {RANKS.flatMap((rank) =>
                SUITS.map((suit) => (
                  <Pressable
                    key={`${suit.id}-${rank}`}
                    onPress={() =>
                      setSelectedCallCard({
                        id: `${suit.id}-${rank}`,
                        suit: suit.id,
                        rank,
                      })
                    }
                    style={[
                      styles.callChip,
                      selectedCallCard?.id === `${suit.id}-${rank}` &&
                        styles.callChipSelected,
                    ]}
                  >
                    <Text style={[styles.callRank, { color: suit.color }]}>
                      {rank}
                      {suit.symbol}
                    </Text>
                  </Pressable>
                )),
              )}
            </ScrollView>
            <Pressable
              disabled={!selectedCallCard}
              onPress={() => {
                callPartner(selectedCallCard);
                setShowCallModal(false);
              }}
              style={[
                styles.primaryAction,
                !selectedCallCard && styles.disabledAction,
              ]}
            >
              <Text style={styles.primaryActionText}>CONFIRM CALL</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
    padding: 22,
  },
  loadingLogo: {
    width: 82,
    height: 82,
    borderRadius: 24,
    backgroundColor: "#1A1F4F",
    borderWidth: 1,
    borderColor: "#39457F",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingLogoText: { color: colors.text, fontSize: 27, fontWeight: "900" },
  loadingKicker: {
    color: colors.cyan,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginTop: 18,
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
    fontSize: 15,
    marginTop: 8,
    textAlign: "center",
  },
  topBar: {
    paddingHorizontal: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  logo: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: "#1A1F4F",
    borderWidth: 1,
    borderColor: "#39457F",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: { color: colors.text, fontSize: 16, fontWeight: "900" },
  eyebrow: {
    color: colors.cyan,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.4,
  },
  gameTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900",
    marginTop: 2,
  },
  topMeta: { alignItems: "flex-end", gap: 7 },
  roomPill: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    backgroundColor: colors.surface,
  },
  roomLabel: { color: colors.muted, fontSize: 9, fontWeight: "900" },
  roomCode: { color: colors.text, fontSize: 13, fontWeight: "900" },
  liveRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  liveText: { fontSize: 10, fontWeight: "900" },
  errorBanner: {
    marginHorizontal: 18,
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#6E2933",
    backgroundColor: "#2A1117",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  errorText: { color: colors.text, fontSize: 12, fontWeight: "700", flex: 1 },
  overviewRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 18,
    marginTop: 14,
  },
  infoCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    padding: 10,
  },
  turnCard: { borderColor: colors.gold },
  cardKicker: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },
  infoValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "900",
    marginTop: 4,
  },
  infoSub: { color: colors.muted, fontSize: 9, marginTop: 3 },
  tableShell: {
    marginHorizontal: 18,
    marginTop: 14,
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#12382F",
  },
  table: { minHeight: 440, padding: 12, position: "relative" },
  playerStrip: {
    gap: 10,
    paddingHorizontal: 2,
    paddingBottom: 8,
    alignItems: "center",
  },
  tableRingOuter: {
    position: "absolute",
    top: 55,
    left: 18,
    right: 18,
    bottom: 45,
    borderRadius: 220,
    borderWidth: 1,
    borderColor: "#1B6D5A",
    opacity: 0.65,
  },
  tableRingInner: {
    position: "absolute",
    top: 90,
    left: 50,
    right: 50,
    bottom: 80,
    borderRadius: 180,
    borderWidth: 1,
    borderColor: "#185240",
    opacity: 0.7,
  },
  centerZone: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 120,
    zIndex: 2,
    paddingTop: 6,
  },
  contractPill: {
    minWidth: 150,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: "#06231D",
    borderWidth: 1,
    borderColor: "#1F5B4D",
    alignItems: "center",
  },
  contractLabel: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  contractValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900",
    marginTop: 4,
  },
  trickArea: {
    marginTop: 10,
    width: 170,
    minHeight: 140,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#1D5A4B",
    backgroundColor: "#082A22",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 8,
  },
  trickSlot: { alignItems: "center", width: 82, marginVertical: 2 },
  trickName: { color: colors.muted, fontSize: 8, maxWidth: 72, marginTop: 2 },
  emptyTrick: {
    color: "#6A897F",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  lastTrickText: {
    color: colors.gold,
    fontSize: 9,
    fontWeight: "900",
    marginTop: 7,
  },
  handPanel: {
    marginHorizontal: 18,
    marginTop: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    padding: 14,
  },
  panelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  panelKicker: {
    color: colors.cyan,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  panelTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900",
    marginTop: 3,
  },
  privatePill: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#0B2B31",
  },
  privateText: { color: colors.green, fontSize: 9, fontWeight: "900" },
  handRow: { paddingTop: 12, paddingHorizontal: 2 },
  actionPanel: {
    marginHorizontal: 18,
    marginTop: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    padding: 14,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
    marginTop: 5,
  },
  helper: { color: colors.muted, fontSize: 11, marginTop: 4, lineHeight: 16 },
  bidRow: { paddingVertical: 12, gap: 8 },
  bidChip: {
    minWidth: 58,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  bidChipSelected: { borderColor: colors.gold, backgroundColor: "#201C10" },
  bidChipText: { color: colors.text, fontWeight: "900", fontSize: 13 },
  bidChipSuit: { fontSize: 15, marginTop: 1 },
  actionRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  primaryAction: {
    minHeight: 52,
    borderRadius: 15,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    flex: 1,
  },
  primaryActionText: { color: colors.white, fontSize: 13, fontWeight: "900" },
  secondaryAction: {
    minHeight: 52,
    borderRadius: 15,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    flex: 0.7,
  },
  secondaryActionText: { color: colors.text, fontSize: 13, fontWeight: "900" },
  disabledAction: { opacity: 0.45 },
  scorePanel: {
    marginHorizontal: 18,
    marginTop: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingTop: 14,
  },
  scoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  scoreName: { color: colors.text, fontSize: 12, fontWeight: "800" },
  scoreValue: { color: colors.gold, fontSize: 15, fontWeight: "900" },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    justifyContent: "flex-end",
  },
  modalCard: {
    maxHeight: "88%",
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: { color: colors.text, fontSize: 19, fontWeight: "900" },
  callGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
  },
  callChip: {
    width: 68,
    height: 46,
    borderRadius: 12,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  callChipSelected: { borderColor: colors.cyan, backgroundColor: "#0D2B34" },
  callRank: { fontSize: 15, fontWeight: "900" },
});
