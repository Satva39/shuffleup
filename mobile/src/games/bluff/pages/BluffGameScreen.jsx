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
import Screen from "../../../components/Screen";
import { colors, radii } from "../../../theme";
import BluffCard, { BluffCardBack } from "../components/BluffCard";
import BluffSeatRow from "../components/BluffSeatRow";
import BluffSeat from "../components/BluffSeat";
import BluffHistory from "../components/BluffHistory";
import BluffResultModal from "../components/BluffResultModal";
import useBluffSocket from "../hooks/useBluffSocket";
import { phaseLabel } from "../utils/cards";

export default function BluffGameScreen({ route, navigation }) {
  const { roomCode } = route.params;
  const { state, error, connected, user, playCards, challenge, refreshState } =
    useBluffSocket({ roomCode });
  const [selectedIds, setSelectedIds] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const me = useMemo(
    () => state?.players?.find((player) => player.id === user?.id),
    [state?.players, user?.id],
  );
  const current = useMemo(
    () =>
      state?.players?.find((player) => player.id === state?.currentPlayerId),
    [state?.players, state?.currentPlayerId],
  );
  const canPlay = Boolean(state?.canPlay);
  const canChallenge = Boolean(state?.canChallenge);
  const maxSelectable = 4;

  useEffect(() => {
    setSelectedIds([]);
  }, [state?.currentPlayerId, state?.phase, state?.currentClaim?.id]);
  useEffect(() => {
    if (!state?.currentClaim?.expiresAt) {
      setSeconds(0);
      return undefined;
    }
    const update = () =>
      setSeconds(
        Math.max(
          0,
          Math.ceil((state.currentClaim.expiresAt - Date.now()) / 1000),
        ),
      );
    update();
    const timer = setInterval(update, 250);
    return () => clearInterval(timer);
  }, [state?.currentClaim?.expiresAt]);
  useEffect(() => {
    if (!state?.lastChallenge?.resolvedAt) return undefined;
    setShowResult(true);
    const timer = setTimeout(() => setShowResult(false), 5200);
    return () => clearTimeout(timer);
  }, [state?.lastChallenge?.resolvedAt]);

  if (!state) {
    return (
      <Screen contentStyle={styles.loadingScreen}>
        <View style={styles.loadingCard}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>SU</Text>
          </View>
          <Text style={styles.eyebrow}>SHUFFLEUP · BLUFF / CHEAT</Text>
          <Text style={styles.loadingTitle}>JOINING THE LIVE TABLE</Text>
          <Text style={styles.loadingText}>
            {error || "Preparing your cards and table…"}
          </Text>
          <ActivityIndicator
            size="small"
            color={colors.cyan}
            style={{ marginTop: 22 }}
          />
        </View>
      </Screen>
    );
  }

  const toggleCard = (cardId) => {
    if (!canPlay) return;
    setSelectedIds((currentIds) => {
      if (currentIds.includes(cardId))
        return currentIds.filter((id) => id !== cardId);
      if (currentIds.length >= maxSelectable) return currentIds;
      return [...currentIds, cardId];
    });
  };
  const submit = () => {
    if (selectedIds.length) playCards(selectedIds);
  };
  const winner =
    state.players?.find((player) => player.id === state.winnerId) || null;

  return (
    <Screen
      scroll={false}
      contentStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 0 }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 34 }}
      >
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>SHUFFLEUP · BLUFF / CHEAT</Text>
            <Text style={styles.title}>Bluff</Text>
          </View>
          <View style={styles.roomPill}>
            <Text style={styles.roomLabel}>ROOM</Text>
            <Text style={styles.roomCode}>{state.roomCode}</Text>
          </View>
        </View>
        <View style={styles.statusRow}>
          <View>
            <Text style={styles.statusLabel}>PHASE</Text>
            <Text style={styles.statusValue}>{phaseLabel(state.phase)}</Text>
          </View>
          <View>
            <Text style={styles.statusLabel}>PILE</Text>
            <Text style={styles.statusValue}>{state.pileCount}</Text>
          </View>
          <View>
            <Text style={styles.statusLabel}>RANK</Text>
            <Text style={[styles.statusValue, { color: colors.gold }]}>
              {state.requiredRank}
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View
              style={[
                styles.liveDot,
                !connected && { backgroundColor: colors.red },
              ]}
            />
            <Text
              style={[styles.liveText, !connected && { color: colors.red }]}
            >
              {connected ? "LIVE" : "RECONNECTING"}
            </Text>
          </View>
        </View>
        {error ? (
          <Pressable onPress={refreshState} style={styles.errorBar}>
            <Ionicons name="warning-outline" color={colors.red} size={18} />
            <Text style={styles.errorText}>{error}</Text>
          </Pressable>
        ) : null}
        <View style={styles.table}>
          <BluffSeatRow
            players={state.players}
            viewerId={user.id}
            currentPlayerId={state.currentPlayerId}
          />
          <View style={styles.turnBanner}>
            <Text style={styles.turnEyebrow}>
              {state.currentPlayerId === user.id && state.phase === "play"
                ? "YOUR TURN"
                : `${current?.username || "Player"}'S TURN`}
            </Text>
            <Text style={styles.turnValue}>
              {state.phase === "play"
                ? `Claim ${state.requiredRank}`
                : state.phase === "challenge"
                  ? "Challenge window"
                  : "Final challenge"}
            </Text>
          </View>
          <View style={styles.centerRow}>
            <View style={styles.pileArea}>
              <View style={styles.pileStack}>
                <BluffCardBack small />
                <BluffCardBack small />
                <BluffCardBack />
                <View style={styles.pileCount}>
                  <Text style={styles.pileCountText}>{state.pileCount}</Text>
                </View>
              </View>
              <Text style={styles.pileLabel}>FACE-DOWN PILE</Text>
            </View>
            <View style={styles.claimCard}>
              <Text style={styles.claimEyebrow}>CURRENT CLAIM</Text>
              {state.currentClaim ? (
                <>
                  <Text style={styles.claimMain}>
                    {state.currentClaim.count} × {state.currentClaim.rank}
                  </Text>
                  <Text style={styles.claimWho}>
                    {state.currentClaim.playerName}
                  </Text>
                  <View style={styles.timerPill}>
                    <Text style={styles.timerText}>{seconds}s</Text>
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.claimMain}>NONE</Text>
                  <Text style={styles.claimWho}>Waiting for a claim</Text>
                </>
              )}
            </View>
          </View>
          {state.currentClaim ? (
            <View
              style={[
                styles.challengeStrip,
                canChallenge && styles.challengeStripActive,
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.challengeTitle}>
                  {state.currentClaim.playerName} claims{" "}
                  {state.currentClaim.count} × {state.currentClaim.rank}
                </Text>
                <Text style={styles.challengeSub}>
                  {seconds > 0 ? `${seconds}s to challenge` : "Resolving…"}
                </Text>
              </View>
              <Pressable
                disabled={!canChallenge}
                onPress={challenge}
                style={({ pressed }) => [
                  styles.challengeButton,
                  !canChallenge && styles.buttonDisabled,
                  pressed && { opacity: 0.84 },
                ]}
              >
                <Text style={styles.challengeButtonText}>CALL BLUFF</Text>
              </Pressable>
            </View>
          ) : null}
          <View style={{ marginTop: 16 }}>
            <BluffSeat
              player={me}
              isYou
              active={
                state.currentPlayerId === user.id && state.phase === "play"
              }
            />
          </View>
        </View>
        <View style={styles.handPanel}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionEyebrow}>YOUR HAND</Text>
              <Text style={styles.sectionTitle}>
                {state.hand?.length || 0} cards
              </Text>
            </View>
            <View style={styles.privatePill}>
              <Text style={styles.privateText}>PRIVATE</Text>
            </View>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: 14, paddingBottom: 10 }}
          >
            {(state.hand || []).map((card) => {
              const selectable =
                canPlay && state.selectableCardIds?.includes(card.id);
              return (
                <BluffCard
                  key={card.id}
                  card={card}
                  selected={selectedIds.includes(card.id)}
                  disabled={!selectable}
                  onPress={toggleCard}
                />
              );
            })}
          </ScrollView>
          <View style={styles.handFooter}>
            <Text style={styles.handHint}>
              {canPlay
                ? `Select 1–${maxSelectable} cards • ${selectedIds.length} selected`
                : "Waiting for the current claim to resolve"}
            </Text>
            <Pressable
              disabled={!canPlay || selectedIds.length === 0}
              onPress={submit}
              style={({ pressed }) => [
                styles.playButton,
                (!canPlay || selectedIds.length === 0) && styles.buttonDisabled,
                pressed && { opacity: 0.86 },
              ]}
            >
              <Text style={styles.playButtonText}>PLAY FACE-DOWN</Text>
            </Pressable>
          </View>
        </View>
        <BluffHistory history={state.claimHistory} />
        {state.lastChallenge ? (
          <View style={styles.lastResultCard}>
            <Text style={styles.sectionEyebrow}>LAST RESOLUTION</Text>
            <Text
              style={[
                styles.lastResult,
                state.lastChallenge.result === "BLUFF"
                  ? { color: colors.red }
                  : { color: colors.green },
              ]}
            >
              {state.lastChallenge.result}
            </Text>
            <Text style={styles.lastResultText}>
              {state.lastChallenge.penaltyRecipientUsername} took the pile.
            </Text>
          </View>
        ) : null}
        {state.status === "complete" ? (
          <View style={styles.gameOverCard}>
            <Text style={styles.sectionEyebrow}>GAME COMPLETE</Text>
            <Text style={styles.gameOverTitle}>
              {winner?.id === user.id
                ? "YOU WIN"
                : `${winner?.username || "Player"} WINS`}
            </Text>
            <Text style={styles.gameOverText}>
              All cards were cleared from the winning hand.
            </Text>
            <Pressable
              onPress={() => navigation.goBack()}
              style={styles.lobbyButton}
            >
              <Text style={styles.lobbyButtonText}>BACK TO LOBBY</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
      <BluffResultModal
        result={state.lastChallenge}
        winner={winner}
        localPlayerId={user.id}
        visible={showResult}
        onClose={() => setShowResult(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  loadingScreen: { justifyContent: "center" },
  loadingCard: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 28,
  },
  logo: {
    width: 70,
    height: 70,
    borderRadius: 22,
    backgroundColor: "#1D2452",
    borderWidth: 1,
    borderColor: "#374788",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: { color: colors.text, fontWeight: "900", fontSize: 24 },
  eyebrow: {
    color: colors.cyan,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  loadingTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "900",
    marginTop: 14,
    textAlign: "center",
  },
  loadingText: {
    color: colors.muted,
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },
  header: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  title: { color: colors.text, fontSize: 34, fontWeight: "900", marginTop: 3 },
  roomPill: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginLeft: 12,
  },
  roomLabel: { color: colors.muted, fontSize: 9, fontWeight: "900" },
  roomCode: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900",
    marginTop: 2,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginTop: 16,
    marginBottom: 12,
  },
  statusLabel: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  statusValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "900",
    marginTop: 2,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.green,
  },
  liveText: { color: colors.green, fontSize: 10, fontWeight: "900" },
  errorBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#321523",
    borderWidth: 1,
    borderColor: "#6B3145",
    borderRadius: radii.md,
    padding: 12,
    marginBottom: 12,
  },
  errorText: { flex: 1, color: "#FFD4DB", fontSize: 12, lineHeight: 17 },
  table: {
    backgroundColor: "#073A31",
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#126A59",
    padding: 14,
    minHeight: 520,
  },
  turnBanner: { alignItems: "center", marginTop: 14, marginBottom: 10 },
  turnEyebrow: {
    color: colors.cyan,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  turnValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900",
    marginTop: 3,
    textAlign: "center",
  },
  centerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    marginTop: 6,
  },
  pileArea: { width: 112, alignItems: "center" },
  pileStack: {
    height: 92,
    width: 80,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  pileCount: {
    position: "absolute",
    right: -4,
    top: -6,
    minWidth: 32,
    height: 28,
    paddingHorizontal: 8,
    borderRadius: 14,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  pileCountText: { color: "#241B05", fontSize: 12, fontWeight: "900" },
  pileLabel: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: "900",
    marginTop: 8,
    letterSpacing: 0.8,
  },
  claimCard: {
    width: 184,
    minHeight: 126,
    backgroundColor: "rgba(4,20,17,0.76)",
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: "#1C7765",
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  claimEyebrow: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  claimMain: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "900",
    marginTop: 6,
  },
  claimWho: { color: colors.muted, fontSize: 11, marginTop: 2 },
  timerPill: {
    marginTop: 8,
    backgroundColor: "#2B2A11",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  timerText: { color: colors.gold, fontSize: 10, fontWeight: "900" },
  challengeStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 14,
    padding: 11,
    borderRadius: radii.md,
    backgroundColor: "rgba(11,19,38,0.78)",
    borderWidth: 1,
    borderColor: colors.border,
  },
  challengeStripActive: { borderColor: colors.gold },
  challengeTitle: { color: colors.text, fontSize: 12, fontWeight: "900" },
  challengeSub: { color: colors.muted, fontSize: 10, marginTop: 2 },
  challengeButton: {
    minHeight: 42,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: colors.red,
    alignItems: "center",
    justifyContent: "center",
  },
  challengeButtonText: { color: colors.white, fontSize: 10, fontWeight: "900" },
  handPanel: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginTop: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionEyebrow: {
    color: colors.cyan,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.4,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 25,
    fontWeight: "900",
    marginTop: 3,
  },
  privatePill: {
    backgroundColor: "#10342F",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  privateText: { color: colors.green, fontSize: 9, fontWeight: "900" },
  handFooter: { marginTop: 2 },
  handHint: { color: colors.muted, fontSize: 11, lineHeight: 16 },
  playButton: {
    marginTop: 10,
    minHeight: 50,
    borderRadius: radii.md,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  playButtonText: {
    color: "#201A07",
    fontWeight: "900",
    fontSize: 12,
    letterSpacing: 0.7,
  },
  buttonDisabled: { opacity: 0.35 },
  lastResultCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginTop: 12,
  },
  lastResult: { fontSize: 24, fontWeight: "900", marginTop: 4 },
  lastResultText: { color: colors.muted, marginTop: 4, fontSize: 12 },
  gameOverCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.gold,
    padding: 18,
    marginTop: 12,
  },
  gameOverTitle: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "900",
    marginTop: 4,
  },
  gameOverText: { color: colors.muted, marginTop: 6, lineHeight: 19 },
  lobbyButton: {
    minHeight: 52,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
  },
  lobbyButtonText: { color: colors.white, fontWeight: "900" },
});
