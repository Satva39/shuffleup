import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useEffect, useRef } from "react";
import { colors, radii } from "../../../theme";
import { GameCardMotion, cardMotionKey } from "../../../components/GameMotion";

const SUITS = {
  clubs: { symbol: "♣", color: "#162033" },
  diamonds: { symbol: "♦", color: "#D62854" },
  hearts: { symbol: "♥", color: "#D62854" },
  spades: { symbol: "♠", color: "#162033" },
};

function NapoleonCardContent({
  card,
  compact = false,
  table = false,
  playable = false,
  selected = false,
  onPress,
}) {
  const lift = useRef(new Animated.Value(selected ? -10 : 0)).current;
  const suit = SUITS[card?.suit] || SUITS.spades;

  useEffect(() => {
    Animated.spring(lift, {
      toValue: selected ? -10 : 0,
      useNativeDriver: true,
      speed: 22,
      bounciness: 6,
    }).start();
  }, [lift, selected]);

  const canPress = Boolean(onPress) && (playable || selected);

  return (
    <Animated.View
      style={[
        styles.wrapper,
        compact && styles.compactWrapper,
        table && styles.tableWrapper,
        { transform: [{ translateY: lift }] },
      ]}
    >
      <Pressable
        disabled={!canPress}
        onPress={onPress}
        style={({ pressed }) => [
          styles.pressable,
          pressed && styles.pressed,
          onPress && !playable && !selected && styles.unplayable,
        ]}
      >
        <View
          style={[
            styles.card,
            compact && styles.compactCard,
            table && styles.tableCard,
          ]}
        >
          <View style={styles.corner}>
            <Text
              style={[
                styles.rank,
                compact && styles.compactRank,
                { color: suit.color },
              ]}
            >
              {card?.rank || "?"}
            </Text>
            <Text
              style={[
                styles.suit,
                compact && styles.compactSuit,
                { color: suit.color },
              ]}
            >
              {suit.symbol}
            </Text>
          </View>
          {!compact ? (
            <View style={styles.centerSuit}>
              <Text style={[styles.centerSuitText, { color: suit.color }]}>
                {suit.symbol}
              </Text>
            </View>
          ) : null}
          {selected ? <View style={styles.selectedLine} /> : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function NapoleonCard(props) {
  return (
    <GameCardMotion
      motionKey={cardMotionKey(props)}
      emphasize={Boolean(props.latest || props.highlighted || props.emphasize)}
    >
      <NapoleonCardContent {...props} />
    </GameCardMotion>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: 72, height: 105, marginHorizontal: 4, marginBottom: 8 },
  compactWrapper: { width: 58, height: 84, marginHorizontal: 3 },
  tableWrapper: { width: 66, height: 96, marginHorizontal: 2, marginBottom: 0 },
  pressable: { flex: 1, borderRadius: radii.sm },
  pressed: { opacity: 0.86 },
  unplayable: { opacity: 0.42 },
  card: {
    flex: 1,
    backgroundColor: "#FCFCFF",
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#D8DEF1",
    padding: 7,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.24,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  compactCard: { borderRadius: 10, padding: 6 },
  tableCard: { borderRadius: 11, padding: 6 },
  corner: { alignItems: "flex-start" },
  rank: { fontSize: 18, fontWeight: "900", lineHeight: 20 },
  compactRank: { fontSize: 14, lineHeight: 15 },
  suit: { fontSize: 13, fontWeight: "900", lineHeight: 15 },
  compactSuit: { fontSize: 10 },
  centerSuit: { flex: 1, alignItems: "center", justifyContent: "center" },
  centerSuitText: { fontSize: 35, fontWeight: "700" },
  selectedLine: {
    position: "absolute",
    left: 7,
    right: 7,
    bottom: 5,
    height: 4,
    borderRadius: 99,
    backgroundColor: colors.cyan,
  },
});
