import { ScrollView, StyleSheet, Text, View } from "react-native";
import BridgeCard from "./BridgeCard";
import { colors } from "../../../theme";
import { GameSeatMotion, seatMotionKey } from "../../../components/GameMotion";
import { isBotPlayer } from "../../../utils/player";

const names = { N: "North", E: "East", S: "South", W: "West" };

function BridgeSeatContent({
  player,
  viewerId,
  hand = [],
  showHand = false,
  selectableIds = new Set(),
  onCardPress,
  active = false,
}) {
  if (!player) return null;
  return (
    <View style={[styles.seat, active && styles.active]}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {String(player.username || "?")
              .slice(0, 1)
              .toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} style={styles.name}>
            {player.username}
            {player.id === viewerId ? " · YOU" : ""}
            {player.id !== viewerId && isBotPlayer(player) ? " · BOT" : ""}
          </Text>
          <Text style={styles.meta}>
            {names[player.seat]} · {player.partnership} ·{" "}
            {player.tricksWon || 0} tricks
          </Text>
        </View>
        <View
          style={[
            styles.dot,
            { backgroundColor: player.connected ? colors.green : colors.red },
          ]}
        />
      </View>
      {showHand ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hand}
        >
          {hand.map((card) => (
            <BridgeCard
              key={card.id}
              card={card}
              compact
              playable={selectableIds.has(card.id)}
              disabled={!selectableIds.has(card.id)}
              onPress={() => onCardPress?.(card, player.seat)}
            />
          ))}
        </ScrollView>
      ) : (
        <View style={styles.hidden}>
          <Text style={styles.hiddenText}>
            {player.cardCount ?? 0} cards hidden
          </Text>
        </View>
      )}
    </View>
  );
}

export default function BridgeSeat(props) {
  const active = Boolean(
    props.active || props.isCurrentTurn || props.isTurn || props.current,
  );

  return (
    <GameSeatMotion motionKey={seatMotionKey(props)} active={active}>
      <BridgeSeatContent {...props} />
    </GameSeatMotion>
  );
}

const styles = StyleSheet.create({
  seat: {
    backgroundColor: "rgba(8,18,34,0.92)",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 8,
  },
  active: {
    borderColor: colors.cyan,
    shadowColor: colors.cyan,
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  header: { flexDirection: "row", alignItems: "center", gap: 7 },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(53,216,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.cyan, fontSize: 11, fontWeight: "900" },
  name: { color: colors.text, fontSize: 10.5, fontWeight: "900" },
  meta: { color: colors.muted, fontSize: 7.5, marginTop: 2, fontWeight: "800" },
  dot: { width: 7, height: 7, borderRadius: 4 },
  hand: { alignItems: "flex-end", paddingTop: 6, paddingHorizontal: 2 },
  hidden: {
    marginTop: 5,
    minHeight: 28,
    borderRadius: 9,
    backgroundColor: "rgba(255,255,255,0.035)",
    alignItems: "center",
    justifyContent: "center",
  },
  hiddenText: { color: colors.muted, fontSize: 8, fontWeight: "800" },
});
