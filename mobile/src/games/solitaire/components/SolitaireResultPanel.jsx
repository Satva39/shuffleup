import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radii } from "../../../theme";
import { GamePanelMotion } from "../../../components/GameMotion";

function SolitaireResultPanelContent({ rankings = [], onLobby }) {
  return (
    <View style={styles.overlay}>
      <View style={styles.panel}>
        <Text style={styles.eyebrow}>SOLITAIRE COMPLETE</Text>
        <Text style={styles.title}>Race finished</Text>
        <Text style={styles.subtitle}>
          Every player has completed their board.
        </Text>
        <View style={styles.list}>
          {rankings.map((player) => (
            <View
              key={player.id}
              style={[styles.row, player.rank === 1 && styles.winnerRow]}
            >
              <Text style={styles.rank}>#{player.rank}</Text>
              <View style={styles.playerName}>
                <Text numberOfLines={1} style={styles.name}>
                  {player.username}
                </Text>
                <Text style={styles.detail}>
                  {player.progress}/52 · {player.moves} moves
                </Text>
              </View>
              <Text style={styles.score}>{player.score}</Text>
            </View>
          ))}
        </View>
        <Pressable
          onPress={onLobby}
          style={({ pressed }) => [styles.button, pressed && { opacity: 0.84 }]}
        >
          <Text style={styles.buttonText}>RETURN TO LOBBY</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function SolitaireResultPanel(props) {
  return (
    <GamePanelMotion motionKey="result:SolitaireResultPanel">
      <SolitaireResultPanelContent {...props} />
    </GamePanelMotion>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(4,8,18,0.78)",
    padding: 18,
    justifyContent: "center",
  },
  panel: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: 20,
  },
  eyebrow: {
    color: colors.cyan,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  title: { color: colors.text, fontSize: 27, fontWeight: "900", marginTop: 6 },
  subtitle: { color: colors.muted, marginTop: 6, lineHeight: 19 },
  list: { marginTop: 16, gap: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 11,
    borderRadius: 14,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  winnerRow: { borderColor: colors.gold },
  rank: { width: 30, color: colors.gold, fontWeight: "900", fontSize: 12 },
  playerName: { flex: 1, minWidth: 0 },
  name: { color: colors.text, fontWeight: "900" },
  detail: { color: colors.muted, fontSize: 10, marginTop: 2 },
  score: { color: colors.text, fontWeight: "900" },
  button: {
    marginTop: 18,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: colors.white,
    fontWeight: "900",
    fontSize: 12,
    letterSpacing: 0.5,
  },
});
