import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radii } from "../../../theme";
import { GameCardMotion, cardMotionKey } from "../../../components/GameMotion";

function SolitaireCardContent({
  card,
  width = 44,
  height = 62,
  selected = false,
  disabled = false,
  onPress,
  overlap = false,
}) {
  if (!card) return null;

  const faceUp = card.faceUp !== false;
  if (!faceUp) {
    return (
      <View
        style={[styles.back, { width, height, marginTop: overlap ? -18 : 0 }]}
      >
        <View style={styles.backInner}>
          <Text
            style={[styles.backMark, { fontSize: Math.max(10, width * 0.3) }]}
          >
            SU
          </Text>
        </View>
      </View>
    );
  }

  const ink = card.color === "red" ? "#D64057" : "#18223A";
  const rankSize = width <= 40 ? 12 : width <= 48 ? 14 : 16;
  const suitSize = width <= 40 ? 10 : width <= 48 ? 12 : 14;
  const content = (
    <>
      <View style={styles.corner}>
        <Text style={[styles.rank, { color: ink, fontSize: rankSize }]}>
          {card.rank}
        </Text>
        <Text style={[styles.suit, { color: ink, fontSize: suitSize }]}>
          {card.symbol}
        </Text>
      </View>
      <Text
        style={[
          styles.centerSuit,
          { color: ink, fontSize: Math.max(18, width * 0.48) },
        ]}
      >
        {card.symbol}
      </Text>
    </>
  );

  const cardStyle = [
    styles.card,
    { width, height, opacity: disabled ? 0.6 : 1 },
    selected && styles.selected,
  ];

  if (!onPress) {
    return <View style={cardStyle}>{content}</View>;
  }

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [...cardStyle, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

export default function SolitaireCard(props) {
  return (
    <GameCardMotion
      motionKey={cardMotionKey(props)}
      emphasize={Boolean(props.latest || props.highlighted || props.emphasize)}
    >
      <SolitaireCardContent {...props} />
    </GameCardMotion>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 10,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#D9E0EB",
    padding: 4,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  selected: {
    borderColor: colors.cyan,
    borderWidth: 2,
    transform: [{ translateY: -7 }],
    shadowColor: colors.cyan,
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  pressed: { opacity: 0.82 },
  corner: { alignItems: "flex-start" },
  rank: { fontWeight: "900", lineHeight: 16 },
  suit: { fontWeight: "800", marginTop: -2 },
  centerSuit: { alignSelf: "center", opacity: 0.94 },
  back: {
    borderRadius: 10,
    backgroundColor: "#182542",
    borderWidth: 1,
    borderColor: "#4F638F",
    padding: 4,
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  backInner: {
    flex: 1,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "#33496F",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#101A30",
  },
  backMark: { color: colors.cyan, fontWeight: "900" },
});
