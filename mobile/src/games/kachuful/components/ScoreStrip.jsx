import { ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, radii } from "../../../theme";

export default function ScoreStrip({ players, userId, bidsRevealed }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>SCOREBOARD</Text>
          <Text style={styles.title}>Live standings</Text>
        </View>
        <Text style={styles.helper}>
          {bidsRevealed ? "Bids shown" : "Bids hidden"}
        </Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
      >
        {(players || []).map((player) => {
          const you = player.id === userId;
          return (
            <View key={player.id} style={[styles.item, you && styles.itemYou]}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {String(player.username || "?")
                    .slice(0, 1)
                    .toUpperCase()}
                </Text>
              </View>
              <Text numberOfLines={1} style={styles.name}>
                {player.username}
                {you ? " · YOU" : ""}
              </Text>
              <Text style={styles.score}>{player.score ?? 0}</Text>
              <Text style={styles.sub}>
                {player.tricksWon ?? 0} won · {player.bid ?? "—"} bid
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 13,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  kicker: {
    color: colors.cyan,
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  title: { color: colors.text, fontSize: 13, fontWeight: "900", marginTop: 3 },
  helper: { color: colors.muted, fontSize: 9.5 },
  list: { gap: 8, paddingTop: 10 },
  item: {
    width: 122,
    backgroundColor: colors.surface2,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 9,
  },
  itemYou: { borderColor: colors.cyan },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(53,216,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.cyan, fontSize: 10, fontWeight: "900" },
  name: { color: colors.text, fontSize: 10, fontWeight: "900", marginTop: 7 },
  score: { color: colors.gold, fontSize: 20, fontWeight: "900", marginTop: 1 },
  sub: { color: colors.muted, fontSize: 8.5, marginTop: 1 },
});
