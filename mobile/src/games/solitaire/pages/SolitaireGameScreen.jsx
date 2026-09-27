import { useMemo, useState, useEffect } from "react";
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
import Screen from "../../../components/Screen";
import { colors, radii } from "../../../theme";
import SolitaireCard from "../components/SolitaireCard";
import SolitaireSeat from "../components/SolitaireSeat";
import SolitaireResultPanel from "../components/SolitaireResultPanel";
import useSolitaireSocket from "../hooks/useSolitaireSocket";
import { SUITS, canPlaceOnFoundation, canPlaceOnTableau } from "../utils/cards";

function formatTime(totalSeconds) {
  const value = Math.max(0, Number(totalSeconds) || 0);
  const minutes = Math.floor(value / 60);
  const seconds = value % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function selectionCard(state, selection) {
  if (!selection || !state?.player) return null;
  if (selection.type === "waste") return state.player.waste?.at(-1) || null;
  return (
    state.player.tableau?.[selection.columnIndex]?.[selection.cardIndex] || null
  );
}

function sequenceIsValid(column, index) {
  if (!column?.[index]?.faceUp) return false;
  for (let i = index; i < column.length - 1; i += 1) {
    const a = column[i];
    const b = column[i + 1];
    if (!a.faceUp || !b.faceUp) return false;
    if (a.color === b.color) return false;
    const ar =
      [
        "A",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "J",
        "Q",
        "K",
      ].indexOf(a.rank) + 1;
    const br =
      [
        "A",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "J",
        "Q",
        "K",
      ].indexOf(b.rank) + 1;
    if (ar !== br + 1) return false;
  }
  return true;
}

export default function SolitaireGameScreen({ route, navigation }) {
  const { roomCode } = route.params;
  const { width } = useWindowDimensions();
  const { state, error, connected, user, sendMove, drawStock, refreshState } =
    useSolitaireSocket({ roomCode });
  const [selection, setSelection] = useState(null);
  const [elapsed, setElapsed] = useState(0);

  const me = state?.player;
  const publicPlayers = state?.players || [];
  const selected = selectionCard(state, selection);
  const canPlay = Boolean(
    connected && me && me.status === "PLAYING" && state?.status === "playing",
  );
  const cardWidth = Math.min(48, Math.max(38, Math.floor((width - 42) / 7.15)));
  const cardHeight = Math.round(cardWidth * 1.42);
  const stackOffset = Math.max(22, Math.round(cardHeight * 0.37));

  useEffect(() => {
    setSelection(null);
  }, [
    state?.player?.moves,
    state?.player?.redeals,
    state?.player?.completionSeconds,
  ]);

  useEffect(() => {
    if (!me?.startedAt || me.status === "COMPLETE") {
      setElapsed(Number(me?.completionSeconds) || 0);
      return undefined;
    }
    const tick = () =>
      setElapsed(Math.max(0, Math.floor((Date.now() - me.startedAt) / 1000)));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [me?.startedAt, me?.status, me?.completionSeconds]);

  const validTableauTargets = useMemo(() => {
    if (!selected || !selection) return [];
    const sourceColumn =
      selection.type === "tableau"
        ? me?.tableau?.[selection.columnIndex]
        : null;
    if (
      selection.type === "tableau" &&
      !sequenceIsValid(sourceColumn, selection.cardIndex)
    )
      return [];
    return (me?.tableau || [])
      .map((column, index) => ({
        index,
        valid: canPlaceOnTableau(selected, column),
      }))
      .filter(
        (item) =>
          item.valid &&
          !(
            selection.type === "tableau" && item.index === selection.columnIndex
          ),
      )
      .map((item) => item.index);
  }, [me?.tableau, selected, selection]);

  const foundationTargets = useMemo(() => {
    if (!selected || !selection || !me) return [];
    if (selection.type === "tableau") {
      const column = me.tableau?.[selection.columnIndex];
      if (!column || selection.cardIndex !== column.length - 1) return [];
    }
    return Object.entries(me.foundations || {})
      .filter(([, pile]) => canPlaceOnFoundation(selected, pile))
      .map(([suit]) => suit);
  }, [me, selected, selection]);

  if (!state) {
    return (
      <Screen contentStyle={styles.loadingScreen}>
        <View style={styles.loadingCard}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>SU</Text>
          </View>
          <Text style={styles.eyebrow}>SHUFFLEUP · SOLITAIRE MULTIPLAYER</Text>
          <Text style={styles.loadingTitle}>JOINING YOUR BOARD</Text>
          <Text style={styles.loadingText}>
            {error || "Preparing your private Klondike board…"}
          </Text>
          <ActivityIndicator color={colors.cyan} style={{ marginTop: 20 }} />
        </View>
      </Screen>
    );
  }

  const selectSource = (nextSelection) => {
    if (!canPlay) return;
    if (!nextSelection) return;
    if (
      selection &&
      selection.type === nextSelection.type &&
      selection.columnIndex === nextSelection.columnIndex &&
      selection.cardIndex === nextSelection.cardIndex
    ) {
      setSelection(null);
      return;
    }
    if (selection) {
      if (nextSelection.type === "tableau") {
        sendMove({
          from: selection,
          to: { type: "tableau", columnIndex: nextSelection.columnIndex },
        });
        setSelection(null);
        return;
      }
      if (nextSelection.type === "foundation") {
        sendMove({ from: selection, to: { type: "foundation" } });
        setSelection(null);
        return;
      }
    }
    setSelection(nextSelection);
  };

  const onTableauCard = (columnIndex, cardIndex, card) => {
    if (!card?.faceUp || !canPlay) return;
    selectSource({ type: "tableau", columnIndex, cardIndex });
  };

  const onEmptyColumn = (columnIndex) => {
    if (!selection || !canPlay) return;
    sendMove({ from: selection, to: { type: "tableau", columnIndex } });
    setSelection(null);
  };

  const goFoundation = (suit) => {
    if (!selection || !canPlay) return;
    sendMove({ from: selection, to: { type: "foundation" } });
    setSelection(null);
  };

  const completed = me?.status === "COMPLETE";

  return (
    <Screen scroll={false} contentStyle={styles.screenBody}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>SHUFFLEUP · GAME 15</Text>
            <Text style={styles.title}>Solitaire</Text>
            <Text style={styles.subtitle}>Klondike · Draw 1 · Race</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.roomPill}>
              <Text style={styles.roomLabel}>ROOM</Text>
              <Text style={styles.roomCode}>{state.roomCode}</Text>
            </View>
            <View
              style={[styles.livePill, !connected && styles.livePillOffline]}
            >
              <View
                style={[
                  styles.liveDot,
                  { backgroundColor: connected ? colors.green : colors.red },
                ]}
              />
              <Text
                style={[styles.liveText, !connected && { color: colors.red }]}
              >
                {connected ? "LIVE" : "RECONNECTING"}
              </Text>
            </View>
          </View>
        </View>

        {error ? (
          <Pressable onPress={refreshState} style={styles.errorBar}>
            <Ionicons name="warning-outline" size={17} color={colors.red} />
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.refreshText}>REFRESH</Text>
          </Pressable>
        ) : null}

        <View style={styles.progressHeader}>
          <View>
            <Text style={styles.sectionEyebrow}>YOUR PROGRESS</Text>
            <Text style={styles.sectionTitle}>
              {me.progress}/52 foundation cards
            </Text>
          </View>
          <View style={styles.timeBadge}>
            <Ionicons name="time-outline" size={14} color={colors.gold} />
            <Text style={styles.timeText}>{formatTime(elapsed)}</Text>
          </View>
        </View>

        <View style={styles.playersGrid}>
          {publicPlayers.map((player) => (
            <SolitaireSeat
              key={player.id}
              player={player}
              isYou={player.id === user?.id}
            />
          ))}
        </View>

        <View style={styles.boardCard}>
          <View style={styles.boardTop}>
            <View style={styles.pileBlock}>
              <Text style={styles.pileLabel}>STOCK</Text>
              <Pressable
                disabled={!canPlay}
                onPress={drawStock}
                style={[styles.pileSlot, !canPlay && { opacity: 0.7 }]}
              >
                <SolitaireCard
                  card={{ id: "stock", faceUp: false }}
                  width={cardWidth}
                  height={cardHeight}
                />
              </Pressable>
              <Text style={styles.pileMeta}>{me.stockCount} cards</Text>
            </View>
            <View style={styles.pileBlock}>
              <Text style={styles.pileLabel}>WASTE</Text>
              <Pressable
                disabled={!canPlay || !me.waste?.length}
                onPress={() => selectSource({ type: "waste" })}
                style={styles.pileSlot}
              >
                {me.waste?.length ? (
                  <SolitaireCard
                    card={me.waste.at(-1)}
                    width={cardWidth}
                    height={cardHeight}
                    selected={selection?.type === "waste"}
                  />
                ) : (
                  <View style={styles.emptySlot}>
                    <Text style={styles.emptySlotText}>WASTE</Text>
                  </View>
                )}
              </Pressable>
              <Text style={styles.pileMeta}>{me.waste?.length || 0} cards</Text>
            </View>
            <View style={styles.foundationArea}>
              <Text style={styles.foundationLabel}>FOUNDATIONS</Text>
              <View style={styles.foundationWrap}>
                {SUITS.map((suit) => {
                  const pile = me.foundations?.[suit.code] || [];
                  const top = pile.at(-1);
                  const isTarget = foundationTargets.includes(suit.code);
                  return (
                    <Pressable
                      key={suit.code}
                      onPress={() => goFoundation(suit.code)}
                      disabled={!selection || !canPlay || !isTarget}
                      style={[
                        styles.foundationSlot,
                        isTarget && styles.foundationReady,
                        !selection && styles.foundationIdle,
                      ]}
                    >
                      {top ? (
                        <SolitaireCard
                          card={top}
                          width={Math.max(30, Math.min(39, cardWidth - 7))}
                          height={Math.round(Math.max(42, cardHeight - 13))}
                        />
                      ) : (
                        <Text
                          style={[
                            styles.foundationSuit,
                            {
                              color:
                                suit.color === "red" ? "#E05A68" : colors.muted,
                            },
                          ]}
                        >
                          {suit.symbol}
                        </Text>
                      )}
                      <Text style={styles.foundationCount}>
                        {pile.length}/13
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View>
              <Text style={styles.statLabel}>FOUNDATION</Text>
              <Text style={styles.statValue}>{me.progress}/52</Text>
            </View>
            <View>
              <Text style={styles.statLabel}>MOVES</Text>
              <Text style={styles.statValue}>{me.moves}</Text>
            </View>
            <View>
              <Text style={styles.statLabel}>REDEALS</Text>
              <Text style={styles.statValue}>{me.redeals}</Text>
            </View>
            <View>
              <Text style={styles.statLabel}>SCORE</Text>
              <Text style={styles.statValue}>{me.score}</Text>
            </View>
          </View>

          <View style={styles.tableauHeader}>
            <Text style={styles.sectionEyebrow}>TABLEAU</Text>
            <Text style={styles.tableauHint}>
              {selection
                ? "Tap a destination column"
                : "Tap a face-up card to select"}
            </Text>
          </View>

          <View
            style={[
              styles.tableau,
              { gap: Math.max(2, Math.floor(cardWidth * 0.09)) },
            ]}
          >
            {(me.tableau || []).map((column, columnIndex) => (
              <Pressable
                key={`col-${columnIndex}`}
                style={styles.tableauColumn}
                onPress={() =>
                  column.length === 0 ? onEmptyColumn(columnIndex) : undefined
                }
              >
                {column.length === 0 ? (
                  <View
                    style={[
                      styles.emptyTableau,
                      selection && selected?.rank === "K" && styles.targetReady,
                      { width: cardWidth, height: cardHeight },
                    ]}
                  >
                    <Text style={styles.emptyTableauText}>K</Text>
                  </View>
                ) : (
                  column.map((card, cardIndex) => (
                    <View
                      key={card.id}
                      style={{
                        zIndex: cardIndex + 1,
                        marginTop: cardIndex === 0 ? 0 : -stackOffset,
                      }}
                    >
                      <SolitaireCard
                        card={card}
                        width={cardWidth}
                        height={cardHeight}
                        selected={
                          selection?.type === "tableau" &&
                          selection.columnIndex === columnIndex &&
                          selection.cardIndex === cardIndex
                        }
                        disabled={!canPlay || !card.faceUp}
                        onPress={() =>
                          onTableauCard(columnIndex, cardIndex, card)
                        }
                      />
                    </View>
                  ))
                )}
                {selection && validTableauTargets.includes(columnIndex) ? (
                  <View
                    pointerEvents="none"
                    style={[
                      styles.targetGlow,
                      { width: cardWidth + 6, height: cardHeight + 6 },
                    ]}
                  />
                ) : null}
              </Pressable>
            ))}
          </View>

          <View style={styles.selectionBar}>
            <View style={{ flex: 1 }}>
              <Text style={styles.selectionTitle}>
                {selected
                  ? `${selected.rank}${selected.symbol} selected`
                  : "No card selected"}
              </Text>
              <Text style={styles.selectionSub}>
                {selected
                  ? "Tap a highlighted column or foundation."
                  : "Tap a face-up tableau card or the waste card."}
              </Text>
            </View>
            {selected ? (
              <Pressable
                onPress={() => setSelection(null)}
                style={styles.clearButton}
              >
                <Text style={styles.clearButtonText}>CLEAR</Text>
              </Pressable>
            ) : null}
          </View>

          {completed ? (
            <View style={styles.waitingCard}>
              <Ionicons
                name="checkmark-circle"
                size={22}
                color={colors.green}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.waitingTitle}>YOUR BOARD IS COMPLETE</Text>
                <Text style={styles.waitingText}>
                  Waiting for the other players to finish.
                </Text>
              </View>
            </View>
          ) : null}
        </View>

        <View style={styles.privateNotice}>
          <Ionicons name="lock-closed-outline" size={15} color={colors.cyan} />
          <Text style={styles.privateText}>
            Your board is private. Other players only see public progress.
          </Text>
        </View>
      </ScrollView>

      {state.status === "complete" ? (
        <SolitaireResultPanel
          rankings={state.rankings}
          onLobby={() => navigation.goBack()}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenBody: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 0 },
  content: { paddingBottom: 34 },
  loadingScreen: { justifyContent: "center" },
  loadingCard: {
    padding: 24,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: { color: colors.white, fontWeight: "900", fontSize: 20 },
  eyebrow: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.1,
    marginTop: 14,
  },
  loadingTitle: {
    color: colors.text,
    fontSize: 21,
    fontWeight: "900",
    marginTop: 6,
  },
  loadingText: {
    color: colors.muted,
    textAlign: "center",
    lineHeight: 19,
    marginTop: 6,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  title: { color: colors.text, fontSize: 28, fontWeight: "900", marginTop: 3 },
  subtitle: { color: colors.muted, marginTop: 3, fontSize: 12 },
  headerRight: { alignItems: "flex-end", gap: 8 },
  roomPill: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "flex-end",
  },
  roomLabel: { color: colors.muted, fontSize: 8, fontWeight: "900" },
  roomCode: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "900",
    marginTop: 2,
  },
  livePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(74,222,128,0.09)",
  },
  livePillOffline: { backgroundColor: "rgba(255,107,122,0.09)" },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  liveText: { color: colors.green, fontSize: 9, fontWeight: "900" },
  errorBar: {
    marginTop: 12,
    minHeight: 42,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: "rgba(255,107,122,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,107,122,0.2)",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  errorText: { flex: 1, color: colors.text, fontSize: 11, lineHeight: 16 },
  refreshText: { color: colors.red, fontSize: 9, fontWeight: "900" },
  progressHeader: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  sectionEyebrow: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.1,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900",
    marginTop: 4,
  },
  timeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timeText: { color: colors.gold, fontWeight: "900", fontSize: 11 },
  playersGrid: {
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  boardCard: {
    marginTop: 12,
    backgroundColor: "#0B1222",
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    overflow: "hidden",
  },
  boardTop: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  pileBlock: { alignItems: "center" },
  pileLabel: {
    color: colors.muted,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.8,
    marginBottom: 5,
  },
  pileSlot: { width: 52, alignItems: "center" },
  pileMeta: { color: colors.muted, fontSize: 8, marginTop: 4 },
  emptySlot: {
    width: 48,
    height: 68,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  emptySlotText: { color: colors.muted, fontSize: 8, fontWeight: "900" },
  foundationArea: {
    flex: 1,
    minWidth: 0,
    padding: 7,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.025)",
    borderWidth: 1,
    borderColor: "rgba(102,125,177,0.22)",
  },
  foundationLabel: {
    color: colors.muted,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  foundationWrap: { flexDirection: "row", gap: 5, minWidth: 0 },
  foundationSlot: {
    flex: 1,
    minWidth: 0,
    height: 79,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(102,125,177,0.3)",
    backgroundColor: "#0D1629",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 4,
  },
  foundationReady: {
    borderColor: colors.cyan,
    backgroundColor: "rgba(53,216,255,0.10)",
    shadowColor: colors.cyan,
    shadowOpacity: 0.18,
    shadowRadius: 7,
    elevation: 2,
  },
  foundationIdle: { opacity: 0.96 },
  foundationSuit: { fontSize: 22, fontWeight: "900" },
  foundationCount: {
    color: colors.muted,
    fontSize: 7,
    fontWeight: "800",
    marginTop: 2,
  },
  statsRow: {
    marginTop: 12,
    padding: 10,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 5,
  },
  statLabel: { color: colors.muted, fontSize: 7, fontWeight: "900" },
  statValue: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "900",
    marginTop: 2,
  },
  tableauHeader: {
    marginTop: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  tableauHint: { color: colors.muted, fontSize: 8, fontWeight: "700" },
  tableau: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
  },
  tableauColumn: { minHeight: 190, position: "relative", alignItems: "center" },
  emptyTableau: {
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border,
    backgroundColor: "rgba(255,255,255,0.015)",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTableauText: { color: colors.muted, fontWeight: "900", fontSize: 12 },
  targetGlow: {
    position: "absolute",
    top: -3,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.cyan,
    backgroundColor: "rgba(53,216,255,0.05)",
  },
  targetReady: {
    borderColor: colors.cyan,
    backgroundColor: "rgba(53,216,255,0.05)",
  },
  selectionBar: {
    marginTop: 8,
    padding: 10,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  selectionTitle: { color: colors.text, fontWeight: "900", fontSize: 11 },
  selectionSub: { color: colors.muted, fontSize: 9, marginTop: 2 },
  clearButton: {
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 9,
    backgroundColor: colors.surface2,
  },
  clearButtonText: { color: colors.cyan, fontSize: 8, fontWeight: "900" },
  waitingCard: {
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(74,222,128,0.07)",
    borderWidth: 1,
    borderColor: "rgba(74,222,128,0.18)",
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  waitingTitle: { color: colors.green, fontWeight: "900", fontSize: 10 },
  waitingText: { color: colors.muted, fontSize: 9, marginTop: 2 },
  privateNotice: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 4,
  },
  privateText: { color: colors.muted, fontSize: 9, flex: 1 },
});
