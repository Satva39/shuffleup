import { StyleSheet, Text, View } from "react-native";
import { colors, radii } from "../../../theme";
import MindiCoatCard from "./MindiCoatCard";
import { seatLabel } from "../utils/cards";

export default function MindiCoatTrickArea({ trick = [], lastTrickWinner }) {
  return (
    <View style={styles.panel}>
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>CURRENT TRICK</Text>
          <Text style={styles.title}>
            {trick.length ? "Cards in play" : "Waiting for the lead"}
          </Text>
        </View>
        <Text style={styles.count}>{trick.length}/4</Text>
      </View>

      <View style={styles.trickArea}>
        {trick.length ? (
          trick.map((play, index) => (
            <View key={`${play.playerId}-${play.card?.id}`} style={styles.play}>
              <MindiCoatCard
                card={play.card}
                compact
                latest={index === trick.length - 1}
              />
              <Text numberOfLines={1} style={styles.seat}>
                {seatLabel(play.seat)}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.empty}>Cards played this trick appear here.</Text>
        )}
      </View>

      {lastTrickWinner ? (
        <View style={styles.lastWinner}>
          <Text style={styles.lastWinnerLabel}>LAST TRICK</Text>
          <Text style={styles.lastWinnerValue}>
            {seatLabel(lastTrickWinner)} won
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: "rgba(3,26,20,0.74)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(53,216,255,0.18)",
    padding: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
  },
  kicker: {
    color: colors.cyan,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  title: { color: colors.text, fontSize: 14, fontWeight: "900", marginTop: 3 },
  count: { color: colors.gold, fontSize: 12, fontWeight: "900" },
  trickArea: {
    minHeight: 146,
    marginTop: 9,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(53,216,255,0.10)",
    backgroundColor: "rgba(4,17,15,0.58)",
    padding: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  play: { width: 58, alignItems: "center" },
  seat: { color: colors.muted, fontSize: 8.5, fontWeight: "800", marginTop: 2 },
  empty: {
    color: colors.muted,
    fontSize: 10.5,
    textAlign: "center",
    lineHeight: 16,
    maxWidth: 220,
  },
  lastWinner: {
    marginTop: 8,
    borderRadius: radii.sm,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 7,
    paddingHorizontal: 9,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lastWinnerLabel: {
    color: colors.muted,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
  },
  lastWinnerValue: { color: colors.text, fontSize: 9, fontWeight: "900" },
});
