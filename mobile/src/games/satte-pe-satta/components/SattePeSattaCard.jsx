import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radii } from "../../../theme";
import { GameCardMotion, cardMotionKey } from "../../../components/GameMotion";

const SUIT_SYMBOLS = {
  spades: "♠",
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
};

const RED_SUITS = new Set(["hearts", "diamonds"]);

function SattePeSattaCardContent({
  card,
  playable = false,
  selected = false,
  compact = false,
  onPress,
}) {
  if (!card) return null;

  const red = RED_SUITS.has(card.suit);
  const disabled = !playable || !onPress;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${card.rank} ${card.suit}`}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        compact ? styles.compact : styles.handCard,
        red ? styles.red : styles.black,
        playable && styles.playable,
        selected && styles.selected,
        pressed && playable && styles.pressed,
        disabled && !playable && styles.disabled,
      ]}
    >
      <Text style={[styles.rank, compact && styles.compactRank]}>
        {card.rank}
      </Text>
      <Text style={[styles.suit, compact && styles.compactSuit]}>
        {SUIT_SYMBOLS[card.suit] || "•"}
      </Text>
      {selected ? <View style={styles.selectedDot} /> : null}
    </Pressable>
  );
}

export default function SattePeSattaCard(props) {
  return (
    <GameCardMotion
      motionKey={cardMotionKey(props)}
      emphasize={Boolean(props.latest || props.highlighted || props.emphasize)}
    >
      <SattePeSattaCardContent {...props} />
    </GameCardMotion>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FAFAF7",
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#C8CEC9",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  handCard: {
    width: 56,
    height: 78,
  },
  compact: {
    width: 33,
    height: 48,
    borderRadius: 7,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  rank: {
    position: "absolute",
    top: 5,
    left: 7,
    fontSize: 17,
    lineHeight: 18,
    fontWeight: "900",
  },
  compactRank: {
    top: 2,
    left: 4,
    fontSize: 10,
    lineHeight: 11,
  },
  suit: {
    marginTop: 8,
    fontSize: 27,
    lineHeight: 30,
    fontWeight: "900",
  },
  compactSuit: {
    marginTop: 6,
    fontSize: 16,
    lineHeight: 18,
  },
  red: {
    color: "#BD2F46",
  },
  black: {
    color: "#161A22",
  },
  playable: {
    borderColor: colors.gold,
    borderWidth: 2,
    shadowColor: colors.gold,
    shadowOpacity: 0.45,
    shadowRadius: 7,
  },
  selected: {
    transform: [{ translateY: -4 }],
    borderColor: colors.cyan,
    shadowColor: colors.cyan,
    shadowOpacity: 0.48,
  },
  pressed: {
    transform: [{ translateY: -2 }, { scale: 0.98 }],
  },
  disabled: {
    opacity: 0.78,
  },
  selectedDot: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.cyan,
    right: 5,
    bottom: 5,
  },
});
