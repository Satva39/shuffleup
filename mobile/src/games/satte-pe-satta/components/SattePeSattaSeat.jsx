import { StyleSheet, Text, View } from "react-native";
import { colors, radii } from "../../../theme";
import { GameSeatMotion, seatMotionKey } from "../../../components/GameMotion";
import { isBotPlayer } from "../../../utils/player";

function SattePeSattaSeatContent({ player, isYou = false, active = false }) {
  if (!player) return null;

  return (
    <View style={[styles.card, active && styles.active, isYou && styles.you]}>
      <View style={styles.row}>
        <View style={[styles.avatar, active && styles.avatarActive]}>
          <Text style={[styles.avatarText, active && styles.avatarTextActive]}>
            {isYou ? "YOU" : player.username?.charAt(0)?.toUpperCase() || "?"}
          </Text>
        </View>
        <View style={styles.identity}>
          <Text numberOfLines={1} style={styles.name}>
            {isYou ? "You" : player.username}
            {!isYou && isBotPlayer(player) ? " · BOT" : ""}
          </Text>
          <Text style={styles.meta}>
            {player.cardCount} {player.cardCount === 1 ? "card" : "cards"} ·{" "}
            {player.score || 0} pts
          </Text>
        </View>
        <View style={styles.status}>
          <View
            style={[
              styles.dot,
              player.connected ? styles.online : styles.offline,
            ]}
          />
          {active ? <Text style={styles.turn}>TURN</Text> : null}
        </View>
      </View>
      {active ? (
        <View style={styles.turnBanner}>
          <Text style={styles.turnBannerText}>CURRENT PLAYER</Text>
        </View>
      ) : null}
    </View>
  );
}

export default function SattePeSattaSeat(props) {
  const active = Boolean(
    props.active || props.isCurrentTurn || props.isTurn || props.current,
  );

  return (
    <GameSeatMotion motionKey={seatMotionKey(props)} active={active}>
      <SattePeSattaSeatContent {...props} />
    </GameSeatMotion>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 11,
  },
  active: {
    borderColor: colors.gold,
    shadowColor: colors.gold,
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
  you: {
    borderColor: colors.cyan,
    backgroundColor: "#0D1B2B",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#15364A",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
  },
  avatarActive: {
    backgroundColor: "#4A3A15",
  },
  avatarText: {
    color: colors.cyan,
    fontWeight: "900",
    fontSize: 14,
  },
  avatarTextActive: {
    color: colors.gold,
  },
  identity: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900",
  },
  meta: {
    color: colors.muted,
    fontSize: 10,
    marginTop: 3,
  },
  status: {
    marginLeft: 6,
    alignItems: "flex-end",
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: radii.pill,
  },
  online: {
    backgroundColor: colors.green,
  },
  offline: {
    backgroundColor: colors.red,
  },
  turn: {
    marginTop: 4,
    color: colors.gold,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  turnBanner: {
    marginTop: 9,
    borderRadius: 10,
    backgroundColor: "#231E10",
    borderWidth: 1,
    borderColor: "#594619",
    paddingVertical: 6,
    alignItems: "center",
  },
  turnBannerText: {
    color: colors.gold,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
  },
});
