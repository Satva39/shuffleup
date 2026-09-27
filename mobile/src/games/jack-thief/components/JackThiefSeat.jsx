import { StyleSheet, Text, View } from "react-native";
import { colors, radii } from "../../../theme";
import { GameSeatMotion, seatMotionKey } from "../../../components/GameMotion";
import { isBotPlayer } from "../../../utils/player";

function JackThiefSeatContent({ player, isYou, isCurrentTurn, isTarget }) {
  const initials = String(player?.username || "P")
    .trim()
    .slice(0, 1)
    .toUpperCase();
  const status =
    player?.status === "loser"
      ? "FINAL JACK"
      : player?.status === "finished"
        ? `FINISHED #${player.eliminationPlace}`
        : player?.connected
          ? `${player?.cardCount ?? 0} CARDS`
          : "DISCONNECTED";

  return (
    <View
      style={[
        styles.seat,
        isCurrentTurn && styles.activeSeat,
        isTarget && styles.targetSeat,
        isYou && styles.youSeat,
      ]}
    >
      <View style={[styles.avatar, isYou && styles.youAvatar]}>
        <Text style={styles.avatarText}>{initials}</Text>
        <View
          style={[
            styles.dot,
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
        <Text style={styles.meta}>{status}</Text>
      </View>
      {isTarget ? <Text style={styles.targetLabel}>DRAW</Text> : null}
      {isCurrentTurn ? <Text style={styles.turnLabel}>TURN</Text> : null}
    </View>
  );
}

export default function JackThiefSeat(props) {
  const active = Boolean(
    props.active || props.isCurrentTurn || props.isTurn || props.current,
  );

  return (
    <GameSeatMotion motionKey={seatMotionKey(props)} active={active}>
      <JackThiefSeatContent {...props} />
    </GameSeatMotion>
  );
}

const styles = StyleSheet.create({
  seat: {
    width: 172,
    minHeight: 66,
    borderRadius: radii.md,
    backgroundColor: "rgba(8,15,30,0.96)",
    borderWidth: 1,
    borderColor: "rgba(92,110,152,0.4)",
    padding: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    position: "relative",
  },
  activeSeat: {
    borderColor: colors.gold,
    backgroundColor: "rgba(56,43,16,0.98)",
  },
  targetSeat: { borderColor: colors.cyan },
  youSeat: { borderColor: "rgba(53,216,255,0.58)" },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  youAvatar: { borderColor: colors.cyan },
  avatarText: { color: colors.text, fontSize: 12, fontWeight: "900" },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: "absolute",
    right: -1,
    bottom: -1,
    borderWidth: 1.5,
    borderColor: "#080F1E",
  },
  online: { backgroundColor: colors.green },
  offline: { backgroundColor: colors.red },
  copy: { flex: 1, minWidth: 0 },
  name: { color: colors.text, fontSize: 11.5, fontWeight: "900" },
  meta: { color: colors.muted, fontSize: 9, marginTop: 3, fontWeight: "700" },
  targetLabel: {
    position: "absolute",
    right: 8,
    bottom: -8,
    backgroundColor: colors.cyan,
    color: "#07101A",
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 3,
    fontSize: 7.5,
    fontWeight: "900",
  },
  turnLabel: {
    position: "absolute",
    right: 8,
    top: -8,
    backgroundColor: colors.gold,
    color: "#07101A",
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 3,
    fontSize: 7.5,
    fontWeight: "900",
  },
});
