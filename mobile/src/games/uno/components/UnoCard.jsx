import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../../theme";
import { GameCardMotion, cardMotionKey } from "../../../components/GameMotion";

const palette = {
  red: "#F43F5E",
  yellow: "#F7C948",
  green: "#22C55E",
  blue: "#3B82F6",
  wild: "#26334F",
};

function labelFor(card) {
  if (!card) return "";
  if (card.type === "number") return String(card.value);
  if (card.type === "skip") return "⊘";
  if (card.type === "reverse") return "↻";
  if (card.type === "draw-two") return "+2";
  if (card.type === "wild") return "W";
  if (card.type === "wild-draw-four") return "+4";
  return "?";
}

function nameFor(card) {
  if (!card) return "UNO card";
  if (card.type === "number") return `${card.color} ${card.value}`;
  const names = {
    skip: "Skip",
    reverse: "Reverse",
    "draw-two": "Draw Two",
    wild: "Wild",
    "wild-draw-four": "Wild Draw Four",
  };
  return names[card.type] || "UNO card";
}

function UnoCardContent({
  card,
  playable = false,
  selected = false,
  disabled = false,
  small = false,
  faceDown = false,
  onPress,
}) {
  if (faceDown) {
    return (
      <View style={[styles.card, small && styles.small, styles.back]}>
        <View style={styles.backInner}>
          <Text style={styles.backLogo}>UNO</Text>
        </View>
      </View>
    );
  }

  const color = palette[card?.color] || palette.wild;
  const label = labelFor(card);
  const wild = !card?.color;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={nameFor(card)}
      disabled={disabled || !onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        small && styles.small,
        { borderColor: selected ? colors.cyan : "#E7ECFA" },
        playable && styles.playable,
        selected && styles.selected,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.face, { backgroundColor: color }]}>
        {wild ? (
          <View style={styles.wildBadge}>
            <View style={[styles.wildDot, { backgroundColor: palette.red }]} />
            <View
              style={[styles.wildDot, { backgroundColor: palette.yellow }]}
            />
            <View
              style={[styles.wildDot, { backgroundColor: palette.green }]}
            />
            <View style={[styles.wildDot, { backgroundColor: palette.blue }]} />
          </View>
        ) : null}
        <Text style={[styles.corner, small && styles.smallCorner]}>
          {label}
        </Text>
        <Text style={[styles.main, small && styles.smallMain]}>{label}</Text>
        <Text
          style={[
            styles.corner,
            styles.bottomCorner,
            small && styles.smallCorner,
          ]}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

export default function UnoCard(props) {
  return (
    <GameCardMotion
      motionKey={cardMotionKey(props)}
      emphasize={Boolean(props.latest || props.highlighted || props.emphasize)}
    >
      <UnoCardContent {...props} />
    </GameCardMotion>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 84,
    height: 122,
    borderRadius: 15,
    padding: 3,
    backgroundColor: "#F4F7FF",
    borderWidth: 2,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  small: {
    width: 54,
    height: 78,
    borderRadius: 11,
  },
  face: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  main: {
    color: colors.white,
    fontSize: 48,
    fontWeight: "900",
    lineHeight: 52,
    textShadowColor: "rgba(0,0,0,0.28)",
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 3,
  },
  smallMain: {
    fontSize: 28,
    lineHeight: 30,
  },
  corner: {
    position: "absolute",
    top: 5,
    left: 7,
    color: colors.white,
    fontSize: 16,
    fontWeight: "900",
  },
  smallCorner: {
    top: 3,
    left: 5,
    fontSize: 10,
  },
  bottomCorner: {
    top: undefined,
    left: undefined,
    bottom: 5,
    right: 7,
    transform: [{ rotate: "180deg" }],
  },
  playable: {
    borderColor: colors.gold,
    shadowColor: colors.gold,
    shadowOpacity: 0.55,
    shadowRadius: 10,
    elevation: 8,
  },
  selected: {
    transform: [{ translateY: -9 }, { scale: 1.03 }],
    borderColor: colors.cyan,
    shadowColor: colors.cyan,
    shadowOpacity: 0.5,
    shadowRadius: 11,
    elevation: 10,
  },
  disabled: {
    opacity: 0.48,
  },
  pressed: {
    opacity: 0.9,
  },
  back: {
    backgroundColor: "#111B39",
    borderColor: "#354466",
  },
  backInner: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#6A78A0",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#182348",
  },
  backLogo: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900",
    transform: [{ rotate: "-12deg" }],
  },
  wildBadge: {
    position: "absolute",
    top: 9,
    right: 8,
    width: 19,
    height: 19,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 2,
  },
  wildDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
