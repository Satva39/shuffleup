import { StyleSheet, Text, View } from "react-native";
import { colors, radii } from "../../../theme";
import { WarCardBack } from "./WarCard";
import { GameSeatMotion, seatMotionKey } from "../../../components/GameMotion";
import { isBotPlayer } from "../../../utils/player";

function WarSeatContent({ player, isYou = false, active = false }) {
  return (
    <View
      style={[
        styles.card,
        isYou && styles.you,
        active && styles.active,
        player.eliminated && styles.eliminated,
      ]}
    >
      <View style={styles.topline}>
        <View style={styles.identity}>
          <View style={[styles.avatar, isYou && styles.youAvatar]}>
            <Text style={styles.avatarText}>
              {isYou
                ? "YOU"
                : player.username?.slice(0, 1)?.toUpperCase() || "P"}
            </Text>
          </View>
          <View style={styles.nameWrap}>
            <Text numberOfLines={1} style={styles.name}>
              {isYou ? "YOU" : player.username}
              {!isYou && isBotPlayer(player) ? " · BOT" : ""}
            </Text>
            <Text style={styles.seatText}>SEAT {player.seat}</Text>
          </View>
        </View>
        <View
          style={[styles.statusDot, !player.connected && styles.offlineDot]}
        />
      </View>

      <View style={styles.stats}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>CARDS</Text>
          <Text style={styles.statValue}>{player.cardCount}</Text>
        </View>
        <View style={styles.stackBox}>
          {player.cardCount > 0 ? (
            <WarCardBack small />
          ) : (
            <View style={styles.emptyPile} />
          )}
          <Text style={styles.stackText}>
            {player.eliminated ? "ELIMINATED" : "PILE"}
          </Text>
        </View>
      </View>

      {active && !player.eliminated ? (
        <View style={styles.activeBadge}>
          <Text style={styles.activeText}>REVEALING</Text>
        </View>
      ) : null}
    </View>
  );
}

export default function WarSeat(props) {
  const active = Boolean(
    props.active || props.isCurrentTurn || props.isTurn || props.current,
  );

  return (
    <GameSeatMotion motionKey={seatMotionKey(props)} active={active}>
      <WarSeatContent {...props} />
    </GameSeatMotion>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 112,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    position: "relative",
  },
  you: { borderColor: colors.cyan },
  active: {
    borderColor: colors.gold,
    shadowColor: colors.gold,
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 5,
  },
  eliminated: { opacity: 0.5 },
  topline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  identity: { flexDirection: "row", alignItems: "center", flex: 1 },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#102C3B",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  youAvatar: { backgroundColor: "#10334B" },
  avatarText: { color: colors.cyan, fontSize: 10, fontWeight: "900" },
  nameWrap: { flex: 1 },
  name: { color: colors.text, fontSize: 13, fontWeight: "900" },
  seatText: {
    color: colors.muted,
    fontSize: 8,
    fontWeight: "800",
    marginTop: 2,
  },
  statusDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.green,
  },
  offlineDot: { backgroundColor: colors.red },
  stats: { flexDirection: "row", alignItems: "center", marginTop: 10, gap: 8 },
  statBox: {
    flex: 1,
    minHeight: 44,
    backgroundColor: colors.surface2,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
    justifyContent: "center",
  },
  statLabel: {
    color: colors.muted,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  statValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900",
    marginTop: 2,
  },
  stackBox: { width: 42, alignItems: "center", justifyContent: "center" },
  emptyPile: {
    width: 28,
    height: 34,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stackText: {
    color: colors.muted,
    fontSize: 7,
    fontWeight: "900",
    marginTop: 2,
  },
  activeBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#2B2613",
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  activeText: { color: colors.gold, fontSize: 7, fontWeight: "900" },
});
