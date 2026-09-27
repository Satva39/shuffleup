import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect, useMemo, useState } from "react";
import { colors } from "../../../theme";
import { useAuth } from "../../../context/AuthStore";
import useSpadesSocket from "../hooks/useSpadesSocket";
import SpadesCard from "../components/SpadesCard";
import SpadesSeat from "../components/SpadesSeat";
import SpadesResultPanel from "../components/SpadesResultPanel";

const SEAT_NAMES = { N: "North", E: "East", S: "South", W: "West" };
const BID_OPTIONS = Array.from({ length: 14 }, (_, index) => index);

function sortCards(cards = []) {
  const suitOrder = { S: 0, H: 1, D: 2, C: 3 };
  const rankOrder = {
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
    7: 7,
    8: 8,
    9: 9,
    10: 10,
    J: 11,
    Q: 12,
    K: 13,
    A: 14,
  };
  return [...cards].sort(
    (a, b) =>
      (suitOrder[a?.suit] ?? 99) - (suitOrder[b?.suit] ?? 99) ||
      (rankOrder[b?.rank] ?? 0) - (rankOrder[a?.rank] ?? 0),
  );
}

function bidLabel(bid) {
  return bid === null || bid === undefined ? "—" : String(bid);
}

function phaseLabel(phase) {
  if (phase === "bidding") return "Bidding";
  if (phase === "trick-play") return "Trick play";
  if (phase === "hand-complete") return "Hand complete";
  if (phase === "game-complete") return "Game complete";
  return phase || "Loading";
}

export default function SpadesGameScreen({ route, navigation }) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const roomCode = route.params?.roomCode;
  const [selectedBid, setSelectedBid] = useState(null);
  const {
    gameState,
    error,
    connection,
    connected,
    reconnecting,
    submitBid,
    playCard,
    nextHand,
  } = useSpadesSocket(roomCode, user?.id);

  const bySeat = useMemo(
    () =>
      Object.fromEntries(
        (gameState?.players || []).map((player) => [player.seat, player]),
      ),
    [gameState?.players],
  );

  const me = useMemo(
    () =>
      (gameState?.players || []).find((player) => player.id === user?.id) ||
      null,
    [gameState?.players, user?.id],
  );

  const mySeat = me?.seat;
  const isMyTurn =
    gameState?.turnActorId === user?.id ||
    (gameState?.currentSeat === mySeat && gameState?.phase === "trick-play");
  const isMyBidTurn =
    gameState?.phase === "bidding" &&
    (gameState?.turnActorId === user?.id || gameState?.currentSeat === mySeat);
  const hand = sortCards(gameState?.hand || gameState?.yourCards || []);
  const legalCardIds = useMemo(
    () => new Set(gameState?.legalCardIds || []),
    [gameState?.legalCardIds],
  );
  const hasSubmittedBid = me?.bid !== null && me?.bid !== undefined;
  const legalBids = gameState?.bidOptions?.length
    ? gameState.bidOptions
    : BID_OPTIONS;
  const topSeats = useMemo(
    () => ["N", "E", "W", "S"].filter((seat) => seat !== mySeat),
    [mySeat],
  );

  useEffect(() => {
    if (!isMyBidTurn || hasSubmittedBid) setSelectedBid(null);
  }, [hasSubmittedBid, isMyBidTurn]);

  if (!gameState) {
    return (
      <View style={styles.loading}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>SU</Text>
        </View>
        <Text style={styles.loadingKicker}>SHUFFLEUP · SPADES</Text>
        <Text style={styles.loadingTitle}>
          {reconnecting ? "RESTORING YOUR SEAT" : "JOINING THE LIVE TABLE"}
        </Text>
        <Text style={styles.loadingSub}>
          {reconnecting
            ? "Reconnecting and restoring the server state…"
            : "Preparing your cards, teams and table…"}
        </Text>
        <ActivityIndicator color={colors.cyan} style={{ marginTop: 18 }} />
      </View>
    );
  }

  const isHandComplete =
    gameState.phase === "hand-complete" || gameState.status === "hand-complete";
  const isGameComplete =
    gameState.phase === "game-complete" ||
    gameState.status === "game-complete" ||
    !!gameState.winnerTeam;
  if (isHandComplete || isGameComplete) {
    return (
      <SpadesResultPanel
        state={gameState}
        canContinue={
          isHandComplete && !isGameComplete && mySeat === gameState.dealer
        }
        onNextHand={nextHand}
        onLobby={() => navigation.navigate("Main", { screen: "Lobby" })}
      />
    );
  }

  const statusColor =
    connection === "connected"
      ? colors.green
      : connection === "error" || connection === "offline"
        ? colors.red
        : colors.gold;
  const currentSeatName =
    SEAT_NAMES[gameState.currentSeat] || gameState.currentSeat || "—";
  const teamA = (gameState.players || []).filter((p) => p.team === "A");
  const teamB = (gameState.players || []).filter((p) => p.team === "B");
  const teamATricks = teamA.reduce(
    (sum, player) => sum + (player.tricksWon || 0),
    0,
  );
  const teamBTricks = teamB.reduce(
    (sum, player) => sum + (player.tricksWon || 0),
    0,
  );
  const scores = gameState.scores || {};
  const bags = gameState.bags || {};

  async function confirmBid() {
    if (
      selectedBid === null ||
      selectedBid === undefined ||
      !isMyBidTurn ||
      hasSubmittedBid
    )
      return;
    const result = await submitBid(selectedBid);
    if (result?.success) setSelectedBid(null);
  }

  async function onCardPress(card) {
    if (!isMyTurn || gameState.phase !== "trick-play") return;
    if (!legalCardIds.has(card.id)) return;
    await playCard(card.id);
  }

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={["#071423", "#061019", "#07111B"]}
        style={StyleSheet.absoluteFillObject}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 9,
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
              <Text style={styles.eyebrow}>SHUFFLEUP · SPADES</Text>
              <Text style={styles.title}>Spades</Text>
            </View>
          </View>
          <View style={styles.meta}>
            <View style={styles.room}>
              <Text style={styles.roomLabel}>ROOM</Text>
              <Text style={styles.roomCode}>
                {String(roomCode || gameState.roomCode || "").toUpperCase()}
              </Text>
            </View>
            <View style={styles.live}>
              <View
                style={[styles.liveDot, { backgroundColor: statusColor }]}
              />
              <Text style={[styles.liveText, { color: statusColor }]}>
                {connection === "connected" ? "LIVE" : connection.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {!connected || error ? (
          <View style={styles.banner}>
            <Ionicons
              name={error ? "warning" : "sync"}
              size={15}
              color={error ? colors.red : colors.amber}
            />
            <Text style={styles.bannerText}>
              {error ||
                (reconnecting
                  ? "Reconnecting to the live Spades table…"
                  : "Connecting…")}
            </Text>
          </View>
        ) : null}

        <View style={styles.infoRow}>
          <View style={styles.info}>
            <Text style={styles.infoKicker}>HAND</Text>
            <Text style={styles.infoValue}>
              {gameState.handNumber ?? gameState.round ?? "—"}
            </Text>
            <Text style={styles.infoSub}>13 tricks</Text>
          </View>
          <View
            style={[
              styles.info,
              isMyTurn || isMyBidTurn ? styles.infoActive : null,
            ]}
          >
            <Text style={styles.infoKicker}>TURN</Text>
            <Text numberOfLines={1} style={styles.infoValue}>
              {isMyTurn || isMyBidTurn ? "YOUR ACTION" : currentSeatName}
            </Text>
            <Text style={styles.infoSub}>{phaseLabel(gameState.phase)}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.infoKicker}>SPADES</Text>
            <Text
              style={[
                styles.infoValue,
                { color: gameState.spadesBroken ? colors.gold : colors.text },
              ]}
            >
              {gameState.spadesBroken ? "BROKEN" : "UNBROKEN"}
            </Text>
            <Text style={styles.infoSub}>
              {gameState.targetScore
                ? `First to ${gameState.targetScore}`
                : "Always trump"}
            </Text>
          </View>
        </View>

        <View style={styles.tableWrap}>
          <LinearGradient
            colors={["#0B4B3A", "#0A392E", "#08271F"]}
            style={styles.table}
          >
            <View style={styles.ringOuter} />
            <View style={styles.ringInner} />

            <View style={styles.opponentGrid}>
              {topSeats.slice(0, 2).map((seat) => (
                <View key={seat} style={styles.opponentCell}>
                  <SpadesSeat
                    player={bySeat[seat]}
                    viewerId={user?.id}
                    active={gameState.currentSeat === seat}
                  />
                </View>
              ))}
            </View>

            <View style={styles.centerZone}>
              <View style={styles.centerPill}>
                <Text style={styles.centerKicker}>
                  {gameState.phase === "bidding" ? "BIDDING" : "TRICK PLAY"}
                </Text>
                <Text style={styles.centerTitle}>
                  {isMyTurn || isMyBidTurn ? "YOUR TURN" : currentSeatName}
                </Text>
                <Text style={styles.centerSub}>
                  {gameState.phase === "bidding"
                    ? "Choose your bid from 0 to 13 tricks"
                    : `${gameState.trick?.length || 0}/4 cards in trick`}
                </Text>
              </View>

              <View style={styles.trickBox}>
                <View style={styles.trickHeader}>
                  <Text style={styles.trickLabel}>CURRENT TRICK</Text>
                  <Text style={styles.trickCount}>
                    {gameState.trick?.length || 0}/4
                  </Text>
                </View>
                <View style={styles.trickCards}>
                  {(gameState.trick || []).length ? (
                    (gameState.trick || []).map((entry, index) => (
                      <View
                        key={`${entry.playerId}-${entry.card.id}`}
                        style={styles.trickEntry}
                      >
                        <SpadesCard
                          card={entry.card}
                          small
                          latest={index === gameState.trick.length - 1}
                        />
                        <Text style={styles.trickSeat}>{entry.seat}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.emptyTrick}>
                      Play a card to begin the trick.
                    </Text>
                  )}
                </View>
                {gameState.lastTrickWinner ? (
                  <Text style={styles.lastWinner}>
                    Last trick · {SEAT_NAMES[gameState.lastTrickWinner]} won
                  </Text>
                ) : null}
              </View>
            </View>

            {topSeats.slice(2).map((seat) => (
              <View key={seat} style={styles.bottomOpponent}>
                <SpadesSeat
                  player={bySeat[seat]}
                  viewerId={user?.id}
                  active={gameState.currentSeat === seat}
                />
              </View>
            ))}

            {mySeat && bySeat[mySeat] ? (
              <View style={styles.youSeat}>
                <SpadesSeat
                  player={bySeat[mySeat]}
                  viewerId={user?.id}
                  active={gameState.currentSeat === mySeat}
                />
              </View>
            ) : null}
          </LinearGradient>
        </View>

        <View style={styles.handPanel}>
          <View style={styles.panelHead}>
            <View>
              <Text style={styles.panelKicker}>YOUR HAND</Text>
              <Text style={styles.panelTitle}>{hand.length} cards</Text>
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
            {hand.map((card) => (
              <SpadesCard
                key={card.id}
                card={card}
                playable={
                  gameState.phase === "trick-play" &&
                  isMyTurn &&
                  legalCardIds.has(card.id)
                }
                disabled={
                  gameState.phase === "trick-play" &&
                  (!isMyTurn || !legalCardIds.has(card.id))
                }
                onPress={
                  gameState.phase === "trick-play" && isMyTurn
                    ? onCardPress
                    : undefined
                }
              />
            ))}
          </ScrollView>
          <Text style={styles.handHint}>
            {gameState.phase === "bidding"
              ? "Your cards are visible during bidding. Confirm your bid below."
              : isMyTurn
                ? "Tap a highlighted card to play."
                : "Waiting for the current player."}
          </Text>
        </View>

        <View style={styles.scorePanel}>
          <View style={styles.panelHead}>
            <View>
              <Text style={styles.panelKicker}>PARTNERSHIPS</Text>
              <Text style={styles.panelTitle}>Live score</Text>
            </View>
            <Text style={styles.panelHint}>
              {gameState.trickCount ?? gameState.completedTricks?.length ?? 0}
              /13 tricks complete
            </Text>
          </View>
          <TeamScoreRow
            label="A"
            names="North + South"
            score={scores.A ?? 0}
            tricks={teamATricks}
            bags={bags.A ?? 0}
            active={me?.team === "A"}
          />
          <TeamScoreRow
            label="B"
            names="East + West"
            score={scores.B ?? 0}
            tricks={teamBTricks}
            bags={bags.B ?? 0}
            active={me?.team === "B"}
          />
        </View>

        <View style={styles.bidDisplayPanel}>
          <View style={styles.panelHead}>
            <View>
              <Text style={styles.panelKicker}>BIDS</Text>
              <Text style={styles.panelTitle}>Table calls</Text>
            </View>
            <Text style={styles.panelHint}>0–13 tricks</Text>
          </View>
          <View style={styles.bidGrid}>
            {(gameState.players || []).map((player) => (
              <View key={player.id} style={styles.bidPill}>
                <Text style={styles.bidName}>
                  {player.id === user?.id ? "YOU" : SEAT_NAMES[player.seat]}
                </Text>
                <Text style={styles.bidValue}>{bidLabel(player.bid)}</Text>
              </View>
            ))}
          </View>
        </View>

        {gameState.phase === "bidding" ? (
          <View style={styles.actionPanel}>
            <View style={styles.panelHead}>
              <View>
                <Text style={styles.panelKicker}>BIDDING</Text>
                <Text style={styles.panelTitle}>
                  {isMyBidTurn ? "Your bid" : `${currentSeatName} is bidding`}
                </Text>
              </View>
              <Text style={styles.panelHint}>
                {hasSubmittedBid
                  ? `You bid ${bidLabel(me?.bid)}`
                  : "Choose 0–13"}
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.bidChoices}
            >
              {legalBids.map((bid) => (
                <Pressable
                  key={String(bid)}
                  disabled={!isMyBidTurn || hasSubmittedBid}
                  onPress={() => setSelectedBid(Number(bid))}
                  style={[
                    styles.bidChoice,
                    selectedBid === Number(bid) && styles.bidChoiceSelected,
                    (!isMyBidTurn || hasSubmittedBid) &&
                      styles.bidChoiceDisabled,
                  ]}
                >
                  <Text
                    style={[
                      styles.bidChoiceText,
                      selectedBid === Number(bid) &&
                        styles.bidChoiceTextSelected,
                    ]}
                  >
                    {bid}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <Pressable
              disabled={!isMyBidTurn || hasSubmittedBid || selectedBid === null}
              onPress={confirmBid}
              style={[
                styles.confirmButton,
                (!isMyBidTurn || hasSubmittedBid || selectedBid === null) &&
                  styles.confirmDisabled,
              ]}
            >
              <Text style={styles.confirmText}>
                {hasSubmittedBid
                  ? `Bid submitted · ${bidLabel(me?.bid)}`
                  : "Confirm bid"}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorPanel}>
            <Ionicons name="warning" size={15} color={colors.red} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

function TeamScoreRow({ label, names, score, tricks, bags, active }) {
  return (
    <View style={[styles.teamRow, active && styles.teamRowActive]}>
      <View style={styles.teamMark}>
        <Text style={styles.teamMarkText}>{label}</Text>
      </View>
      <View style={styles.teamCopy}>
        <Text style={styles.teamNames}>{names}</Text>
        <Text style={styles.teamMeta}>
          {tricks} tricks · {bags} bags
        </Text>
      </View>
      <Text style={styles.teamScore}>{score}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  loading: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
  },
  logo: {
    width: 66,
    height: 66,
    borderRadius: 19,
    backgroundColor: "#1B2150",
    borderWidth: 1,
    borderColor: "#38417E",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: { color: colors.text, fontSize: 24, fontWeight: "900" },
  loadingKicker: {
    color: colors.cyan,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.1,
    marginTop: 13,
  },
  loadingTitle: {
    color: colors.text,
    fontSize: 27,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 8,
  },
  loadingSub: {
    color: colors.muted,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    marginTop: 6,
    maxWidth: 320,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  brand: { flex: 1, flexDirection: "row", alignItems: "center", gap: 9 },
  brandIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: "#1B2150",
    borderWidth: 1,
    borderColor: "#38417E",
    alignItems: "center",
    justifyContent: "center",
  },
  brandIconText: { color: colors.text, fontSize: 18, fontWeight: "900" },
  brandCopy: { flex: 1, minWidth: 0 },
  eyebrow: {
    color: colors.cyan,
    fontSize: 8.2,
    fontWeight: "900",
    letterSpacing: 1.05,
  },
  title: { color: colors.text, fontSize: 21, fontWeight: "900", marginTop: 2 },
  meta: { alignItems: "flex-end" },
  room: {
    minHeight: 38,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  roomLabel: { color: colors.muted, fontSize: 7.5, fontWeight: "900" },
  roomCode: { color: colors.text, fontSize: 12, fontWeight: "900" },
  live: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 5 },
  liveDot: { width: 7, height: 7, borderRadius: 4 },
  liveText: { fontSize: 8.5, fontWeight: "900" },
  banner: {
    minHeight: 40,
    marginBottom: 9,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "rgba(247,198,93,0.18)",
    backgroundColor: "rgba(247,198,93,0.07)",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
  },
  bannerText: {
    flex: 1,
    color: colors.muted,
    fontSize: 9.5,
    fontWeight: "700",
  },
  infoRow: { flexDirection: "row", gap: 7, marginBottom: 10 },
  info: {
    flex: 1,
    minHeight: 78,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    justifyContent: "center",
  },
  infoActive: {
    borderColor: colors.cyan,
    backgroundColor: "rgba(53,216,255,0.06)",
  },
  infoKicker: {
    color: colors.muted,
    fontSize: 7.5,
    fontWeight: "900",
    letterSpacing: 1,
  },
  infoValue: {
    color: colors.text,
    fontSize: 12.5,
    fontWeight: "900",
    marginTop: 4,
  },
  infoSub: { color: colors.muted, fontSize: 8, marginTop: 2 },
  tableWrap: {
    minHeight: 480,
    borderRadius: 26,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(80,225,198,0.15)",
    marginBottom: 10,
  },
  table: {
    minHeight: 480,
    padding: 10,
    position: "relative",
    overflow: "hidden",
  },
  ringOuter: {
    position: "absolute",
    left: "8%",
    right: "8%",
    top: 45,
    bottom: 45,
    borderRadius: 220,
    borderWidth: 1,
    borderColor: "rgba(92,225,201,0.20)",
  },
  ringInner: {
    position: "absolute",
    left: "18%",
    right: "18%",
    top: 94,
    bottom: 92,
    borderRadius: 190,
    borderWidth: 1,
    borderColor: "rgba(92,225,201,0.12)",
  },
  opponentGrid: {
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    zIndex: 2,
  },
  opponentCell: { flex: 1, minWidth: 0 },
  centerZone: {
    flex: 1,
    minHeight: 270,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  centerPill: {
    minWidth: 184,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "rgba(90,225,201,0.23)",
    backgroundColor: "rgba(4,30,27,0.83)",
    paddingHorizontal: 12,
    paddingVertical: 9,
    alignItems: "center",
  },
  centerKicker: {
    color: colors.muted,
    fontSize: 7.5,
    fontWeight: "900",
    letterSpacing: 1,
  },
  centerTitle: {
    color: colors.text,
    fontSize: 21,
    fontWeight: "900",
    marginTop: 3,
  },
  centerSub: { color: colors.muted, fontSize: 8, marginTop: 3 },
  trickBox: {
    width: "90%",
    maxWidth: 320,
    minHeight: 180,
    marginTop: 9,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "rgba(90,225,201,0.16)",
    backgroundColor: "rgba(4,29,26,0.76)",
    padding: 9,
  },
  trickHeader: { flexDirection: "row", justifyContent: "space-between" },
  trickLabel: {
    color: colors.muted,
    fontSize: 7.5,
    fontWeight: "900",
    letterSpacing: 1,
  },
  trickCount: { color: colors.cyan, fontSize: 8, fontWeight: "900" },
  trickCards: {
    flex: 1,
    minHeight: 126,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  trickEntry: { alignItems: "center" },
  trickSeat: {
    color: colors.muted,
    fontSize: 7,
    fontWeight: "900",
    marginTop: 1,
  },
  emptyTrick: {
    color: "rgba(226,234,249,0.52)",
    fontSize: 8.5,
    textAlign: "center",
    maxWidth: 180,
  },
  lastWinner: {
    color: colors.gold,
    fontSize: 7.5,
    fontWeight: "800",
    textAlign: "center",
  },
  bottomOpponent: {
    marginTop: 4,
    width: "48%",
    alignSelf: "center",
    zIndex: 2,
  },
  youSeat: { width: "92%", alignSelf: "center", marginTop: 6, zIndex: 2 },
  scorePanel: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 9,
  },
  bidDisplayPanel: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 9,
  },
  handPanel: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 9,
  },
  actionPanel: {
    backgroundColor: "rgba(17,47,35,0.92)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(227,187,104,0.16)",
    padding: 12,
    marginBottom: 9,
  },
  panelHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  panelKicker: {
    color: colors.cyan,
    fontSize: 7.8,
    fontWeight: "900",
    letterSpacing: 1.1,
  },
  panelTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "900",
    marginTop: 2,
  },
  panelHint: { color: colors.muted, fontSize: 8, fontWeight: "800" },
  teamRow: {
    minHeight: 52,
    marginTop: 7,
    borderRadius: 12,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 9,
    gap: 8,
  },
  teamRowActive: {
    borderColor: colors.cyan,
    backgroundColor: "rgba(53,216,255,0.05)",
  },
  teamMark: {
    width: 29,
    height: 29,
    borderRadius: 10,
    backgroundColor: "#24304F",
    alignItems: "center",
    justifyContent: "center",
  },
  teamMarkText: { color: colors.gold, fontSize: 9, fontWeight: "900" },
  teamCopy: { flex: 1 },
  teamNames: { color: colors.text, fontSize: 9.5, fontWeight: "900" },
  teamMeta: {
    color: colors.muted,
    fontSize: 7.5,
    fontWeight: "700",
    marginTop: 2,
  },
  teamScore: { color: colors.text, fontSize: 19, fontWeight: "900" },
  bidGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 9 },
  bidPill: {
    flex: 1,
    minWidth: "44%",
    borderRadius: 10,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 37,
    paddingHorizontal: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bidName: { color: colors.muted, fontSize: 7.5, fontWeight: "900" },
  bidValue: { color: colors.text, fontSize: 13, fontWeight: "900" },
  privatePill: {
    backgroundColor: "rgba(50,223,143,0.08)",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
  },
  privateText: { color: colors.green, fontSize: 7.5, fontWeight: "900" },
  handRow: { paddingTop: 9, paddingHorizontal: 3, paddingRight: 14 },
  handHint: {
    color: colors.muted,
    fontSize: 8.5,
    marginTop: 3,
    fontWeight: "700",
  },
  bidChoices: { paddingTop: 10, paddingBottom: 3, gap: 6 },
  bidChoice: {
    width: 39,
    height: 39,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  bidChoiceSelected: { backgroundColor: colors.gold, borderColor: colors.gold },
  bidChoiceDisabled: { opacity: 0.35 },
  bidChoiceText: { color: colors.text, fontSize: 12, fontWeight: "900" },
  bidChoiceTextSelected: { color: "#1D1A10" },
  confirmButton: {
    minHeight: 48,
    borderRadius: 13,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  confirmDisabled: { opacity: 0.42 },
  confirmText: { color: "#1D1A10", fontSize: 12, fontWeight: "900" },
  errorPanel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "rgba(255,123,135,0.18)",
    backgroundColor: "rgba(110,24,37,0.18)",
    marginBottom: 6,
  },
  errorText: { flex: 1, color: colors.red, fontSize: 9, fontWeight: "800" },
});
