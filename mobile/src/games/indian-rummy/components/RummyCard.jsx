import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useEffect, useRef } from "react";
import { colors, radii } from "../../../theme";
import { GameCardMotion, cardMotionKey } from "../../../components/GameMotion";

const suitMeta = {
  spades: { symbol: "♠", color: "#162035" },
  hearts: { symbol: "♥", color: "#D52F5B" },
  diamonds: { symbol: "♦", color: "#D52F5B" },
  clubs: { symbol: "♣", color: "#162035" },
};

function cardMeta(card) {
  if (card?.printedJoker || card?.rank === "JOKER") {
    return { symbol: "★", color: colors.primary, label: "JOKER" };
  }
  const meta = suitMeta[card?.suit] || suitMeta.spades;
  return { symbol: meta.symbol, color: meta.color, label: card?.rank || "?" };
}

function RummyCardContent({
  card,
  selected = false,
  compact = false,
  hidden = false,
  wild = false,
  disabled = false,
  onPress,
}) {
  const lift = useRef(new Animated.Value(selected ? -10 : 0)).current;
  const meta = cardMeta(card);

  useEffect(() => {
    Animated.spring(lift, {
      toValue: selected ? -10 : 0,
      useNativeDriver: true,
      speed: 24,
      bounciness: 6,
    }).start();
  }, [lift, selected]);

  return (
    <Animated.View
      style={[
        styles.wrapper,
        compact && styles.compactWrapper,
        { transform: [{ translateY: lift }] },
      ]}
    >
      <Pressable
        disabled={!onPress || disabled}
        onPress={onPress}
        style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
      >
        <View
          style={[
            styles.card,
            compact && styles.compactCard,
            hidden && styles.backCard,
            selected && styles.selected,
            wild && styles.wild,
            disabled && styles.disabled,
          ]}
        >
          {hidden ? (
            <View style={styles.backInner}>
              <Text style={styles.backMark}>SU</Text>
              <Text style={styles.backSuit}>♠</Text>
            </View>
          ) : (
            <>
              <View style={styles.corner}>
                <Text
                  style={[
                    styles.rank,
                    compact && styles.compactRank,
                    { color: meta.color },
                  ]}
                >
                  {meta.label}
                </Text>
                <Text
                  style={[
                    styles.suit,
                    compact && styles.compactSuit,
                    { color: meta.color },
                  ]}
                >
                  {meta.symbol}
                </Text>
              </View>
              <View style={styles.center}>
                <Text
                  style={[
                    styles.centerSuit,
                    compact && styles.compactCenter,
                    { color: meta.color },
                  ]}
                >
                  {meta.symbol}
                </Text>
              </View>
              {wild ? (
                <View style={styles.wildBadge}>
                  <Text style={styles.wildBadgeText}>WILD</Text>
                </View>
              ) : null}
            </>
          )}
        </View>
        {selected ? (
          <View pointerEvents="none" style={styles.selectionGlow} />
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

export default function RummyCard(props) {
  return (
    <GameCardMotion
      motionKey={cardMotionKey(props)}
      emphasize={Boolean(props.latest || props.highlighted || props.emphasize)}
    >
      <RummyCardContent {...props} />
    </GameCardMotion>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: 56,
    height: 82,
    marginHorizontal: 3,
    marginBottom: 7,
  },
  compactWrapper: {
    width: 43,
    height: 63,
    marginHorizontal: 2,
    marginBottom: 0,
  },
  pressable: { flex: 1, borderRadius: radii.sm },
  pressed: { opacity: 0.86 },
  card: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: "#FCFCFF",
    borderWidth: 1,
    borderColor: "#D5DDF1",
    padding: 6,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.24,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  compactCard: { borderRadius: 9, padding: 5 },
  backCard: {
    backgroundColor: "#1F2C4D",
    borderColor: "#5B6C9A",
    alignItems: "center",
    justifyContent: "center",
  },
  backInner: { flex: 1, alignItems: "center", justifyContent: "center" },
  backMark: {
    color: "#9AA7C2",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  backSuit: { color: "#D6DBE9", fontSize: 22, marginTop: 1 },
  selected: {
    borderColor: colors.cyan,
    borderWidth: 2,
    shadowColor: colors.cyan,
    shadowOpacity: 0.42,
    shadowRadius: 11,
    elevation: 8,
  },
  wild: { borderColor: colors.gold },
  disabled: { opacity: 0.45 },
  corner: { alignItems: "flex-start" },
  rank: { fontSize: 18, fontWeight: "900", lineHeight: 19 },
  compactRank: { fontSize: 13, lineHeight: 14 },
  suit: { fontSize: 13, fontWeight: "900", lineHeight: 14 },
  compactSuit: { fontSize: 10, lineHeight: 11 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  centerSuit: { fontSize: 34, fontWeight: "700" },
  compactCenter: { fontSize: 24 },
  wildBadge: {
    position: "absolute",
    right: 5,
    bottom: 5,
    backgroundColor: "rgba(247,198,93,0.92)",
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  wildBadgeText: { color: "#1A1507", fontSize: 6.5, fontWeight: "900" },
  selectionGlow: {
    position: "absolute",
    left: 3,
    right: 3,
    bottom: -2,
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.cyan,
    opacity: 0.35,
  },
});
