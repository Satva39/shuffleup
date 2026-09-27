import { ScrollView, StyleSheet, Text, View } from "react-native";
import AppButton from "../../../components/AppButton";
import { colors, radii } from "../../../theme";
import { GamePanelMotion } from "../../../components/GameMotion";

function TeenPattiResultPanelContent({
  gameState,
  userId,
  onNextRound,
  onLobby,
}) {
  const roundComplete = gameState?.status === "round-complete";
  const result = gameState?.result;
  const roundResult = gameState?.lastRoundResult;

  if (roundComplete && !roundResult) return null;
  if (!roundComplete && !result) return null;

  if (roundComplete) {
    const canStartNext = gameState.legalActions?.includes("next-round");
    const isRoundWinner = roundResult?.winnerId === userId;

    return (
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.kicker}>ROUND {roundResult.round} COMPLETE</Text>
          <Text style={styles.trophy}>🏆</Text>
          <Text style={styles.title}>{roundResult.winnerUsername}</Text>
          <Text style={styles.subtitle}>
            {isRoundWinner ? "You won this round" : "Round winner"}
          </Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>HAND</Text>
            <Text style={styles.infoValue}>
              {roundResult.hand?.name || "—"}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>PROGRESS</Text>
            <Text style={styles.infoValue}>
              {gameState.round} / {gameState.totalRounds || 11}
            </Text>
          </View>

          {canStartNext ? (
            <AppButton
              title="Next round"
              onPress={onNextRound}
              style={styles.button}
            />
          ) : (
            <Text style={styles.waiting}>
              Waiting for a connected player to start the next round…
            </Text>
          )}
          <AppButton
            title="Return to lobby"
            variant="secondary"
            onPress={onLobby}
            style={styles.button}
          />
        </View>
      </View>
    );
  }

  const scores = [...(result?.scores || [])];

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <Text style={styles.kicker}>GAME COMPLETE</Text>
        <Text style={styles.trophy}>🏆</Text>
        <Text style={styles.title}>{result.winnerUsername}</Text>
        <Text style={styles.subtitle}>Overall winner</Text>

        <View style={styles.winnerBox}>
          <Text style={styles.infoLabel}>WINNER SCORE</Text>
          <Text style={styles.winnerScore}>{result.winnerScore ?? 0}</Text>
          <Text style={styles.small}>
            {result.totalRounds || 11} rounds completed
          </Text>
        </View>

        <ScrollView
          style={styles.scoreList}
          contentContainerStyle={{ gap: 8 }}
          showsVerticalScrollIndicator={false}
        >
          {scores.map((player) => (
            <View key={player.id} style={styles.scoreRow}>
              <Text numberOfLines={1} style={styles.scoreName}>
                {player.username}
              </Text>
              <Text style={styles.scoreValue}>{player.score ?? 0}</Text>
            </View>
          ))}
        </ScrollView>

        <AppButton
          title="Return to lobby"
          onPress={onLobby}
          style={styles.button}
        />
      </View>
    </View>
  );
}

export default function TeenPattiResultPanel(props) {
  return (
    <GamePanelMotion motionKey="result:TeenPattiResultPanel">
      <TeenPattiResultPanelContent {...props} />
    </GamePanelMotion>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "#070B17",
    padding: 20,
    justifyContent: "center",
  },
  card: {
    maxHeight: "92%",
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
  },
  kicker: {
    color: colors.cyan,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.3,
  },
  trophy: { fontSize: 44, marginTop: 8 },
  title: { color: colors.text, fontSize: 29, fontWeight: "900", marginTop: 4 },
  subtitle: { color: colors.muted, marginTop: 4, fontSize: 13 },
  infoRow: {
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: colors.surface2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  infoLabel: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },
  infoValue: { color: colors.text, fontSize: 14, fontWeight: "900" },
  winnerBox: {
    marginTop: 14,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "rgba(247,198,93,0.08)",
    borderWidth: 1,
    borderColor: "rgba(247,198,93,0.2)",
  },
  winnerScore: {
    color: colors.gold,
    fontSize: 34,
    fontWeight: "900",
    marginTop: 2,
  },
  small: { color: colors.muted, fontSize: 10, marginTop: 2 },
  scoreList: { marginTop: 14, maxHeight: 220 },
  scoreRow: {
    minHeight: 46,
    borderRadius: 14,
    backgroundColor: colors.surface2,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  scoreName: { color: colors.text, fontSize: 13, fontWeight: "800", flex: 1 },
  scoreValue: { color: colors.cyan, fontSize: 18, fontWeight: "900" },
  waiting: {
    color: colors.muted,
    textAlign: "center",
    lineHeight: 18,
    marginTop: 14,
  },
  button: { marginTop: 10 },
});
