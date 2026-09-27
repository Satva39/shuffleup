import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radii } from "../../../theme";
import { GameSeatMotion, seatMotionKey } from "../../../components/GameMotion";
import { isBotPlayer } from "../../../utils/player";

function PlayerSeatContent({ player, isYou, isCurrentTurn }) {
  const initials = String(player?.username || "Player")
    .trim()
    .slice(0, 1)
    .toUpperCase();

  return (
    <View style={[styles.wrap, isCurrentTurn && styles.activeWrap]}>
      <View
        style={[
          styles.avatar,
          isYou && styles.youAvatar,
          isCurrentTurn && styles.activeAvatar,
        ]}
      >
        <Text style={styles.initials}>{initials}</Text>
        <View
          style={[
            styles.connectionDot,
            player?.connected ? styles.online : styles.offline,
          ]}
        />
      </View>
      <View style={styles.meta}>
        <Text numberOfLines={1} style={styles.name}>
          {player?.username || "Player"}
          {isYou ? " · YOU" : ""}
          {!isYou && isBotPlayer(player) ? " · BOT" : ""}
        </Text>
        <Text style={styles.stats}>
          {player?.score ?? 0} pts · {player?.cardCount ?? 0} cards
        </Text>
      </View>
      {isCurrentTurn ? (
        <View style={styles.turnBadge}>
          <Ionicons name="flash" size={11} color="#08101E" />
          <Text style={styles.turnText}>TURN</Text>
        </View>
      ) : null}
    </View>
  );
}

export default function PlayerSeat(props) {
  const active = Boolean(
    props.active || props.isCurrentTurn || props.isTurn || props.current,
  );

  return (
    <GameSeatMotion motionKey={seatMotionKey(props)} active={active}>
      <PlayerSeatContent {...props} />
    </GameSeatMotion>
  );
}

const styles = StyleSheet.create({
  wrap: {
    minWidth: 110,
    maxWidth: 156,
    backgroundColor: "rgba(8,15,30,0.92)",
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: "rgba(96,111,150,0.38)",
    paddingVertical: 8,
    paddingHorizontal: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  activeWrap: {
    borderColor: colors.gold,
    backgroundColor: "rgba(36,31,15,0.96)",
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  youAvatar: {
    borderColor: colors.cyan,
  },
  activeAvatar: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  initials: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "900",
  },
  connectionDot: {
    position: "absolute",
    right: -1,
    bottom: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "#080F1E",
  },
  online: { backgroundColor: colors.green },
  offline: { backgroundColor: colors.red },
  meta: { flex: 1, minWidth: 0 },
  name: { color: colors.text, fontSize: 11, fontWeight: "900" },
  stats: { color: colors.muted, fontSize: 9.5, marginTop: 2 },
  turnBadge: {
    position: "absolute",
    top: -8,
    right: 8,
    backgroundColor: colors.gold,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  turnText: { color: "#08101E", fontSize: 8.5, fontWeight: "900" },
});
