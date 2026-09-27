import { useEffect, useMemo, useState } from "react";
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
import { colors } from "../../../theme";
import { useAuth } from "../../../context/AuthStore";
import useBridgeSocket from "../hooks/useBridgeSocket";
import BridgeCard from "../components/BridgeCard";
import BridgeSeat from "../components/BridgeSeat";
import BridgeResultPanel from "../components/BridgeResultPanel";

const SEAT_NAMES = { N: "North", E: "East", S: "South", W: "West" };
const SUIT_SYMBOLS = { C: "♣", D: "♦", H: "♥", S: "♠", NT: "NT" };
const RED = new Set(["D", "H"]);
const LEVELS = [1, 2, 3, 4, 5, 6, 7];
const STRAINS = ["C", "D", "H", "S", "NT"];

function sortCards(cards = []) {
  const order = { S: 0, H: 1, D: 2, C: 3 };
  const rank = {
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
    (a, b) => order[a.suit] - order[b.suit] || rank[b.rank] - rank[a.rank],
  );
}
function playableIds(hand, trick, enabled) {
  if (!enabled) return new Set();
  if (!trick?.length) return new Set(hand.map((c) => c.id));
  const led = trick[0]?.card?.suit;
  const hasLed = hand.some((c) => c.suit === led);
  return new Set(
    hand.filter((c) => !hasLed || c.suit === led).map((c) => c.id),
  );
}
function contractLabel(contract) {
  if (!contract) return "BIDDING OPEN";
  const strain =
    contract.strain === "NT" ? "NT" : SUIT_SYMBOLS[contract.strain];
  const mult =
    contract.doubled === 2 ? " XX" : contract.doubled === 1 ? " X" : "";
  return `${contract.level}${strain}${mult}`;
}
function auctionLabel(entry) {
  if (entry.type === "pass") return "Pass";
  if (entry.type === "double") return "Double";
  if (entry.type === "redouble") return "Redouble";
  if (entry.type === "bid")
    return `${entry.bid.level}${entry.bid.strain === "NT" ? "NT" : SUIT_SYMBOLS[entry.bid.strain]}`;
  return entry.type || "—";
}

export default function BridgeGameScreen({ route, navigation }) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const roomCode = route.params?.roomCode;
  const [level, setLevel] = useState(1);
  const { gameState, error, connection, connected, reconnecting, submit } =
    useBridgeSocket(roomCode, user?.id);
  const bySeat = useMemo(
    () =>
      Object.fromEntries((gameState?.players || []).map((p) => [p.seat, p])),
    [gameState?.players],
  );
  const mySeat = gameState?.you?.seat;
  const isMyAction =
    gameState?.turnActorId === user?.id ||
    (gameState?.phase === "auction" && gameState?.currentSeat === mySeat);
  const dummySeat = gameState?.contract?.dummy;
  const isDeclarer = gameState?.contract?.declarer === mySeat;
  const ownHand = bySeat[mySeat]?.hand || [];
  const dummyHand = dummySeat ? bySeat[dummySeat]?.hand || [] : [];
  const ownPlay =
    isMyAction &&
    (gameState?.phase === "opening-lead" ||
      (gameState?.phase === "trick-play" && gameState?.currentSeat === mySeat));
  const dummyPlay =
    isDeclarer &&
    isMyAction &&
    gameState?.phase === "trick-play" &&
    gameState?.currentSeat === dummySeat;
  const ownIds = useMemo(
    () => playableIds(ownHand, gameState?.trick, ownPlay),
    [ownHand, gameState?.trick, ownPlay],
  );
  const dummyIds = useMemo(
    () => playableIds(dummyHand, gameState?.trick, dummyPlay),
    [dummyHand, gameState?.trick, dummyPlay],
  );
  const legalBids = gameState?.legalBidOptions || [];
  const availableLevels = useMemo(
    () => new Set(legalBids.map((b) => b.level)),
    [legalBids],
  );
  const levelBids = legalBids.filter((b) => b.level === level);
  useEffect(() => {
    if (legalBids.length && !availableLevels.has(level))
      setLevel(legalBids[0].level);
  }, [availableLevels, legalBids, level]);

  const play = (card, sourceSeat) => {
    const set = sourceSeat === dummySeat ? dummyIds : ownIds;
    if (set.has(card.id))
      submit("bridge:play-card", { cardId: card.id, sourceSeat });
  };
  if (!gameState)
    return (
      <View style={styles.loading}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>SU</Text>
        </View>
        <Text style={styles.eyebrow}>SHUFFLEUP · BRIDGE</Text>
        <Text style={styles.loadTitle}>
          {reconnecting ? "RESTORING YOUR SEAT" : "JOINING THE LIVE TABLE"}
        </Text>
        <Text style={styles.loadSub}>
          {reconnecting
            ? "Reconnecting and restoring server state…"
            : "Preparing your cards and partnership table…"}
        </Text>
        <ActivityIndicator color={colors.cyan} style={{ marginTop: 18 }} />
      </View>
    );
  if (gameState.status === "round-complete")
    return (
      <BridgeResultPanel
        state={gameState}
        canContinue={mySeat === gameState.dealer}
        onNextDeal={() => submit("bridge:next-deal")}
        onLobby={() => navigation.navigate("Main", { screen: "Lobby" })}
      />
    );

  const statusColor =
    connection === "connected"
      ? colors.green
      : connection === "error" || connection === "offline"
        ? colors.red
        : colors.gold;
  const phaseLabel =
    gameState.phase === "auction"
      ? "Auction"
      : gameState.phase === "opening-lead"
        ? "Opening Lead"
        : "Trick Play";
  return (
    <View style={styles.root}>
      <LinearGradient
        colors={["#081426", "#061019", "#07111B"]}
        style={StyleSheet.absoluteFillObject}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingBottom: Math.max(insets.bottom, 12) + 18,
          paddingHorizontal: 12,
        }}
      >
        <View style={styles.topBar}>
          <View style={styles.brand}>
            <View style={styles.brandIcon}>
              <Text style={styles.brandIconText}>SU</Text>
            </View>
            <View>
              <Text style={styles.eyebrow}>SHUFFLEUP · BRIDGE</Text>
              <Text style={styles.title}>Partnership Table</Text>
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
                  ? "Reconnecting to the live Bridge table…"
                  : "Connecting…")}
            </Text>
          </View>
        ) : null}
        <View style={styles.infoRow}>
          <View style={styles.info}>
            <Text style={styles.infoKicker}>DEAL</Text>
            <Text style={styles.infoValue}>{gameState.dealNumber}</Text>
            <Text style={styles.infoSub}>
              {SEAT_NAMES[gameState.dealer]} dealer
            </Text>
          </View>
          <View style={[styles.info, isMyAction && styles.infoActive]}>
            <Text style={styles.infoKicker}>TURN</Text>
            <Text numberOfLines={1} style={styles.infoValue}>
              {isMyAction
                ? "YOUR ACTION"
                : SEAT_NAMES[gameState.currentSeat] || gameState.currentSeat}
            </Text>
            <Text style={styles.infoSub}>{phaseLabel}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.infoKicker}>VULN.</Text>
            <Text style={[styles.infoValue, { color: colors.gold }]}>
              {gameState.vulnerability}
            </Text>
            <Text style={styles.infoSub}>
              {contractLabel(gameState.contract)}
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
            <View style={styles.topPlayers}>
              {["N", "E", "S", "W"]
                .filter((s) => s !== mySeat)
                .map(
                  (s) =>
                    bySeat[s] && (
                      <View key={s} style={styles.topPlayer}>
                        <BridgeSeat
                          player={bySeat[s]}
                          viewerId={user?.id}
                          hand={
                            gameState.dummyRevealed && dummySeat === s
                              ? sortCards(bySeat[s].hand || [])
                              : []
                          }
                          showHand={gameState.dummyRevealed && dummySeat === s}
                          selectableIds={dummySeat === s ? dummyIds : new Set()}
                          onCardPress={play}
                          active={gameState.currentSeat === s}
                        />
                      </View>
                    ),
                )}
            </View>
            <View style={styles.center}>
              <View style={styles.contractPill}>
                <Text style={styles.contractKicker}>
                  {gameState.contract ? "CONTRACT" : "AUCTION"}
                </Text>
                <Text style={styles.contractValue}>
                  {contractLabel(gameState.contract)}
                </Text>
                <Text style={styles.contractSub}>
                  {gameState.contract
                    ? `${gameState.contract.declarer} declarer · ${gameState.contract.dummy} dummy`
                    : gameState.highestBid
                      ? `Highest ${gameState.highestBid.level}${SUIT_SYMBOLS[gameState.highestBid.strain]}`
                      : "No bid yet"}
                </Text>
              </View>
              <View style={styles.trick}>
                <View style={styles.trickHead}>
                  <Text style={styles.trickTitle}>CURRENT TRICK</Text>
                  <Text style={styles.trickCount}>
                    {gameState.trick.length}/4
                  </Text>
                </View>
                <View style={styles.trickCards}>
                  {gameState.trick.length ? (
                    gameState.trick.map((e, index) => (
                      <View
                        key={`${e.playerId}-${e.card.id}`}
                        style={styles.trickEntry}
                      >
                        <BridgeCard
                          card={e.card}
                          table
                          latest={index === gameState.trick.length - 1}
                        />
                        <Text style={styles.trickSeat}>{e.seat}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.empty}>
                      Lead a card to begin the trick.
                    </Text>
                  )}
                </View>
                {gameState.lastTrickWinner ? (
                  <Text style={styles.lastWinner}>
                    Last trick: {SEAT_NAMES[gameState.lastTrickWinner]} won
                  </Text>
                ) : null}
              </View>
            </View>
            <View style={styles.you}>
              <BridgeSeat
                player={bySeat[mySeat]}
                viewerId={user?.id}
                active={gameState.currentSeat === mySeat}
              />
            </View>
          </LinearGradient>
        </View>

        {gameState.phase === "auction" ? (
          <View style={styles.panel}>
            <View style={styles.panelHead}>
              <View>
                <Text style={styles.panelKicker}>AUCTION</Text>
                <Text style={styles.panelTitle}>
                  {isMyAction
                    ? "Your bid"
                    : `${SEAT_NAMES[gameState.currentSeat]} to bid`}
                </Text>
              </View>
              <View style={styles.highBid}>
                <Text style={styles.highLabel}>HIGH BID</Text>
                <Text style={styles.highValue}>
                  {gameState.highestBid
                    ? `${gameState.highestBid.level}${SUIT_SYMBOLS[gameState.highestBid.strain]}`
                    : "PASS"}
                </Text>
              </View>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.levels}
            >
              {LEVELS.map((n) => (
                <Pressable
                  key={n}
                  disabled={!availableLevels.has(n)}
                  onPress={() => setLevel(n)}
                  style={[
                    styles.level,
                    level === n && styles.levelActive,
                    !availableLevels.has(n) && styles.levelDisabled,
                  ]}
                >
                  <Text
                    style={[
                      styles.levelText,
                      level === n && styles.levelTextActive,
                    ]}
                  >
                    {n}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <View style={styles.bidRow}>
              {STRAINS.map((strain) => {
                const legal = levelBids.some((b) => b.strain === strain);
                const color = RED.has(strain) ? "#EE5C79" : colors.text;
                return (
                  <Pressable
                    key={strain}
                    disabled={!legal || !isMyAction}
                    onPress={() =>
                      submit("bridge:bid", {
                        action: { type: "bid", level, strain },
                      })
                    }
                    style={[
                      styles.bidButton,
                      legal && isMyAction && styles.bidLegal,
                    ]}
                  >
                    <Text style={[styles.bidSuit, { color }]}>
                      {SUIT_SYMBOLS[strain]}
                    </Text>
                    <Text style={styles.bidLevel}>
                      {level}
                      {strain === "NT" ? "NT" : ""}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.actionRow}>
              <Pressable
                disabled={!isMyAction}
                onPress={() =>
                  submit("bridge:bid", { action: { type: "pass" } })
                }
                style={[styles.actionButton, isMyAction && styles.actionLive]}
              >
                <Text style={styles.actionText}>PASS</Text>
              </Pressable>
              <Pressable
                disabled={!isMyAction || !gameState.canDouble}
                onPress={() =>
                  submit("bridge:bid", { action: { type: "double" } })
                }
                style={[
                  styles.actionButton,
                  isMyAction && gameState.canDouble && styles.actionLive,
                ]}
              >
                <Text style={styles.actionText}>DOUBLE</Text>
              </Pressable>
              <Pressable
                disabled={!isMyAction || !gameState.canRedouble}
                onPress={() =>
                  submit("bridge:bid", { action: { type: "redouble" } })
                }
                style={[
                  styles.actionButton,
                  isMyAction && gameState.canRedouble && styles.actionLive,
                ]}
              >
                <Text style={styles.actionText}>REDOUBLE</Text>
              </Pressable>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.calls}
            >
              {(gameState.auction || []).map((e, i) => (
                <View key={`${e.playerId}-${i}`} style={styles.call}>
                  <Text style={styles.callSeat}>{e.seat}</Text>
                  <Text style={styles.callText}>{auctionLabel(e)}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {["auction", "opening-lead", "trick-play"].includes(gameState.phase) ? (
          <View style={styles.handPanel}>
            <View style={styles.panelHead}>
              <View>
                <Text style={styles.panelKicker}>YOUR HAND</Text>
                <Text style={styles.panelTitle}>{ownHand.length} cards</Text>
              </View>
              <View style={styles.private}>
                <Text style={styles.privateText}>PRIVATE</Text>
              </View>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hand}
            >
              {sortCards(ownHand).map((card) => {
                const playable = ownPlay && ownIds.has(card.id);
                return (
                  <BridgeCard
                    key={card.id}
                    card={card}
                    playable={playable}
                    disabled={!ownPlay ? false : !playable}
                    onPress={playable ? () => play(card, mySeat) : undefined}
                  />
                );
              })}
            </ScrollView>
            <Text style={styles.hint}>
              {isMyAction
                ? gameState.currentSeat === dummySeat
                  ? "You control the dummy hand."
                  : "Tap a highlighted card to play."
                : `Waiting for ${SEAT_NAMES[gameState.currentSeat] || gameState.currentSeat}.`}
            </Text>
          </View>
        ) : null}

        {gameState.contract ? (
          <View style={styles.panel}>
            <View style={styles.panelHead}>
              <View>
                <Text style={styles.panelKicker}>CONTRACT</Text>
                <Text style={styles.panelTitle}>
                  {contractLabel(gameState.contract)}
                </Text>
              </View>
              <Text style={styles.tricks}>
                {gameState.completedTricks}/13 tricks
              </Text>
            </View>
            <View style={styles.details}>
              <View style={styles.detail}>
                <Text style={styles.label}>DECLARER</Text>
                <Text style={styles.value}>
                  {SEAT_NAMES[gameState.contract.declarer]}
                </Text>
              </View>
              <View style={styles.detail}>
                <Text style={styles.label}>DUMMY</Text>
                <Text style={styles.value}>
                  {SEAT_NAMES[gameState.contract.dummy]}
                </Text>
              </View>
              <View style={styles.detail}>
                <Text style={styles.label}>TRUMP</Text>
                <Text style={styles.value}>
                  {gameState.contract.strain === "NT"
                    ? "No Trump"
                    : SUIT_SYMBOLS[gameState.contract.strain]}
                </Text>
              </View>
              <View style={styles.detail}>
                <Text style={styles.label}>VULN.</Text>
                <Text style={styles.value}>{gameState.vulnerability}</Text>
              </View>
            </View>
          </View>
        ) : null}
        <View style={styles.panel}>
          <Text style={styles.panelKicker}>PARTNERSHIPS</Text>
          <Text style={styles.panelTitle}>Tricks won</Text>
          {["NS", "EW"].map((side) => {
            const ps = (gameState.players || []).filter(
              (p) => p.partnership === side,
            );
            const tricks = ps.reduce((a, p) => a + (p.tricksWon || 0), 0);
            return (
              <View key={side} style={styles.scoreRow}>
                <Text style={styles.scoreSide}>{side}</Text>
                <Text style={styles.scoreNames}>
                  {ps.map((p) => p.username).join(" + ")}
                </Text>
                <Text style={styles.scoreValue}>{tricks}</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
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
  eyebrow: {
    color: colors.cyan,
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 1.1,
    marginTop: 13,
  },
  loadTitle: {
    color: colors.text,
    fontSize: 27,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 8,
  },
  loadSub: {
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
  title: { color: colors.text, fontSize: 20, fontWeight: "900", marginTop: 2 },
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
    fontSize: 13,
    fontWeight: "900",
    marginTop: 4,
  },
  infoSub: { color: colors.muted, fontSize: 8, marginTop: 2 },
  tableWrap: {
    minHeight: 455,
    borderRadius: 26,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(80,225,198,0.15)",
    marginBottom: 10,
  },
  table: {
    minHeight: 455,
    padding: 10,
    position: "relative",
    overflow: "hidden",
  },
  ringOuter: {
    position: "absolute",
    left: "9%",
    right: "9%",
    top: 46,
    bottom: 46,
    borderRadius: 220,
    borderWidth: 1,
    borderColor: "rgba(92,225,201,0.20)",
  },
  ringInner: {
    position: "absolute",
    left: "20%",
    right: "20%",
    top: 91,
    bottom: 91,
    borderRadius: 190,
    borderWidth: 1,
    borderColor: "rgba(92,225,201,0.12)",
  },
  topPlayers: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "center",
    zIndex: 2,
  },
  topPlayer: { width: "31.8%", minWidth: 0 },
  center: {
    flex: 1,
    minHeight: 285,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  contractPill: {
    minWidth: 170,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "rgba(90,225,201,0.23)",
    backgroundColor: "rgba(4,30,27,0.83)",
    paddingHorizontal: 12,
    paddingVertical: 9,
    alignItems: "center",
  },
  contractKicker: {
    color: colors.muted,
    fontSize: 7.5,
    fontWeight: "900",
    letterSpacing: 1,
  },
  contractValue: {
    color: colors.text,
    fontSize: 21,
    fontWeight: "900",
    marginTop: 3,
  },
  contractSub: { color: colors.muted, fontSize: 8, marginTop: 3 },
  trick: {
    width: "88%",
    maxWidth: 315,
    minHeight: 175,
    marginTop: 9,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "rgba(90,225,201,0.16)",
    backgroundColor: "rgba(4,29,26,0.76)",
    padding: 9,
  },
  trickHead: { flexDirection: "row", justifyContent: "space-between" },
  trickTitle: {
    color: colors.muted,
    fontSize: 7.5,
    fontWeight: "900",
    letterSpacing: 1,
  },
  trickCount: { color: colors.cyan, fontSize: 8, fontWeight: "900" },
  trickCards: {
    flex: 1,
    minHeight: 122,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 2,
  },
  trickEntry: { alignItems: "center" },
  trickSeat: {
    color: colors.muted,
    fontSize: 7,
    fontWeight: "900",
    marginTop: 1,
  },
  empty: {
    color: "rgba(226,234,249,0.52)",
    fontSize: 8.5,
    textAlign: "center",
    maxWidth: 170,
  },
  lastWinner: {
    color: colors.gold,
    fontSize: 7.5,
    fontWeight: "800",
    textAlign: "center",
  },
  you: { marginTop: 4, zIndex: 2 },
  panel: {
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
  highBid: {
    alignItems: "flex-end",
    backgroundColor: colors.surface2,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  highLabel: { color: colors.muted, fontSize: 6.5, fontWeight: "900" },
  highValue: {
    color: colors.gold,
    fontSize: 14,
    fontWeight: "900",
    marginTop: 1,
  },
  levels: { gap: 5, paddingVertical: 9 },
  level: {
    width: 32,
    height: 31,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  levelActive: { backgroundColor: colors.cyan, borderColor: colors.cyan },
  levelDisabled: { opacity: 0.32 },
  levelText: { color: colors.muted, fontSize: 10, fontWeight: "900" },
  levelTextActive: { color: "#06101B" },
  bidRow: { flexDirection: "row", gap: 5 },
  bidButton: {
    flex: 1,
    minHeight: 55,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.34,
  },
  bidLegal: {
    opacity: 1,
    borderColor: "rgba(53,216,255,0.30)",
    backgroundColor: "rgba(53,216,255,0.06)",
  },
  bidSuit: { fontSize: 20, fontWeight: "800" },
  bidLevel: {
    color: colors.muted,
    fontSize: 7.5,
    fontWeight: "900",
    marginTop: 1,
  },
  actionRow: { flexDirection: "row", gap: 6, marginTop: 8 },
  actionButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.35,
  },
  actionLive: { opacity: 1, borderColor: colors.cyan },
  actionText: { color: colors.text, fontSize: 8.5, fontWeight: "900" },
  calls: { gap: 5, paddingTop: 10 },
  call: {
    minHeight: 28,
    paddingHorizontal: 7,
    borderRadius: 8,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  callSeat: { color: colors.cyan, fontSize: 7.5, fontWeight: "900" },
  callText: { color: colors.text, fontSize: 7.5, fontWeight: "800" },
  private: {
    backgroundColor: "rgba(50,223,143,0.08)",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
  },
  privateText: { color: colors.green, fontSize: 7.5, fontWeight: "900" },
  hand: { paddingTop: 8, paddingHorizontal: 2, alignItems: "flex-end" },
  hint: { color: colors.muted, fontSize: 8.5, marginTop: 3, fontWeight: "700" },
  tricks: { color: colors.cyan, fontSize: 8.5, fontWeight: "900" },
  details: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 9 },
  detail: {
    flexBasis: "48%",
    flexGrow: 1,
    minHeight: 47,
    borderRadius: 11,
    backgroundColor: colors.surface2,
    padding: 8,
  },
  label: {
    color: colors.muted,
    fontSize: 6.5,
    fontWeight: "900",
    letterSpacing: 1,
  },
  value: {
    color: colors.text,
    fontSize: 10.5,
    fontWeight: "900",
    marginTop: 3,
  },
  scoreRow: {
    minHeight: 44,
    marginTop: 6,
    borderRadius: 11,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 9,
    gap: 7,
  },
  scoreSide: { width: 25, color: colors.gold, fontSize: 10, fontWeight: "900" },
  scoreNames: { flex: 1, color: colors.muted, fontSize: 8, fontWeight: "800" },
  scoreValue: {
    width: 22,
    textAlign: "right",
    color: colors.text,
    fontSize: 15,
    fontWeight: "900",
  },
});
