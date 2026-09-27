import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radii } from "../../../theme";
import { GamePanelMotion } from "../../../components/GameMotion";

function UnoResultPanelContent({
  gameState,
  canNextRound,
  onNextRound,
  onLobby,
}) {
  const result = gameState?.result;
  if (!result) return null;

  const complete = gameState.status === "game-complete";

  return (
    <View style={styles.overlay}>
      <View style={styles.panel}>
        <Text style={styles.kicker}>
          {complete ? "GAME COMPLETE" : "ROUND COMPLETE"}
        </Text>
        <Text style={styles.title}>{complete ? "WINNER" : "ROUND WINNER"}</Text>
        <Text style={styles.winner}>{result.winnerUsername}</Text>
        <Text style={styles.score}>+{result.roundScore} points</Text>

        <View style={styles.scoreboard}>
          {result.scores?.map((player) => (
            <View key={player.id} style={styles.scoreRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.playerName}>{player.username}</Text>
                <Text style={styles.playerSub}>
                  {player.remainingCards} cards remaining
                </Text>
              </View>
              <Text style={styles.totalScore}>{player.totalScore}</Text>
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          {!complete && canNextRound ? (
            <Pressable
              onPress={onNextRound}
              style={[styles.button, styles.primary]}
            >
              <Text style={styles.primaryText}>NEXT ROUND</Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={onLobby}
            style={[styles.button, styles.secondary]}
          >
            <Text style={styles.secondaryText}>RETURN TO LOBBY</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default function UnoResultPanel(props) {
  return (
    <GamePanelMotion motionKey="result:UnoResultPanel">
      <UnoResultPanelContent {...props} />
    </GamePanelMotion>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
    backgroundColor: "rgba(2,5,14,0.86)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  panel: {
    width: "100%",
    maxWidth: 480,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 22,
  },
  kicker: {
    color: colors.cyan,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  title: {
    color: colors.text,
    fontSize: 29,
    fontWeight: "900",
    marginTop: 6,
  },
  winner: {
    color: colors.gold,
    fontSize: 22,
    fontWeight: "900",
    marginTop: 8,
  },
  score: {
    color: colors.muted,
    fontSize: 14,
    marginTop: 4,
  },
  scoreboard: {
    marginTop: 18,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    overflow: "hidden",
  },
  scoreRow: {
    minHeight: 58,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  playerName: {
    color: colors.text,
    fontWeight: "900",
  },
  playerSub: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 3,
  },
  totalScore: {
    color: colors.gold,
    fontSize: 20,
    fontWeight: "900",
  },
  actions: {
    marginTop: 18,
    gap: 10,
  },
  button: {
    minHeight: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  primary: {
    backgroundColor: colors.primary,
  },
  primaryText: {
    color: colors.white,
    fontWeight: "900",
  },
  secondary: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryText: {
    color: colors.text,
    fontWeight: "900",
  },
});
