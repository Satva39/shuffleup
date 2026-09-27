import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../../theme";
import { GameCardMotion, cardMotionKey } from "../../../components/GameMotion";

export function WarCardBack({ small = false, featured = false }) {
  const size = featured
    ? { width: 82, height: 116 }
    : small
      ? { width: 48, height: 68 }
      : { width: 64, height: 90 };

  return (
    <View style={[styles.card, styles.back, size]}>
      <View style={styles.backInner}>
        <Text style={[styles.backSuit, featured && styles.featuredSuit]}>
          ♠
        </Text>
        <Text style={styles.backMark}>SU</Text>
      </View>
    </View>
  );
}

function WarCardContent({ card, featured = false, compact = false }) {
  if (!card) return <WarCardBack featured={featured} small={compact} />;

  const isRed = card.color === "red" || card.suit === "H" || card.suit === "D";
  const size = featured
    ? { width: 82, height: 116 }
    : compact
      ? { width: 52, height: 74 }
      : { width: 68, height: 96 };

  return (
    <View style={[styles.card, size]}>
      <View style={styles.corner}>
        <Text style={[styles.rank, isRed && styles.red]}>{card.rank}</Text>
        <Text style={[styles.suit, isRed && styles.red]}>{card.symbol}</Text>
      </View>
      <View style={styles.center}>
        <Text style={[styles.centerSuit, isRed && styles.red]}>
          {card.symbol}
        </Text>
      </View>
    </View>
  );
}

export default function WarCard(props) {
  return (
    <GameCardMotion
      motionKey={cardMotionKey(props)}
      emphasize={Boolean(props.latest || props.highlighted || props.emphasize)}
    >
      <WarCardContent {...props} />
    </GameCardMotion>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#D7DCE7",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
    overflow: "hidden",
  },
  corner: { position: "absolute", left: 7, top: 6, alignItems: "center" },
  rank: { color: "#172033", fontSize: 17, fontWeight: "900", lineHeight: 19 },
  suit: { color: "#172033", fontSize: 13, fontWeight: "900", marginTop: -1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  centerSuit: { color: "#172033", fontSize: 36, fontWeight: "900" },
  red: { color: "#D82F51" },
  back: { backgroundColor: "#141A2D", borderColor: "#455279" },
  backInner: {
    flex: 1,
    margin: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#242D4A",
  },
  backSuit: { color: colors.cyan, fontSize: 22, fontWeight: "900" },
  featuredSuit: { fontSize: 30 },
  backMark: {
    color: colors.muted,
    fontSize: 8,
    fontWeight: "900",
    marginTop: 2,
  },
});
