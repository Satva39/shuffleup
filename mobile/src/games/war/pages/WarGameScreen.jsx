import { useMemo } from "react";
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
import { useAuth } from "../../../context/AuthStore";
import useWarSocket from "../hooks/useWarSocket";
import WarSeat from "../components/WarSeat";
import WarBattleArea from "../components/WarBattleArea";
import WarResultPanel from "../components/WarResultPanel";

function phaseLabel(phase, status) {
  if (status === "complete") return "GAME COMPLETE";
  if (phase === "ready") return "WAITING";
  if (phase === "battle-reveal") return "REVEALING";
  if (phase === "war") return "WAR";
  if (phase === "war-reveal") return "WAR REVEAL";
  if (phase === "battle-result") return "BATTLE RESULT";
  return "LIVE";
}

export default function WarGameScreen({ route, navigation }) {
  const { roomCode } = route.params;
  const { user } = useAuth();
  const { state, error, connected, refreshState } = useWarSocket({
    roomCode,
    user,
  });

  const me = useMemo(
    () => state?.players?.find((player) => player.id === user?.id),
    [state?.players, user?.id],
  );

  const activeIds = useMemo(
    () =>
      new Set([
        ...(state?.revealedCards || []).map((entry) => entry.playerId),
        ...(state?.tiedPlayerIds || []),
      ]),
    [state?.revealedCards, state?.tiedPlayerIds],
  );

  if (!state) {
    return (
      <Screen contentStyle={styles.loadingScreen}>
        <View style={styles.loadingCard}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>SU</Text>
          </View>
          <Text style={styles.eyebrow}>SHUFFLEUP · WAR</Text>
          <Text style={styles.loadingTitle}>JOINING THE BATTLE</Text>
          <Text style={styles.loadingText}>
            {error || "Preparing the live War table…"}
          </Text>
          <ActivityIndicator
            size="small"
            color={colors.cyan}
            style={{ marginTop: 20 }}
          />
        </View>
      </Screen>
    );
  }

  const isWar = state.phase === "war" || state.phase === "war-reveal";
  const isResult = state.phase === "battle-result";
  const liveLabel = connected ? "LIVE" : "RECONNECTING";

  return (
    <Screen
      scroll={false}
      contentStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 0 }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>SHUFFLEUP · WAR</Text>
            <Text style={styles.title}>War</Text>
          </View>
          <View style={styles.roomPill}>
            <Text style={styles.roomLabel}>ROOM</Text>
            <Text style={styles.roomCode}>{state.roomCode}</Text>
          </View>
        </View>

        <View style={styles.statusRow}>
          <View style={styles.statusBox}>
            <Text style={styles.statusLabel}>BATTLE</Text>
            <Text style={styles.statusValue}>#{state.battleCount || 0}</Text>
          </View>
          <View style={styles.statusBox}>
            <Text style={styles.statusLabel}>STATE</Text>
            <Text numberOfLines={1} style={styles.statusValue}>
              {phaseLabel(state.phase, state.status)}
            </Text>
          </View>
          <View style={styles.liveWrap}>
            <View style={[styles.liveDot, !connected && styles.offlineDot]} />
            <Text style={[styles.liveText, !connected && styles.offlineText]}>
              {liveLabel}
            </Text>
          </View>
        </View>

        {error ? (
          <Pressable onPress={refreshState} style={styles.errorBar}>
            <Ionicons name="warning-outline" size={18} color={colors.red} />
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.retry}>SYNC</Text>
          </Pressable>
        ) : null}

        <View style={styles.table}>
          <View style={styles.opponentRow}>
            {state.players
              .filter((player) => player.id !== user?.id)
              .map((player) => (
                <WarSeat
                  key={player.id}
                  player={player}
                  isYou={player.id === user?.id}
                  active={activeIds.has(player.id) && !isResult}
                />
              ))}
          </View>

          <View style={styles.turnPanel}>
            <Text style={styles.turnEyebrow}>
              {isWar ? "WAR" : isResult ? "BATTLE RESULT" : "CURRENT BATTLE"}
            </Text>
            <Text style={styles.turnTitle}>
              {isWar
                ? `WAR ${state.warDepth || 1}`
                : isResult
                  ? "BATTLE RESOLVED"
                  : "REVEAL IN PROGRESS"}
            </Text>
            <Text style={styles.turnText}>
              {isWar
                ? "Tied cards trigger an automatic face-down card, followed by another reveal."
                : isResult
                  ? "The server has resolved the battle. The next battle begins automatically."
                  : state.phase === "ready"
                    ? "Both players must be connected before the server starts the first battle."
                    : "Cards are revealed automatically. No player action is required."}
            </Text>
          </View>

          <WarBattleArea state={state} viewerId={user?.id} />

          {me ? (
            <View style={styles.youRow}>
              <WarSeat
                player={me}
                isYou
                active={activeIds.has(me.id) && !isResult}
              />
            </View>
          ) : null}
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoTop}>
            <View>
              <Text style={styles.infoEyebrow}>YOUR PILE</Text>
              <Text style={styles.infoTitle}>
                {me?.cardCount ?? state.yourCardCount ?? 0} cards
              </Text>
            </View>
            <View style={styles.privatePill}>
              <Text style={styles.privateText}>PRIVATE</Text>
            </View>
          </View>
          <View style={styles.infoGrid}>
            <View style={styles.infoCell}>
              <Text style={styles.cellLabel}>BATTLE CARDS</Text>
              <Text style={styles.cellValue}>{state.battlePileCount || 0}</Text>
            </View>
            <View style={styles.infoCell}>
              <Text style={styles.cellLabel}>FACE-DOWN</Text>
              <Text style={styles.cellValue}>{state.faceDownCount || 0}</Text>
            </View>
            <View style={styles.infoCell}>
              <Text style={styles.cellLabel}>WAR DEPTH</Text>
              <Text style={styles.cellValue}>{state.warDepth || 0}</Text>
            </View>
          </View>
        </View>

        {isResult && state.status === "playing" ? (
          <View style={styles.nextCard}>
            <Text style={styles.nextEyebrow}>NEXT BATTLE</Text>
            <Text style={styles.nextTitle}>Starting automatically…</Text>
            <Text style={styles.nextText}>
              Stay on the table. The server controls the next reveal.
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <WarResultPanel
        state={state}
        localPlayerId={user?.id}
        onLobby={() => navigation.goBack()}
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
    marginTop: 14,
    marginBottom: 12,
    gap: 10,
  },
  statusBox: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 9,
    flex: 1,
    minHeight: 58,
  },
  statusLabel: {
    color: colors.muted,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
  },
  statusValue: {
    color: colors.text,
    fontSize: 11,
    fontWeight: "900",
    marginTop: 4,
  },
  liveWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 3,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.green,
  },
  offlineDot: { backgroundColor: colors.red },
  liveText: { color: colors.green, fontSize: 9, fontWeight: "900" },
  offlineText: { color: colors.red },
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
  retry: { color: colors.cyan, fontSize: 9, fontWeight: "900" },
  table: {
    backgroundColor: "#073A31",
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#126A59",
    padding: 14,
    minHeight: 500,
    overflow: "hidden",
  },
  opponentRow: { flexDirection: "row", gap: 8 },
  turnPanel: {
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  turnEyebrow: {
    color: colors.gold,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  turnTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900",
    marginTop: 4,
    textAlign: "center",
  },
  turnText: {
    color: colors.muted,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 4,
    textAlign: "center",
    maxWidth: 300,
  },
  youRow: { marginTop: 10 },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginTop: 12,
  },
  infoTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  infoEyebrow: {
    color: colors.cyan,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.3,
  },
  infoTitle: {
    color: colors.text,
    fontSize: 26,
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
  infoGrid: { flexDirection: "row", gap: 8, marginTop: 14 },
  infoCell: {
    flex: 1,
    backgroundColor: colors.surface2,
    borderRadius: 14,
    padding: 10,
  },
  cellLabel: {
    color: colors.muted,
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  cellValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
    marginTop: 4,
  },
  nextCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.gold,
    padding: 16,
    marginTop: 12,
  },
  nextEyebrow: {
    color: colors.gold,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.3,
  },
  nextTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900",
    marginTop: 4,
  },
  nextText: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 4 },
});
