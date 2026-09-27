import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../../theme";
import { GameCardMotion, cardMotionKey } from "../../../components/GameMotion";

const SUIT_SYMBOLS = { S: "♠", H: "♥", D: "♦", C: "♣" };
const RED_SUITS = new Set(["H", "D"]);

function SpadesCardContent({
  card,
  small = false,
  playable = false,
  disabled = false,
  onPress,
}) {
  const suit = card?.suit || "";
  const ink = RED_SUITS.has(suit) ? "#D52F55" : "#202536";

  return (
    <Pressable
      disabled={!onPress || disabled}
      onPress={() => onPress?.(card)}
      style={({ pressed }) => [
        styles.wrap,
        small && styles.smallWrap,
        playable && styles.playable,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.card, small && styles.smallCard]}>
        <Text style={[styles.rank, small && styles.smallRank, { color: ink }]}>
          {card?.rank || "?"}
        </Text>
        <Text
          style={[
            styles.cornerSuit,
            small && styles.smallCornerSuit,
            { color: ink },
          ]}
        >
          {SUIT_SYMBOLS[suit] || "?"}
        </Text>
        <View style={styles.center}>
          <Text
            style={[
              styles.centerSuit,
              small && styles.smallCenterSuit,
              { color: ink },
            ]}
          >
            {SUIT_SYMBOLS[suit] || "?"}
          </Text>
        </View>
        {playable && !disabled ? <View style={styles.playDot} /> : null}
      </View>
    </Pressable>
  );
}

export default function SpadesCard(props) {
  return (
    <GameCardMotion
      motionKey={cardMotionKey(props)}
      emphasize={Boolean(props.latest || props.highlighted || props.emphasize)}
    >
      <SpadesCardContent {...props} />
    </GameCardMotion>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 58,
    height: 82,
    marginHorizontal: 2,
    marginVertical: 3,
    borderRadius: 12,
  },
  smallWrap: {
    width: 48,
    height: 68,
  },
  playable: {
    borderWidth: 2,
    borderColor: colors.cyan,
    shadowColor: colors.cyan,
    shadowOpacity: 0.38,
    shadowRadius: 7,
    elevation: 4,
  },
  disabled: {
    opacity: 0.42,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ translateY: 2 }],
  },
  card: {
    flex: 1,
    backgroundColor: "#FCFCFF",
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#D4D9E8",
    padding: 5,
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  smallCard: {
    borderRadius: 9,
    padding: 4,
  },
  rank: {
    fontSize: 16,
    lineHeight: 17,
    fontWeight: "900",
  },
  smallRank: {
    fontSize: 13,
    lineHeight: 14,
  },
  cornerSuit: {
    fontSize: 12,
    lineHeight: 12,
    fontWeight: "900",
  },
  smallCornerSuit: {
    fontSize: 10,
    lineHeight: 10,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  centerSuit: {
    fontSize: 31,
    fontWeight: "700",
  },
  smallCenterSuit: {
    fontSize: 23,
  },
  playDot: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.cyan,
  },
});
