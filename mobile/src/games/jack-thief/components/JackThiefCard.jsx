import { Pressable, StyleSheet, Text } from "react-native";
import { colors, radii } from "../../../theme";
import { GameCardMotion, cardMotionKey } from "../../../components/GameMotion";

const SUIT_SYMBOLS = {
  S: "♠",
  H: "♥",
  D: "♦",
  C: "♣",
};

function isRed(card) {
  return card?.color === "red" || card?.suit === "H" || card?.suit === "D";
}

function JackThiefCardContent({
  card,
  compact = false,
  onPress,
  disabled = false,
}) {
  const red = isRed(card);
  return (
    <Pressable
      disabled={!onPress || disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        compact && styles.compact,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.rank, red && styles.red]}>{card?.rank || "?"}</Text>
      <Text style={[styles.suit, red && styles.red]}>
        {SUIT_SYMBOLS[card?.suit] || card?.symbol || "?"}
      </Text>
    </Pressable>
  );
}

export function JackThiefCardBack({ onPress, disabled = false, index }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={`Hidden card ${Number(index) + 1}`}
      style={({ pressed }) => [
        styles.card,
        styles.back,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.backMark}>SU</Text>
      <Text style={styles.backSuit}>♠</Text>
    </Pressable>
  );
}

export default function JackThiefCard(props) {
  return (
    <GameCardMotion
      motionKey={cardMotionKey(props)}
      emphasize={Boolean(props.latest || props.highlighted || props.emphasize)}
    >
      <JackThiefCardContent {...props} />
    </GameCardMotion>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 62,
    height: 86,
    borderRadius: radii.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#D7DEED",
    paddingHorizontal: 8,
    paddingTop: 7,
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  compact: {
    width: 52,
    height: 72,
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingTop: 6,
  },
  rank: {
    alignSelf: "flex-start",
    color: "#1A2235",
    fontSize: 16,
    lineHeight: 18,
    fontWeight: "900",
  },
  suit: {
    color: "#1A2235",
    fontSize: 27,
    lineHeight: 31,
    fontWeight: "800",
    marginBottom: 8,
  },
  red: { color: "#D6335B" },
  back: {
    backgroundColor: "#202B4B",
    borderColor: "#4B5E87",
    justifyContent: "center",
    gap: 4,
  },
  backMark: { color: colors.muted, fontSize: 10, fontWeight: "900" },
  backSuit: { color: "#B9C5DE", fontSize: 27 },
  disabled: { opacity: 0.76 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.97 }] },
});
