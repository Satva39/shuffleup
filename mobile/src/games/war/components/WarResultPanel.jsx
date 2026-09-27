import { StyleSheet, Text, View } from "react-native";
import { colors, radii } from "../../../theme";
import AppButton from "../../../components/AppButton";
import { GamePanelMotion } from "../../../components/GameMotion";

function WarResultPanelContent({ state, localPlayerId, onLobby }) {
  if (state?.status !== "complete") return null;

  const winner =
    state.players?.find((player) => player.id === state.winnerId) || null;
  const ordered = [...(state.players || [])].sort((a, b) => {
    if (a.id === state.winnerId) return -1;
    if (b.id === state.winnerId) return 1;
    return (b.cardCount || 0) - (a.cardCount || 0);
  });

  return (
    <View style={styles.overlay}>
      <View style={styles.panel}>
        <Text style={styles.kicker}>SHUFFLEUP · WAR</Text>
        <Text style={styles.title}>
          {winner?.id === localPlayerId
            ? "YOU WIN"
            : winner
              ? `${winner.username} WINS`
              : "WAR ENDS IN A DRAW"}
        </Text>
        <Text style={styles.subtitle}>
          {state.resultReason === "last-player-standing"
            ? "The last player with cards wins the game."
            : "All remaining cards were exhausted at the same time."}
        </Text>

        <View style={styles.resultBox}>
          <Text style={styles.resultKicker}>FINAL TABLE</Text>
          {ordered.map((player, index) => (
            <View
              key={player.id}
              style={[
                styles.row,
                player.id === state.winnerId && styles.winnerRow,
              ]}
            >
              <Text
                style={[
                  styles.place,
                  player.id === state.winnerId && styles.winnerText,
                ]}
              >
                #{index + 1}
              </Text>
              <Text
                numberOfLines={1}
                style={[
                  styles.name,
                  player.id === state.winnerId && styles.winnerText,
                ]}
              >
                {player.id === localPlayerId ? "YOU" : player.username}
              </Text>
              <Text style={styles.count}>{player.cardCount} cards</Text>
            </View>
          ))}
        </View>

        <AppButton
          title="Return to Lobby"
          onPress={onLobby}
          style={{ marginTop: 18 }}
        />
      </View>
    </View>
  );
}

export default function WarResultPanel(props) {
  return (
    <GamePanelMotion motionKey="result:WarResultPanel">
      <WarResultPanelContent {...props} />
    </GamePanelMotion>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(3,6,15,0.9)",
    padding: 18,
    justifyContent: "center",
    zIndex: 20,
  },
  panel: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.gold,
    padding: 20,
  },
  kicker: {
    color: colors.cyan,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  title: { color: colors.text, fontSize: 30, fontWeight: "900", marginTop: 5 },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: 7 },
  resultBox: {
    marginTop: 18,
    backgroundColor: colors.surface2,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  resultKicker: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 9 },
  winnerRow: { borderBottomWidth: 1, borderBottomColor: colors.border },
  place: { width: 34, color: colors.gold, fontSize: 11, fontWeight: "900" },
  name: { flex: 1, color: colors.text, fontSize: 13, fontWeight: "800" },
  count: { color: colors.muted, fontSize: 10, fontWeight: "800" },
  winnerText: { color: colors.green },
});
