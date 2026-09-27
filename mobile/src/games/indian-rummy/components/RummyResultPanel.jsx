import { ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { colors, radii } from "../../../theme";
import AppButton from "../../../components/AppButton";
import { GamePanelMotion } from "../../../components/GameMotion";

function groupLabel(group) {
  if (!group) return "Group";
  return `${group.pure ? "PURE" : "IMPURE"} ${group.type === "sequence" ? "SEQUENCE" : "SET"}`;
}

function RummyResultPanelContent({ result, userId, onLobby }) {
  const winner = result?.players?.find(
    (player) => player.id === result?.winnerId,
  );

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={["#0A142A", "#08101B", "#070B17"]}
        style={StyleSheet.absoluteFillObject}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.iconCircle}>
          <Ionicons name="trophy" size={30} color={colors.gold} />
        </View>
        <Text style={styles.kicker}>INDIAN RUMMY · COMPLETE</Text>
        <Text style={styles.title}>Game finished</Text>
        <Text style={styles.subtitle}>
          {winner?.id === userId
            ? "You declared a winning hand."
            : `${winner?.username || "A player"} declared a winning hand.`}
        </Text>

        <View style={styles.winnerCard}>
          <Text style={styles.cardKicker}>WINNER</Text>
          <Text style={styles.winnerName}>
            {winner?.username || "Unknown player"}
          </Text>
          <Text style={styles.zeroScore}>0 POINTS</Text>
          {winner?.groups?.length ? (
            <View style={styles.groupRow}>
              {winner.groups.map((group, index) => (
                <View key={`${group.type}-${index}`} style={styles.groupChip}>
                  <Text style={styles.groupChipText}>{groupLabel(group)}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.resultCard}>
          <Text style={styles.cardKicker}>SCORES</Text>
          {(result?.players || []).map((player) => (
            <View key={player.id} style={styles.scoreRow}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text numberOfLines={1} style={styles.playerName}>
                  {player.username}
                </Text>
                <Text style={styles.playerStatus}>
                  {player.status === "winner" ? "WINNER" : "PENALTY"}
                </Text>
              </View>
              <Text
                style={[
                  styles.score,
                  player.id === result?.winnerId && styles.winnerScore,
                ]}
              >
                {player.score}
              </Text>
            </View>
          ))}
        </View>

        <AppButton
          title="Return to Play"
          onPress={onLobby}
          style={{ marginTop: 18 }}
        />
      </ScrollView>
    </View>
  );
}

export default function RummyResultPanel(props) {
  return (
    <GamePanelMotion motionKey="result:RummyResultPanel">
      <RummyResultPanelContent {...props} />
    </GamePanelMotion>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { flexGrow: 1, padding: 22, paddingTop: 46, paddingBottom: 30 },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(247,198,93,0.14)",
    borderWidth: 1,
    borderColor: "rgba(247,198,93,0.35)",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  kicker: {
    color: colors.cyan,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.5,
    textAlign: "center",
    marginTop: 18,
  },
  title: {
    color: colors.text,
    fontSize: 31,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 5,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 8,
  },
  winnerCard: {
    marginTop: 24,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "rgba(247,198,93,0.34)",
    borderRadius: radii.lg,
    padding: 20,
    alignItems: "center",
  },
  cardKicker: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  winnerName: {
    color: colors.text,
    fontSize: 23,
    fontWeight: "900",
    marginTop: 8,
  },
  zeroScore: {
    color: colors.green,
    fontSize: 11,
    fontWeight: "900",
    marginTop: 6,
  },
  groupRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 6,
    marginTop: 14,
  },
  groupChip: {
    backgroundColor: colors.surface2,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: colors.border,
  },
  groupChipText: { color: colors.cyan, fontSize: 8, fontWeight: "900" },
  resultCard: {
    marginTop: 14,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  score: {
    color: colors.text,
    fontSize: 19,
    fontWeight: "900",
    marginLeft: 12,
  },
  winnerScore: { color: colors.green },
  playerName: { color: colors.text, fontSize: 13, fontWeight: "900" },
  playerStatus: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: "800",
    marginTop: 3,
  },
});
