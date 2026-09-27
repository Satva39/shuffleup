import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useEffect, useRef } from "react";
import { colors, radii } from "../../../theme";
import { suitColor, suitSymbol } from "../utils/cards";
import { GameCardMotion, cardMotionKey } from "../../../components/GameMotion";

function MindiCoatCardContent({
  card,
  playable = false,
  selected = false,
  hidden = false,
  compact = false,
  onPress,
}) {
  const lift = useRef(new Animated.Value(selected ? -10 : 0)).current;

  useEffect(() => {
    Animated.spring(lift, {
      toValue: selected ? -10 : 0,
      useNativeDriver: true,
      speed: 24,
      bounciness: 7,
    }).start();
  }, [lift, selected]);

  if (hidden) {
    return (
      <Animated.View
        style={[
          styles.wrap,
          compact && styles.compactWrap,
          { transform: [{ translateY: lift }] },
        ]}
      >
        <Pressable
          disabled={!onPress}
          onPress={onPress}
          style={styles.hiddenPressable}
        >
          <View style={[styles.hiddenCard, compact && styles.compactCard]}>
            <Text style={styles.hiddenMark}>SU</Text>
          </View>
        </Pressable>
      </Animated.View>
    );
  }

  const symbol = suitSymbol(card?.suit);
  const color = suitColor(card?.suit);

  return (
    <Animated.View
      style={[
        styles.wrap,
        compact && styles.compactWrap,
        { transform: [{ translateY: lift }] },
      ]}
    >
      <Pressable
        disabled={!onPress || !playable}
        onPress={onPress}
        style={({ pressed }) => [
          styles.pressable,
          pressed && styles.pressed,
          onPress && !playable && styles.unplayable,
        ]}
      >
        <View style={[styles.card, compact && styles.compactCard]}>
          <Text style={[styles.rank, compact && styles.compactRank, { color }]}>
            {card?.rank || "?"}
          </Text>
          <Text style={[styles.suit, compact && styles.compactSuit, { color }]}>
            {symbol}
          </Text>
          <View style={styles.centerSuit}>
            <Text
              style={[
                styles.centerSuitText,
                compact && styles.compactCenter,
                { color },
              ]}
            >
              {symbol}
            </Text>
          </View>
        </View>
        {selected ? (
          <View pointerEvents="none" style={styles.selectedGlow} />
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

export default function MindiCoatCard(props) {
  return (
    <GameCardMotion
      motionKey={cardMotionKey(props)}
      emphasize={Boolean(props.latest || props.highlighted || props.emphasize)}
    >
      <MindiCoatCardContent {...props} />
    </GameCardMotion>
  );
}

const styles = StyleSheet.create({
  wrap: { width: 72, height: 104, marginHorizontal: 3, marginBottom: 8 },
  compactWrap: { width: 58, height: 84, marginHorizontal: 2 },
  pressable: { flex: 1, borderRadius: radii.sm },
  hiddenPressable: { flex: 1 },
  pressed: { opacity: 0.84 },
  unplayable: { opacity: 0.45 },
  card: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#D8DEF1",
    padding: 7,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.24,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  compactCard: { borderRadius: 10, padding: 6 },
  hiddenCard: {
    flex: 1,
    borderRadius: 13,
    backgroundColor: "#18233E",
    borderWidth: 1,
    borderColor: "#32456E",
    alignItems: "center",
    justifyContent: "center",
  },
  hiddenMark: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1,
  },
  rank: { fontSize: 18, fontWeight: "900", lineHeight: 20 },
  compactRank: { fontSize: 14, lineHeight: 15 },
  suit: { fontSize: 13, fontWeight: "900", lineHeight: 14 },
  compactSuit: { fontSize: 10 },
  centerSuit: { flex: 1, alignItems: "center", justifyContent: "center" },
  centerSuitText: { fontSize: 36, fontWeight: "700" },
  compactCenter: { fontSize: 27 },
  selectedGlow: {
    position: "absolute",
    left: 3,
    right: 3,
    bottom: -4,
    height: 11,
    backgroundColor: colors.cyan,
    opacity: 0.34,
    borderRadius: 999,
  },
});
