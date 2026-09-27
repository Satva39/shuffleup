import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radii } from "../../../theme";
import { cardColor, cardSymbol } from "../utils/cards";
import { GameCardMotion, cardMotionKey } from "../../../components/GameMotion";

function BluffCardContent({
  card,
  selected = false,
  disabled = false,
  onPress,
}) {
  const symbol = cardSymbol(card?.suit);
  const ink = cardColor(card?.suit);

  return (
    <Pressable
      disabled={disabled}
      onPress={() => onPress?.(card.id)}
      style={({ pressed }) => [
        styles.card,
        selected && styles.selected,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.corner}>
        <Text style={[styles.rank, { color: ink }]}>{card?.rank}</Text>
        <Text style={[styles.suit, { color: ink }]}>{symbol}</Text>
      </View>
      <Text style={[styles.centerSuit, { color: ink }]}>{symbol}</Text>
    </Pressable>
  );
}

export function BluffCardBack({ small = false }) {
  return (
    <View style={[styles.back, small && styles.backSmall]}>
      <View style={styles.backInner}>
        <Text style={[styles.backMark, small && styles.backMarkSmall]}>SU</Text>
      </View>
    </View>
  );
}

export default function BluffCard(props) {
  return (
    <GameCardMotion
      motionKey={cardMotionKey(props)}
      emphasize={Boolean(props.latest || props.highlighted || props.emphasize)}
    >
      <BluffCardContent {...props} />
    </GameCardMotion>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 76,
    height: 108,
    borderRadius: radii.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#DCE2EC",
    padding: 8,
    justifyContent: "space-between",
    marginRight: 8,
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  selected: {
    transform: [{ translateY: -10 }],
    borderColor: colors.cyan,
    borderWidth: 2,
    shadowColor: colors.cyan,
    shadowOpacity: 0.42,
    shadowRadius: 12,
  },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.8 },
  corner: { alignItems: "flex-start" },
  rank: { fontSize: 22, fontWeight: "900", letterSpacing: -0.6 },
  suit: { fontSize: 17, marginTop: -2 },
  centerSuit: { alignSelf: "center", fontSize: 36, opacity: 0.95 },
  back: {
    width: 58,
    height: 78,
    borderRadius: 12,
    backgroundColor: "#17223D",
    borderWidth: 1.5,
    borderColor: "#4A5F8B",
    padding: 5,
    marginRight: -40,
  },
  backSmall: { width: 42, height: 58, borderRadius: 10, marginRight: -28 },
  backInner: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2F4167",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#101A30",
  },
  backMark: { color: colors.cyan, fontWeight: "900", fontSize: 16 },
  backMarkSmall: { fontSize: 11 },
});
