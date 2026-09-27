import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radii } from "../../../theme";
import { GameCardMotion, cardMotionKey } from "../../../components/GameMotion";

const SUITS = {
  spades: "♠",
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
};

function isRedSuit(suit) {
  return suit === "hearts" || suit === "diamonds";
}

function MangooseCardContent({
  card,
  hidden = false,
  compact = false,
  selected = false,
  disabled = false,
  onPress,
}) {
  if (hidden) {
    return (
      <Pressable
        disabled={!onPress || disabled}
        onPress={onPress}
        style={({ pressed }) => [
          styles.card,
          compact && styles.compact,
          styles.back,
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.backInner}>
          <Text style={styles.backMark}>SU</Text>
          <Text style={styles.backSuit}>♠</Text>
        </View>
      </Pressable>
    );
  }

  const suit = SUITS[card?.suit] || "?";
  const red = isRedSuit(card?.suit);

  return (
    <Pressable
      disabled={!onPress || disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        compact && styles.compact,
        selected && styles.selected,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <View style={styles.corner}>
        <Text style={[styles.rank, red && styles.red]}>
          {card?.rank || "?"}
        </Text>
        <Text style={[styles.suit, red && styles.red]}>{suit}</Text>
      </View>
      <Text style={[styles.centerSuit, red && styles.red]}>{suit}</Text>
    </Pressable>
  );
}

export default function MangooseCard(props) {
  return (
    <GameCardMotion
      motionKey={cardMotionKey(props)}
      emphasize={Boolean(props.latest || props.highlighted || props.emphasize)}
    >
      <MangooseCardContent {...props} />
    </GameCardMotion>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 68,
    height: 94,
    borderRadius: radii.md,
    backgroundColor: "#FCFCFF",
    borderWidth: 1,
    borderColor: "#D8DEF1",
    padding: 7,
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
    justifyContent: "space-between",
  },
  compact: {
    width: 54,
    height: 76,
    borderRadius: 12,
    padding: 6,
  },
  back: {
    backgroundColor: "#18233F",
    borderColor: "#40547E",
    alignItems: "center",
    justifyContent: "center",
  },
  backInner: {
    width: "74%",
    height: "74%",
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#52658E",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#222E4E",
    gap: 2,
  },
  backMark: { color: colors.muted, fontSize: 9, fontWeight: "900" },
  backSuit: { color: "#B5C0D8", fontSize: 24, lineHeight: 28 },
  corner: { alignItems: "flex-start" },
  rank: { color: "#1B2438", fontSize: 17, lineHeight: 18, fontWeight: "900" },
  suit: { color: "#1B2438", fontSize: 14, lineHeight: 15, fontWeight: "900" },
  red: { color: "#D9355B" },
  centerSuit: {
    textAlign: "center",
    color: "#30394D",
    fontSize: 34,
    lineHeight: 38,
    fontWeight: "700",
  },
  selected: {
    borderColor: colors.cyan,
    borderWidth: 2,
    transform: [{ translateY: -5 }],
    shadowColor: colors.cyan,
    shadowOpacity: 0.34,
  },
  disabled: { opacity: 0.86 },
  pressed: { opacity: 0.82 },
});
