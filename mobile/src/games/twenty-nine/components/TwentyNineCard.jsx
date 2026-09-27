import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radii } from "../../../theme";
import { GameCardMotion, cardMotionKey } from "../../../components/GameMotion";

const SUIT_SYMBOL = { S: "♠", H: "♥", D: "♦", C: "♣" };
const RED_SUITS = new Set(["H", "D"]);

function TwentyNineCardContent({
  card,
  playable = false,
  selected = false,
  disabled = false,
  compact = false,
  onPress,
}) {
  const red = RED_SUITS.has(card?.suit);
  const symbol = SUIT_SYMBOL[card?.suit] || card?.suit || "";

  return (
    <Pressable
      onPress={() => onPress?.(card)}
      disabled={disabled}
      style={({ pressed }) => [
        styles.card,
        compact && styles.compact,
        playable && styles.playable,
        selected && styles.selected,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <View style={styles.corner}>
        <Text style={[styles.rank, red && styles.red]}>{card?.rank}</Text>
        <Text style={[styles.suit, red && styles.red]}>{symbol}</Text>
      </View>
      <Text style={[styles.centerSuit, red && styles.red]}>{symbol}</Text>
      {playable ? <View style={styles.playDot} /> : null}
    </Pressable>
  );
}

export default function TwentyNineCard(props) {
  return (
    <GameCardMotion
      motionKey={cardMotionKey(props)}
      emphasize={Boolean(props.latest || props.highlighted || props.emphasize)}
    >
      <TwentyNineCardContent {...props} />
    </GameCardMotion>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 68,
    height: 98,
    borderRadius: radii.md,
    backgroundColor: "#F8FAFF",
    borderWidth: 1,
    borderColor: "#D7DCE8",
    padding: 8,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  compact: { width: 58, height: 82, padding: 6, borderRadius: 14 },
  playable: { borderColor: colors.cyan, borderWidth: 2 },
  selected: {
    transform: [{ translateY: -10 }],
    borderColor: colors.gold,
    borderWidth: 2,
    shadowColor: colors.gold,
    shadowOpacity: 0.32,
  },
  disabled: { opacity: 0.42 },
  pressed: { opacity: 0.82 },
  corner: { alignItems: "flex-start" },
  rank: { color: "#172038", fontSize: 17, fontWeight: "900", lineHeight: 18 },
  suit: { color: "#172038", fontSize: 13, fontWeight: "800", marginTop: 1 },
  centerSuit: {
    alignSelf: "center",
    color: "#172038",
    fontSize: 29,
    fontWeight: "700",
  },
  red: { color: "#D92F58" },
  playDot: {
    position: "absolute",
    top: 5,
    right: 5,
    width: 7,
    height: 7,
    borderRadius: 7,
    backgroundColor: colors.cyan,
  },
});
