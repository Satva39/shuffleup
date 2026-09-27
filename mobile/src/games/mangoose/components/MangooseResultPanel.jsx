import { SafeAreaView, StyleSheet, Text, View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radii } from "../../../theme";
import { GamePanelMotion } from "../../../components/GameMotion";

function MangooseResultPanelContent({ result, players, onLobby }) {
  if (!result) return null;

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.panel}>
        <View style={styles.icon}>
          <Ionicons name="trophy" size={28} color={colors.gold} />
        </View>
        <Text style={styles.kicker}>GAME COMPLETE</Text>
        <Text style={styles.title}>{result.winnerUsername || "Winner"}</Text>
        <Text style={styles.subtitle}>WINNER</Text>

        <View style={styles.mongooseBox}>
          <Text style={styles.mongooseLabel}>MONGOOSE</Text>
          <Text style={styles.mongooseName}>
            {result.mongooseUsername || "—"}
          </Text>
        </View>

        <View style={styles.list}>
          {(result.finalStandings || []).map((standing, index) => {
            const player = players.find((item) => item.id === standing.id);
            return (
              <View
                key={standing.id}
                style={[styles.row, index === 0 && styles.winnerRow]}
              >
                <Text style={styles.rank}>{index + 1}</Text>
                <Text numberOfLines={1} style={styles.name}>
                  {player?.username || standing.username || "Player"}
                </Text>
                <Text style={styles.cards}>{standing.cardsRemaining ?? 0}</Text>
              </View>
            );
          })}
        </View>

        <Pressable
          onPress={onLobby}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
          <Text style={styles.buttonText}>RETURN TO LOBBY</Text>
          <Ionicons name="arrow-back" size={17} color="#08101E" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

export default function MangooseResultPanel(props) {
  return (
    <GamePanelMotion motionKey="result:MangooseResultPanel">
      <MangooseResultPanelContent {...props} />
    </GamePanelMotion>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: 16,
    justifyContent: "center",
  },
  panel: {
    backgroundColor: colors.surface,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  icon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(247,198,93,0.10)",
    borderWidth: 1,
    borderColor: "rgba(247,198,93,0.25)",
  },
  kicker: {
    color: colors.gold,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.3,
    textAlign: "center",
    marginTop: 12,
  },
  title: {
    color: colors.text,
    fontSize: 27,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 4,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.1,
    textAlign: "center",
    marginTop: 3,
  },
  mongooseBox: {
    marginTop: 13,
    borderRadius: 14,
    padding: 11,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  mongooseLabel: {
    color: colors.cyan,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },
  mongooseName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900",
    marginTop: 3,
  },
  list: { marginTop: 12, gap: 7 },
  row: {
    minHeight: 48,
    borderRadius: 13,
    paddingHorizontal: 10,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  winnerRow: {
    borderColor: colors.gold,
    backgroundColor: "rgba(247,198,93,0.08)",
  },
  rank: {
    color: colors.muted,
    width: 18,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "900",
  },
  name: {
    color: colors.text,
    flex: 1,
    minWidth: 0,
    fontSize: 11,
    fontWeight: "900",
  },
  cards: {
    color: colors.gold,
    minWidth: 28,
    textAlign: "right",
    fontSize: 15,
    fontWeight: "900",
  },
  button: {
    marginTop: 13,
    minHeight: 52,
    borderRadius: 15,
    backgroundColor: colors.gold,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  buttonText: {
    color: "#08101E",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  pressed: { opacity: 0.84 },
});
