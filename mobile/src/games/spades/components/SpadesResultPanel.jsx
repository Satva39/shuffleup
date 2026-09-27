import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { colors } from "../../../theme";
import { GamePanelMotion } from "../../../components/GameMotion";

function SpadesResultPanelContent({ state, canContinue, onNextHand, onLobby }) {
  const scores = state?.scores || {};
  const handResult = state?.handResult || {};
  const winnerTeam = state?.winnerTeam;
  const isGameComplete =
    state?.phase === "game-complete" ||
    state?.status === "game-complete" ||
    !!winnerTeam;

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.shell}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>♠</Text>
        </View>
        <Text style={styles.kicker}>
          {isGameComplete ? "GAME COMPLETE" : "HAND COMPLETE"}
        </Text>
        <Text style={styles.title}>
          {isGameComplete
            ? `${winnerTeam === "A" ? "Team A" : "Team B"} wins`
            : "Hand result"}
        </Text>

        <View style={styles.scoreCard}>
          <View style={styles.teamRow}>
            <View style={styles.teamCopy}>
              <Text style={styles.teamLabel}>TEAM A</Text>
              <Text style={styles.teamSeats}>North + South</Text>
            </View>
            <Text style={styles.score}>
              {scores.A ?? handResult?.scores?.A ?? 0}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.teamRow}>
            <View style={styles.teamCopy}>
              <Text style={styles.teamLabel}>TEAM B</Text>
              <Text style={styles.teamSeats}>East + West</Text>
            </View>
            <Text style={styles.score}>
              {scores.B ?? handResult?.scores?.B ?? 0}
            </Text>
          </View>
        </View>

        {!isGameComplete && handResult?.made !== undefined ? (
          <Text style={styles.note}>
            {handResult.made ? "Contract made" : "Contract missed"}
          </Text>
        ) : null}

        {isGameComplete ? (
          <Pressable onPress={onLobby} style={styles.primary}>
            <Text style={styles.primaryText}>Return to Lobby</Text>
          </Pressable>
        ) : canContinue ? (
          <Pressable onPress={onNextHand} style={styles.primary}>
            <Text style={styles.primaryText}>Start Next Hand</Text>
          </Pressable>
        ) : (
          <View style={styles.waiting}>
            <Text style={styles.waitTitle}>Waiting for the dealer</Text>
            <Text style={styles.waitText}>
              The next hand will begin from the dealer's action.
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

export default function SpadesResultPanel(props) {
  return (
    <GamePanelMotion motionKey="result:SpadesResultPanel">
      <SpadesResultPanelContent {...props} />
    </GamePanelMotion>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  shell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 22,
  },
  logo: {
    width: 74,
    height: 74,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#38417E",
    backgroundColor: "#1B2150",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: { color: colors.text, fontSize: 35, fontWeight: "900" },
  kicker: {
    color: colors.cyan,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginTop: 16,
  },
  title: {
    color: colors.text,
    fontSize: 29,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 6,
  },
  scoreCard: {
    width: "100%",
    maxWidth: 420,
    marginTop: 22,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 15,
  },
  teamRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  teamCopy: { flex: 1 },
  teamLabel: {
    color: colors.gold,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },
  teamSeats: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 3,
  },
  score: { color: colors.text, fontSize: 27, fontWeight: "900" },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 13 },
  note: { color: colors.muted, fontSize: 11, fontWeight: "700", marginTop: 14 },
  primary: {
    width: "100%",
    maxWidth: 420,
    minHeight: 52,
    marginTop: 18,
    borderRadius: 16,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: { color: "#1D1A10", fontSize: 14, fontWeight: "900" },
  waiting: {
    width: "100%",
    maxWidth: 420,
    marginTop: 18,
    padding: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
  },
  waitTitle: { color: colors.text, fontSize: 13, fontWeight: "900" },
  waitText: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 4,
    lineHeight: 15,
  },
});
