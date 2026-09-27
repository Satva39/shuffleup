import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../../theme";
import { GameCardMotion, cardMotionKey } from "../../../components/GameMotion";

const symbols = { S: "♠", H: "♥", D: "♦", C: "♣" };
const red = new Set(["H", "D"]);

function BridgeCardContent({
  card,
  compact = false,
  table = false,
  playable = false,
  disabled = false,
  selected = false,
  onPress,
}) {
  const color = red.has(card?.suit) ? "#D52F55" : "#202536";
  return (
    <Pressable
      disabled={!onPress || disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.wrap,
        compact && styles.compactWrap,
        table && styles.tableWrap,
        selected && styles.selected,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <View
        style={[
          styles.card,
          compact && styles.compactCard,
          table && styles.tableCard,
        ]}
      >
        <Text style={[styles.rank, compact && styles.compactRank, { color }]}>
          {card?.rank || "?"}
        </Text>
        <Text style={[styles.suit, compact && styles.compactSuit, { color }]}>
          {symbols[card?.suit] || "?"}
        </Text>
        <View style={styles.center}>
          <Text
            style={[
              styles.centerSuit,
              compact && styles.compactCenterSuit,
              { color },
            ]}
          >
            {symbols[card?.suit] || "?"}
          </Text>
        </View>
        {playable && !disabled ? <View style={styles.dot} /> : null}
      </View>
    </Pressable>
  );
}

export default function BridgeCard(props) {
  return (
    <GameCardMotion
      motionKey={cardMotionKey(props)}
      emphasize={Boolean(props.latest || props.highlighted || props.emphasize)}
    >
      <BridgeCardContent {...props} />
    </GameCardMotion>
  );
}

const styles = StyleSheet.create({
  wrap: { width: 64, height: 90, marginHorizontal: 3, marginVertical: 3 },
  compactWrap: { width: 49, height: 69, marginHorizontal: 2 },
  tableWrap: { width: 50, height: 70, marginHorizontal: 2 },
  selected: { transform: [{ translateY: -7 }] },
  disabled: { opacity: 0.38 },
  pressed: { opacity: 0.82 },
  card: {
    flex: 1,
    backgroundColor: "#FCFCFF",
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#D4D9E8",
    padding: 6,
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  compactCard: { borderRadius: 9, padding: 5 },
  tableCard: { borderRadius: 9, padding: 5 },
  rank: { fontSize: 17, fontWeight: "900", lineHeight: 18 },
  compactRank: { fontSize: 13, lineHeight: 13 },
  suit: { fontSize: 13, fontWeight: "900", lineHeight: 13 },
  compactSuit: { fontSize: 10 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  centerSuit: { fontSize: 34, fontWeight: "700" },
  compactCenterSuit: { fontSize: 24 },
  dot: {
    position: "absolute",
    right: 4,
    top: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.cyan,
  },
});
