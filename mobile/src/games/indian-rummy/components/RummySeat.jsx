import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radii } from "../../../theme";
import RummyCard from "./RummyCard";
import { GameSeatMotion, seatMotionKey } from "../../../components/GameMotion";
import { isBotPlayer } from "../../../utils/player";

function RummySeatContent({ player, isCurrentTurn = false, isYou = false }) {
  const initials = String(player?.username || "Player")
    .trim()
    .slice(0, 1)
    .toUpperCase();

  return (
    <View
      style={[
        styles.wrap,
        isCurrentTurn && styles.activeWrap,
        isYou && styles.youWrap,
      ]}
    >
      <View
        style={[
          styles.avatar,
          isCurrentTurn && styles.activeAvatar,
          isYou && styles.youAvatar,
        ]}
      >
        <Text style={styles.avatarText}>{initials}</Text>
        <View
          style={[
            styles.connectionDot,
            player?.connected ? styles.online : styles.offline,
          ]}
        />
      </View>
      <View style={styles.copy}>
        <Text numberOfLines={1} style={styles.name}>
          {player?.username || "Player"}
          {isYou ? " · YOU" : ""}
          {!isYou && isBotPlayer(player) ? " · BOT" : ""}
        </Text>
        <Text style={styles.meta}>
          {player?.cardCount ?? 0} cards · {player?.score ?? 0} pts
        </Text>
      </View>
      {isCurrentTurn ? (
        <View style={styles.turnPill}>
          <Ionicons name="flash" size={10} color="#151100" />
          <Text style={styles.turnText}>TURN</Text>
        </View>
      ) : null}
    </View>
  );
}

export function OpponentCards({ count = 0 }) {
  const shown = Math.min(Math.max(count, 0), 13);
  return (
    <View style={styles.cardsRow} pointerEvents="none">
      {Array.from({ length: Math.min(shown, 5) }, (_, index) => (
        <View
          key={index}
          style={[styles.backWrap, { marginLeft: index === 0 ? 0 : -18 }]}
        >
          <RummyCard card={{ rank: "?", suit: "spades" }} hidden compact />
        </View>
      ))}
      {shown > 5 ? <Text style={styles.countText}>+{shown - 5}</Text> : null}
    </View>
  );
}

export default function RummySeat(props) {
  const active = Boolean(
    props.active || props.isCurrentTurn || props.isTurn || props.current,
  );

  return (
    <GameSeatMotion motionKey={seatMotionKey(props)} active={active}>
      <RummySeatContent {...props} />
    </GameSeatMotion>
  );
}

const styles = StyleSheet.create({
  wrap: {
    minWidth: 0,
    flex: 1,
    minHeight: 66,
    backgroundColor: "rgba(7,14,28,0.92)",
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: "rgba(81,103,151,0.45)",
    padding: 9,
    justifyContent: "center",
    position: "relative",
  },
  activeWrap: {
    borderColor: colors.gold,
    backgroundColor: "rgba(40,34,11,0.92)",
    shadowColor: colors.gold,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
  },
  youWrap: { borderColor: colors.cyan },
  avatar: {
    width: 29,
    height: 29,
    borderRadius: 15,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  activeAvatar: { backgroundColor: colors.gold, borderColor: colors.gold },
  youAvatar: { borderColor: colors.cyan },
  avatarText: { color: colors.text, fontSize: 11, fontWeight: "900" },
  connectionDot: {
    position: "absolute",
    right: -1,
    bottom: -1,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "#09111F",
  },
  online: { backgroundColor: colors.green },
  offline: { backgroundColor: colors.red },
  copy: { minWidth: 0, marginTop: 6 },
  name: { color: colors.text, fontSize: 11, fontWeight: "900" },
  meta: { color: colors.muted, fontSize: 9, marginTop: 2 },
  turnPill: {
    position: "absolute",
    top: 6,
    right: 7,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: colors.gold,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  turnText: { color: "#151100", fontSize: 7, fontWeight: "900" },
  cardsRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 64,
    marginTop: 7,
    paddingLeft: 2,
  },
  backWrap: { width: 43, height: 63 },
  countText: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "900",
    marginLeft: 5,
  },
});
