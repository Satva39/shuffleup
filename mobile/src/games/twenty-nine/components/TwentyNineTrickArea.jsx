import { StyleSheet, Text, View } from "react-native";
import { colors, radii } from "../../../theme";
import TwentyNineCard from "./TwentyNineCard";

export default function TwentyNineTrickArea({
  trick = [],
  players = [],
  lastWinner,
}) {
  const labels = Object.fromEntries(
    players.map((player) => [player.id, player.username]),
  );
  return (
    <View style={styles.wrap}>
      <View style={styles.headingRow}>
        <Text style={styles.kicker}>CURRENT TRICK</Text>
        <Text style={styles.count}>{trick.length}/4</Text>
      </View>
      {trick.length === 0 ? (
        <Text style={styles.empty}>Cards played this trick appear here.</Text>
      ) : (
        <View style={styles.cardsRow}>
          {trick.map((play, index) => (
            <View
              key={`${play.playerId}-${play.card.id}`}
              style={styles.played}
            >
              <TwentyNineCard
                card={play.card}
                compact
                disabled
                latest={index === trick.length - 1}
              />
              <Text numberOfLines={1} style={styles.playerName}>
                {labels[play.playerId] || play.seat}
              </Text>
            </View>
          ))}
        </View>
      )}
      {lastWinner ? (
        <Text style={styles.last}>Last trick winner: {lastWinner}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    minHeight: 170,
    padding: 12,
    borderRadius: radii.lg,
    backgroundColor: "rgba(3, 25, 19, 0.72)",
    borderWidth: 1,
    borderColor: "rgba(53, 216, 255, 0.18)",
    justifyContent: "space-between",
  },
  headingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  kicker: {
    color: colors.cyan,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.4,
  },
  count: { color: colors.gold, fontSize: 12, fontWeight: "900" },
  empty: {
    color: colors.muted,
    textAlign: "center",
    marginTop: 24,
    fontSize: 12,
    fontWeight: "600",
  },
  cardsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
  },
  played: { alignItems: "center", width: 68 },
  playerName: {
    color: colors.muted,
    fontSize: 8,
    fontWeight: "800",
    marginTop: 3,
    maxWidth: 64,
  },
  last: {
    color: colors.gold,
    textAlign: "center",
    marginTop: 8,
    fontSize: 9,
    fontWeight: "900",
  },
});
