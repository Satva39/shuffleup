import { Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, radii } from "../../../theme";
import { GamePanelMotion } from "../../../components/GameMotion";

function NapoleonResultPanelContent({ gameState, onNextRound, onLobby }) {
  const complete = gameState?.status === "game-complete";
  const winner = gameState?.winner;
  const roundResult = gameState?.roundResult;

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={["#090F22", "#061019"]}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.panel}>
        <Text style={styles.kicker}>
          {complete ? "GAME COMPLETE" : "ROUND COMPLETE"}
        </Text>
        <Text style={styles.title}>
          {complete
            ? winner?.username || "Winner"
            : roundResult?.success
              ? "Contract fulfilled"
              : "Contract missed"}
        </Text>

        {!complete && roundResult ? (
          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.label}>TEAM POINTS</Text>
              <Text style={styles.value}>{roundResult.teamPoints}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.label}>TARGET</Text>
              <Text style={styles.value}>{roundResult.target}</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.scores}>
          {(gameState?.players || []).map((player) => (
            <View key={player.id} style={styles.scoreRow}>
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={styles.playerName}>
                  {player.username}
                </Text>
                <Text style={styles.playerMeta}>
                  {player.roundScore >= 0 ? "+" : ""}
                  {player.roundScore} this round
                </Text>
              </View>
              <Text style={styles.score}>{player.score}</Text>
            </View>
          ))}
        </View>

        {complete ? (
          <Pressable onPress={onLobby} style={styles.primaryButton}>
            <Text style={styles.primaryText}>RETURN TO LOBBY</Text>
          </Pressable>
        ) : (
          <Pressable onPress={onNextRound} style={styles.primaryButton}>
            <Text style={styles.primaryText}>NEXT ROUND</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

export default function NapoleonResultPanel(props) {
  return (
    <GamePanelMotion motionKey="result:NapoleonResultPanel">
      <NapoleonResultPanelContent {...props} />
    </GamePanelMotion>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: 18,
    justifyContent: "center",
  },
  panel: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: 18,
  },
  kicker: {
    color: colors.cyan,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.4,
  },
  title: { color: colors.text, fontSize: 27, fontWeight: "900", marginTop: 8 },
  summary: { marginTop: 16, gap: 9 },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
    backgroundColor: colors.surface2,
    borderRadius: 12,
  },
  label: { color: colors.muted, fontSize: 11, fontWeight: "900" },
  value: { color: colors.gold, fontSize: 15, fontWeight: "900" },
  scores: { marginTop: 16, borderTopWidth: 1, borderTopColor: colors.border },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  playerName: { color: colors.text, fontWeight: "900", fontSize: 14 },
  playerMeta: { color: colors.muted, fontSize: 10, marginTop: 3 },
  score: { color: colors.gold, fontSize: 18, fontWeight: "900" },
  primaryButton: {
    marginTop: 18,
    minHeight: 54,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: { color: colors.white, fontSize: 15, fontWeight: "900" },
});
