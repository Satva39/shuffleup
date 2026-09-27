import { StyleSheet, Text, View } from "react-native";
import { colors, radii } from "../../../theme";
import { seatLabel } from "../utils/cards";
import { GameSeatMotion, seatMotionKey } from "../../../components/GameMotion";

function MindiCoatSeatContent({ player, isYou, isCurrentTurn }) {
  if (!player) return null;

  const initials = String(player?.username || "Player")
    .trim()
    .slice(0, 1)
    .toUpperCase();
  const team =
    player?.team === "A" ? "A · N/S" : player?.team === "B" ? "B · E/W" : "—";

  return (
    <View
      style={[
        styles.wrap,
        isCurrentTurn && styles.activeWrap,
        isYou && styles.youWrap,
      ]}
    >
      <View style={styles.identity}>
        <View
          style={[
            styles.avatar,
            isYou && styles.youAvatar,
            isCurrentTurn && styles.activeAvatar,
          ]}
        >
          <Text style={styles.avatarText}>{isYou ? "YOU" : initials}</Text>
          <View
            style={[
              styles.dot,
              player?.connected ? styles.online : styles.offline,
            ]}
          />
        </View>

        <View style={styles.nameBox}>
          <Text numberOfLines={1} ellipsizeMode="tail" style={styles.name}>
            {isYou ? "You" : player?.username || "Player"}
          </Text>
          <Text numberOfLines={1} ellipsizeMode="tail" style={styles.meta}>
            {seatLabel(player?.seat)} · Team {team}
          </Text>
        </View>
      </View>

      {isCurrentTurn ? (
        <View style={styles.turnRow}>
          <Text style={styles.turn}>YOUR TURN</Text>
        </View>
      ) : null}

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>TRICKS</Text>
          <Text style={styles.statValue}>{player?.tricksWon ?? 0}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>KEY CARDS</Text>
          <Text style={styles.statValue}>{player?.tensCaptured ?? 0}</Text>
        </View>
      </View>
    </View>
  );
}

export default function MindiCoatSeat(props) {
  const active = Boolean(
    props.active || props.isCurrentTurn || props.isTurn || props.current,
  );

  return (
    <GameSeatMotion motionKey={seatMotionKey(props)} active={active}>
      <MindiCoatSeatContent {...props} />
    </GameSeatMotion>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    minWidth: 0,
    minHeight: 112,
    backgroundColor: "rgba(8,15,30,0.94)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(96,111,150,0.38)",
    padding: 10,
    position: "relative",
  },
  activeWrap: {
    borderColor: colors.gold,
    backgroundColor: "rgba(36,31,15,0.96)",
    shadowColor: colors.gold,
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  youWrap: {
    borderColor: colors.cyan,
    backgroundColor: "rgba(53,216,255,0.055)",
  },
  identity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingRight: 2,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#16334A",
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  youAvatar: {
    borderColor: colors.cyan,
    backgroundColor: "#10364E",
  },
  activeAvatar: {
    backgroundColor: "#3F3210",
    borderColor: colors.gold,
  },
  avatarText: {
    color: colors.cyan,
    fontSize: 8.5,
    fontWeight: "900",
  },
  dot: {
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
  nameBox: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "900",
  },
  meta: {
    color: colors.muted,
    fontSize: 8.5,
    fontWeight: "700",
    marginTop: 2,
  },
  turnRow: {
    marginTop: 7,
    alignItems: "flex-start",
  },
  turn: {
    color: colors.gold,
    backgroundColor: "rgba(250,204,78,0.10)",
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 3,
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  stats: {
    flexDirection: "row",
    gap: 6,
    marginTop: 9,
  },
  stat: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 6,
    paddingHorizontal: 7,
    borderRadius: radii.sm,
    backgroundColor: "#141F38",
  },
  statLabel: {
    color: colors.muted,
    fontSize: 6.5,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  statValue: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "900",
    marginTop: 1,
  },
});
