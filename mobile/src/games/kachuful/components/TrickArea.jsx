import { StyleSheet, Text, View } from "react-native";
import KachufulCard from "./KachufulCard";
import { colors, radii } from "../../../theme";

export default function TrickArea({ trick, players, lastCompletedTrick }) {
  const safeTrick = Array.isArray(trick) ? trick : [];

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.kicker}>LIVE TRICK</Text>
          <Text style={styles.helper}>
            {safeTrick.length
              ? `${safeTrick.length} card${safeTrick.length === 1 ? "" : "s"} played`
              : "Waiting for first card"}
          </Text>
        </View>
        {lastCompletedTrick ? (
          <View style={styles.lastPill}>
            <Text style={styles.lastPillText}>LAST TRICK</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.trickCards}>
        {safeTrick.length ? (
          safeTrick.map((play, index) => {
            const player = players?.find((item) => item.id === play.playerId);
            return (
              <View
                key={`${play.playerId}-${play.card?.id}`}
                style={styles.playedCard}
              >
                <KachufulCard
                  card={play.card}
                  compact
                  latest={index === safeTrick.length - 1}
                />
                <Text numberOfLines={1} style={styles.playerLabel}>
                  {player?.username || "Player"}
                </Text>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyCenter}>
            <View style={styles.centerIcon}>
              <Text style={styles.centerSuit}>♠♥♣♦</Text>
            </View>
            <Text style={styles.emptyTitle}>Table is ready</Text>
            <Text style={styles.emptySub}>
              Cards played this trick appear here.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    minHeight: 146,
    backgroundColor: "rgba(5,12,24,0.34)",
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: "rgba(154,167,194,0.18)",
    padding: 12,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  kicker: {
    color: colors.gold,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.3,
  },
  helper: { color: colors.muted, fontSize: 10, marginTop: 3 },
  lastPill: {
    backgroundColor: "rgba(124,92,255,0.18)",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  lastPillText: { color: colors.primary, fontSize: 8.5, fontWeight: "900" },
  trickCards: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginTop: 10,
  },
  playedCard: { alignItems: "center", width: 52 },
  playerLabel: {
    color: colors.muted,
    fontSize: 8.5,
    maxWidth: 50,
    marginTop: 2,
  },
  emptyCenter: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    paddingVertical: 14,
  },
  centerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(247,198,93,0.24)",
    backgroundColor: "rgba(247,198,93,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  centerSuit: { color: colors.gold, fontSize: 13, letterSpacing: 2 },
  emptyTitle: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "900",
    marginTop: 8,
  },
  emptySub: {
    color: colors.muted,
    fontSize: 9.5,
    textAlign: "center",
    marginTop: 3,
  },
});
