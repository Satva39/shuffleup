import { StyleSheet, Text, View } from "react-native";
import { colors, radii } from "../../../theme";
import { GameCardMotion, cardMotionKey } from "../../../components/GameMotion";

const SUITS = {
  spades: "♠",
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
};

function TeenPattiCardContent({ card, hidden = false, compact = false }) {
  const size = compact ? { width: 38, height: 54 } : { width: 82, height: 114 };

  if (hidden || !card) {
    return (
      <View style={[styles.card, styles.back, size]}>
        <View style={styles.backInner}>
          <Text style={styles.backSuit}>♠</Text>
          <Text style={styles.backMark}>SU</Text>
        </View>
      </View>
    );
  }

  const red = card.suit === "hearts" || card.suit === "diamonds";
  const suit = SUITS[card.suit] || "?";

  return (
    <View style={[styles.card, size]}>
      <View style={styles.corner}>
        <Text style={[styles.rank, red && styles.red]}>{card.rank}</Text>
        <Text style={[styles.suit, red && styles.red]}>{suit}</Text>
      </View>
      <View style={styles.center}>
        <Text style={[styles.centerSuit, red && styles.red]}>{suit}</Text>
      </View>
    </View>
  );
}

export default function TeenPattiCard(props) {
  return (
    <GameCardMotion
      motionKey={cardMotionKey(props)}
      emphasize={Boolean(props.latest || props.highlighted || props.emphasize)}
    >
      <TeenPattiCardContent {...props} />
    </GameCardMotion>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#D7DCE7",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
    overflow: "hidden",
  },
  corner: { position: "absolute", left: 7, top: 6, alignItems: "center" },
  rank: { color: "#172033", fontSize: 17, fontWeight: "900", lineHeight: 19 },
  suit: { color: "#172033", fontSize: 13, fontWeight: "900", marginTop: -1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  centerSuit: { color: "#172033", fontSize: 32, fontWeight: "900" },
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
  backSuit: { color: colors.cyan, fontSize: 17, fontWeight: "900" },
  backMark: {
    color: colors.muted,
    fontSize: 7,
    fontWeight: "900",
    marginTop: 2,
  },
});
