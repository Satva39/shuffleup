import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, radii } from "../../../theme";
import AppButton from "../../../components/AppButton";
import JackThiefCard from "./JackThiefCard";
import { GamePanelMotion } from "../../../components/GameMotion";

function JackThiefResultPanelContent({ gameState, onLobby }) {
  const players = gameState?.players || [];
  const loser = players.find((player) => player.id === gameState?.loserId);
  const finished = players
    .filter((player) => player.eliminationPlace)
    .sort((a, b) => a.eliminationPlace - b.eliminationPlace);

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={["#091228", "#06101A", "#070B17"]}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.panel}>
        <Text style={styles.kicker}>THE LAST JACK</Text>
        <Text style={styles.title}>JACK THIEF</Text>
        <Text style={styles.subtitle}>
          {loser
            ? `${loser.username} holds the final Jack.`
            : "The final Jack has been found."}
        </Text>

        {gameState?.finalJack ? (
          <View style={styles.finalCardWrap}>
            <JackThiefCard card={gameState.finalJack} />
          </View>
        ) : null}

        <View style={styles.resultBox}>
          <Text style={styles.resultKicker}>ELIMINATION ORDER</Text>
          {finished.length ? (
            finished.map((player) => (
              <View key={player.id} style={styles.resultRow}>
                <Text style={styles.place}>#{player.eliminationPlace}</Text>
                <Text numberOfLines={1} style={styles.playerName}>
                  {player.username}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No completed placements.</Text>
          )}
          {loser ? (
            <View style={[styles.resultRow, styles.loserRow]}>
              <Text style={[styles.place, styles.loserText]}>—</Text>
              <Text style={[styles.playerName, styles.loserText]}>
                LOSER · {loser.username}
              </Text>
            </View>
          ) : null}
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

export default function JackThiefResultPanel(props) {
  return (
    <GamePanelMotion motionKey="result:JackThiefResultPanel">
      <JackThiefResultPanelContent {...props} />
    </GamePanelMotion>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: "center",
    padding: 18,
  },
  panel: {
    backgroundColor: "rgba(13,20,38,0.97)",
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
  },
  kicker: {
    color: colors.cyan,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  title: { color: colors.text, fontSize: 32, fontWeight: "900", marginTop: 6 },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 8 },
  finalCardWrap: { alignItems: "center", marginTop: 18 },
  resultBox: {
    marginTop: 20,
    backgroundColor: colors.surface2,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  resultKicker: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  resultRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8 },
  place: { width: 34, color: colors.gold, fontWeight: "900", fontSize: 12 },
  playerName: { flex: 1, color: colors.text, fontWeight: "800", fontSize: 13 },
  loserRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 4,
    paddingTop: 10,
  },
  loserText: { color: colors.red },
  emptyText: { color: colors.muted, fontSize: 12 },
});
