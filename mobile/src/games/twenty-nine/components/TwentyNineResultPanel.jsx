import { StyleSheet, Text, View } from "react-native";
import AppButton from "../../../components/AppButton";
import { colors, radii } from "../../../theme";
import { GamePanelMotion } from "../../../components/GameMotion";

function TwentyNineResultPanelContent({ gameState, onNextHand, onLobby }) {
  const result = gameState?.handResult;
  const complete = gameState?.status === "game-complete";
  const dealer = gameState?.mySeat === gameState?.dealer;
  return (
    <View style={styles.root}>
      <View style={styles.logo}>
        <Text style={styles.logoText}>SU</Text>
      </View>
      <Text style={styles.eyebrow}>SHUFFLEUP · TWENTY-NINE</Text>
      <Text style={styles.title}>
        {complete ? "GAME COMPLETE" : "HAND COMPLETE"}
      </Text>
      {result ? (
        <View style={styles.card}>
          <Text style={styles.label}>HAND {result.handNumber}</Text>
          <Text style={styles.contract}>
            Team {result.contract?.team} · Bid {result.contract?.bid}
          </Text>
          <Text style={styles.made}>
            {result.contract?.made ? "CONTRACT MADE" : "CONTRACT SET"}
          </Text>
          <View style={styles.scoreRow}>
            <View style={styles.scoreBox}>
              <Text style={styles.scoreLabel}>TEAM A</Text>
              <Text style={styles.score}>{result.scores?.A ?? 0}</Text>
            </View>
            <View style={styles.scoreBox}>
              <Text style={styles.scoreLabel}>TEAM B</Text>
              <Text style={styles.score}>{result.scores?.B ?? 0}</Text>
            </View>
          </View>
          <Text style={styles.points}>
            Card points · A {result.teamCardPoints?.A ?? 0} · B{" "}
            {result.teamCardPoints?.B ?? 0}
          </Text>
        </View>
      ) : null}
      {complete ? (
        <Text style={styles.winner}>Team {gameState.winnerTeam} wins</Text>
      ) : null}
      {!complete && dealer ? (
        <AppButton title="Start Next Hand" onPress={onNextHand} />
      ) : null}
      <AppButton
        title="Return to Lobby"
        variant="secondary"
        onPress={onLobby}
      />
    </View>
  );
}

export default function TwentyNineResultPanel(props) {
  return (
    <GamePanelMotion motionKey="result:TwentyNineResultPanel">
      <TwentyNineResultPanelContent {...props} />
    </GamePanelMotion>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
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
  logoText: { color: colors.text, fontSize: 28, fontWeight: "900" },
  eyebrow: {
    color: colors.cyan,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.6,
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "900",
    marginTop: 8,
    textAlign: "center",
  },
  card: {
    width: "100%",
    maxWidth: 520,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    marginTop: 22,
    marginBottom: 18,
  },
  label: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  contract: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900",
    marginTop: 5,
  },
  made: { color: colors.gold, fontSize: 12, fontWeight: "900", marginTop: 8 },
  scoreRow: { flexDirection: "row", gap: 10, marginTop: 18 },
  scoreBox: {
    flex: 1,
    backgroundColor: colors.surface2,
    borderRadius: radii.md,
    padding: 14,
  },
  scoreLabel: { color: colors.muted, fontSize: 9, fontWeight: "900" },
  score: { color: colors.text, fontSize: 28, fontWeight: "900", marginTop: 2 },
  points: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 12,
  },
  winner: {
    color: colors.gold,
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 16,
  },
});
