import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useEffect, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import { colors, radii } from "../../../theme";
import { suitColor, suitSymbol } from "../utils/rules";
import { GameCardMotion, cardMotionKey } from "../../../components/GameMotion";

function KachufulCardContent({
  card,
  playable = false,
  selected = false,
  compact = false,
  table = false,
  onPress,
}) {
  const symbol = suitSymbol(card?.suit);
  const lift = useRef(new Animated.Value(selected ? -12 : 0)).current;

  useEffect(() => {
    Animated.spring(lift, {
      toValue: selected ? -12 : 0,
      useNativeDriver: true,
      speed: 24,
      bounciness: 7,
    }).start();
  }, [lift, selected]);

  const cardContent = (
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
            { color: suitColor(card?.suit) },
          ]}
        >
          {card?.rank || "?"}
        </Text>
        <Text
          style={[
            styles.suit,
            compact && styles.compactSuit,
            { color: suitColor(card?.suit) },
          ]}
        >
          {symbol}
        </Text>
      </View>

      {!compact ? (
        <View style={styles.centerSuit}>
          <Text
            style={[styles.centerSuitText, { color: suitColor(card?.suit) }]}
          >
            {symbol}
          </Text>
        </View>
      ) : null}

      {!playable && !selected && onPress ? (
        <View style={styles.lockedBadge}>
          <Ionicons name="lock-closed" size={11} color={colors.muted} />
        </View>
      ) : null}
    </View>
  );

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
        disabled={!onPress || (!playable && !selected)}
        onPress={onPress}
        style={({ pressed }) => [
          styles.pressable,
          pressed && styles.pressed,
          !playable && !selected && onPress && styles.unplayable,
        ]}
      >
        {cardContent}
        {selected ? (
          <View pointerEvents="none" style={styles.selectedGlow} />
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

export default function KachufulCard(props) {
  return (
    <GameCardMotion
      motionKey={cardMotionKey(props)}
      emphasize={Boolean(props.latest || props.highlighted || props.emphasize)}
    >
      <KachufulCardContent {...props} />
    </GameCardMotion>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: 78,
    height: 112,
    marginHorizontal: 5,
    marginBottom: 8,
  },
  compactWrapper: {
    width: 58,
    height: 84,
    marginHorizontal: 3,
  },
  tableWrapper: {
    width: 78,
    height: 108,
    marginHorizontal: 3,
    marginBottom: 0,
  },
  pressable: {
    flex: 1,
    borderRadius: radii.sm,
  },
  pressed: { opacity: 0.86 },
  unplayable: { opacity: 0.48 },
  card: {
    flex: 1,
    backgroundColor: "#FCFCFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D8DEF1",
    padding: 8,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.26,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },
  compactCard: {
    borderRadius: 11,
    padding: 6,
  },
  tableCard: {
    borderRadius: 13,
    padding: 7,
  },
  corner: {
    alignItems: "flex-start",
  },
  rank: {
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 21,
  },
  compactRank: {
    fontSize: 15,
    lineHeight: 16,
  },
  suit: {
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 16,
  },
  compactSuit: {
    fontSize: 11,
  },
  centerSuit: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  centerSuitText: {
    fontSize: 39,
    fontWeight: "700",
  },
  lockedBadge: {
    position: "absolute",
    right: 6,
    top: 6,
    width: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: "#E9ECF5",
    alignItems: "center",
    justifyContent: "center",
  },
  selectedGlow: {
    position: "absolute",
    left: 4,
    right: 4,
    bottom: -4,
    height: 12,
    backgroundColor: colors.primary,
    opacity: 0.3,
    borderRadius: 999,
  },
});
