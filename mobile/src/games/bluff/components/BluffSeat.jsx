import { StyleSheet, Text, View } from "react-native";
import { colors, radii } from "../../../theme";
import { GameSeatMotion, seatMotionKey } from "../../../components/GameMotion";

function BluffSeatContent({ player, isYou, active }) {
  return (
    <View style={[styles.card, active && styles.active, isYou && styles.you]}>
      <View style={styles.head}>
        <View style={[styles.avatar, active && styles.avatarActive]}>
          <Text style={[styles.avatarText, active && styles.avatarTextActive]}>
            {isYou
              ? "YOU"
              : player?.username?.slice(0, 1)?.toUpperCase() || "?"}
          </Text>
        </View>
        <View style={styles.copy}>
          <Text numberOfLines={1} style={styles.name}>
            {isYou ? "You" : player?.username || "Player"}
          </Text>
          <Text style={styles.seat}>Seat {Number(player?.seat ?? 0) + 1}</Text>
        </View>
        <View style={[styles.status, !player?.connected && styles.offline]} />
      </View>
      <View style={styles.metaRow}>
        <View>
          <Text style={styles.metaLabel}>CARDS</Text>
          <Text style={styles.metaValue}>{player?.cardCount ?? 0}</Text>
        </View>
        <View style={styles.phaseBadge}>
          <Text style={styles.phaseText}>
            {active
              ? isYou
                ? "YOUR TURN"
                : "TURN"
              : player?.connected
                ? "LIVE"
                : "OFFLINE"}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function BluffSeat(props) {
  const active = Boolean(
    props.active || props.isCurrentTurn || props.isTurn || props.current,
  );

  return (
    <GameSeatMotion motionKey={seatMotionKey(props)} active={active}>
      <BluffSeatContent {...props} />
    </GameSeatMotion>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 170,
    minHeight: 108,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 13,
    marginRight: 10,
  },
  active: {
    borderColor: colors.gold,
    shadowColor: colors.gold,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
  },
  you: { borderColor: colors.cyan },
  head: { flexDirection: "row", alignItems: "center" },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#15334A",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
  },
  avatarActive: { backgroundColor: "#3B3115" },
  avatarText: { color: colors.cyan, fontWeight: "900", fontSize: 11 },
  avatarTextActive: { color: colors.gold },
  copy: { flex: 1, minWidth: 0 },
  name: { color: colors.text, fontSize: 15, fontWeight: "900" },
  seat: { color: colors.muted, fontSize: 11, marginTop: 2 },
  status: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.green,
    marginLeft: 7,
  },
  offline: { backgroundColor: colors.red },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 12,
  },
  metaLabel: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },
  metaValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
    marginTop: 2,
  },
  phaseBadge: {
    backgroundColor: colors.surface2,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 999,
  },
  phaseText: { color: colors.green, fontSize: 9, fontWeight: "900" },
});
