import { StyleSheet, Text, View } from "react-native";
import { colors, radii } from "../../../theme";
import { GameSeatMotion, seatMotionKey } from "../../../components/GameMotion";
import { isBotPlayer } from "../../../utils/player";

function TwentyNineSeatContent({
  player,
  current = false,
  self = false,
  compact = false,
}) {
  if (!player) return null;
  const teamColor = player.team === "A" ? colors.gold : colors.cyan;

  return (
    <View
      style={[
        styles.seat,
        compact && styles.compactSeat,
        self && styles.self,
        current && styles.current,
      ]}
    >
      <View style={[styles.avatar, { borderColor: teamColor }]}>
        <Text style={[styles.avatarText, { color: teamColor }]}>
          {self ? "YOU" : player.username?.slice(0, 1)?.toUpperCase() || "?"}
        </Text>
      </View>
      <View style={styles.identity}>
        <View style={styles.nameRow}>
          <Text numberOfLines={1} style={styles.name}>
            {self ? "You" : player.username}
            {!self && isBotPlayer(player) ? " · BOT" : ""}
          </Text>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: player.connected ? colors.green : colors.red },
            ]}
          />
        </View>
        <Text style={styles.meta}>
          {player.seatLabel} · Team {player.team}
        </Text>
      </View>
      <View style={[styles.stats, compact && styles.compactStats]}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>BID</Text>
          <Text style={styles.statValue}>
            {player.bid === "pass" ? "PASS" : (player.bid ?? "—")}
          </Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>TRICKS</Text>
          <Text style={styles.statValue}>{player.tricksWon ?? 0}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>CARDS</Text>
          <Text style={styles.statValue}>{player.cardCount ?? 0}</Text>
        </View>
      </View>
    </View>
  );
}

export default function TwentyNineSeat(props) {
  const active = Boolean(
    props.active || props.isCurrentTurn || props.isTurn || props.current,
  );

  return (
    <GameSeatMotion motionKey={seatMotionKey(props)} active={active}>
      <TwentyNineSeatContent {...props} />
    </GameSeatMotion>
  );
}

const styles = StyleSheet.create({
  seat: {
    minWidth: 0,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    padding: 11,
    borderRadius: 20,
    backgroundColor: "#0B1528",
    borderWidth: 1,
    borderColor: colors.border,
  },
  compactSeat: {
    paddingVertical: 9,
    paddingHorizontal: 9,
    borderRadius: 18,
    minHeight: 84,
  },
  self: { borderColor: colors.cyan },
  current: {
    borderColor: colors.gold,
    shadowColor: colors.gold,
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#0D3045",
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 10, fontWeight: "900" },
  identity: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  name: { color: colors.text, fontSize: 13, fontWeight: "900", flex: 1 },
  meta: { color: colors.muted, fontSize: 10, fontWeight: "700", marginTop: 2 },
  statusDot: { width: 8, height: 8, borderRadius: 8 },
  stats: { flexDirection: "row", gap: 4 },
  compactStats: { display: "none" },
  stat: {
    minWidth: 35,
    paddingHorizontal: 6,
    paddingVertical: 5,
    borderRadius: radii.sm,
    backgroundColor: "#141F38",
  },
  statLabel: {
    color: colors.muted,
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  statValue: {
    color: colors.text,
    fontSize: 11,
    fontWeight: "900",
    marginTop: 2,
  },
});
