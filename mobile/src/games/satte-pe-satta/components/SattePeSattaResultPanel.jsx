import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radii } from "../../../theme";
import { GamePanelMotion } from "../../../components/GameMotion";

function SattePeSattaResultPanelContent({ result, complete, onLobby }) {
  if (!result) return null;

  return (
    <View style={styles.overlayWrap}>
      <View style={styles.card}>
        <Text style={styles.kicker}>
          {complete ? "GAME COMPLETE" : "ROUND COMPLETE"}
        </Text>
        <Text style={styles.title}>
          {complete
            ? `${result.gameWinnerUsername || "A player"} wins the game`
            : `${result.roundWinnerUsername || "A player"} wins the round`}
        </Text>
        <Text style={styles.subtitle}>
          {complete
            ? `Target reached: ${result.targetScore} points.`
            : `Next round starts automatically. Target: ${result.targetScore} points.`}
        </Text>

        <View style={styles.list}>
          {(result.ranking || []).map((item) => (
            <View key={item.id} style={styles.row}>
              <View style={styles.rank}>
                <Text style={styles.rankText}>#{item.rank}</Text>
              </View>
              <View style={styles.player}>
                <Text numberOfLines={1} style={styles.playerName}>
                  {item.username}
                </Text>
                <Text style={styles.playerMeta}>
                  {complete
                    ? `${item.totalPoints} points`
                    : `+${item.roundPenaltyPoints} this round · ${item.totalPoints} total`}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {complete ? (
          <Pressable onPress={onLobby} style={styles.button}>
            <Text style={styles.buttonText}>RETURN TO LOBBY</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export default function SattePeSattaResultPanel(props) {
  return (
    <GamePanelMotion motionKey="result:SattePeSattaResultPanel">
      <SattePeSattaResultPanelContent {...props} />
    </GamePanelMotion>
  );
}

const styles = StyleSheet.create({
  overlayWrap: {
    position: "absolute",
    left: 14,
    right: 14,
    top: 14,
    bottom: 14,
    justifyContent: "center",
    zIndex: 20,
  },
  card: {
    backgroundColor: "#0C1528",
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 15,
  },
  kicker: {
    color: colors.gold,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.6,
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "900",
    marginTop: 7,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 8,
    lineHeight: 18,
  },
  list: {
    marginTop: 16,
    gap: 7,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
  },
  rank: {
    width: 34,
    alignItems: "center",
  },
  rankText: {
    color: colors.gold,
    fontWeight: "900",
    fontSize: 12,
  },
  player: {
    flex: 1,
  },
  playerName: {
    color: colors.text,
    fontWeight: "900",
    fontSize: 12,
  },
  playerMeta: {
    color: colors.muted,
    fontSize: 10,
    marginTop: 3,
  },
  button: {
    marginTop: 16,
    minHeight: 50,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.7,
  },
});
