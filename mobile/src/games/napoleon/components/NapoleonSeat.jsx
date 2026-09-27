import { StyleSheet, Text, View } from "react-native";
import { colors, radii } from "../../../theme";
import { GameSeatMotion, seatMotionKey } from "../../../components/GameMotion";
import { isBotPlayer } from "../../../utils/player";

function NapoleonSeatContent({
  player,
  active = false,
  you = false,
  napoleon = false,
  partner = false,
}) {
  if (!player) return null;

  return (
    <View
      style={[styles.seat, active && styles.activeSeat, you && styles.youSeat]}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {String(player.username || "P")
            .slice(0, 1)
            .toUpperCase()}
        </Text>
      </View>
      <View style={styles.info}>
        <Text numberOfLines={1} style={styles.name}>
          {you ? "YOU" : player.username}
          {!you && isBotPlayer(player) ? " · BOT" : ""}
        </Text>
        <Text style={styles.meta}>{player.cardCount ?? 0} CARDS</Text>
      </View>
      <View style={styles.badges}>
        {player.connected === false ? (
          <Text style={styles.offline}>OFFLINE</Text>
        ) : null}
        {napoleon ? <Text style={styles.napoleon}>NAPOLEON</Text> : null}
        {partner ? <Text style={styles.partner}>PARTNER</Text> : null}
      </View>
    </View>
  );
}

export default function NapoleonSeat(props) {
  const active = Boolean(
    props.active || props.isCurrentTurn || props.isTurn || props.current,
  );

  return (
    <GameSeatMotion motionKey={seatMotionKey(props)} active={active}>
      <NapoleonSeatContent {...props} />
    </GameSeatMotion>
  );
}

const styles = StyleSheet.create({
  seat: {
    minWidth: 132,
    maxWidth: 176,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: "#0A1324",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  activeSeat: {
    borderColor: colors.gold,
    backgroundColor: "#19192A",
    shadowColor: colors.gold,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  youSeat: { borderColor: colors.cyan },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#17334A",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.cyan, fontSize: 14, fontWeight: "900" },
  info: { flex: 1, minWidth: 0 },
  name: { color: colors.text, fontWeight: "900", fontSize: 12 },
  meta: { color: colors.muted, fontSize: 10, fontWeight: "800", marginTop: 3 },
  badges: { alignItems: "flex-end", gap: 3 },
  offline: { color: colors.red, fontSize: 8, fontWeight: "900" },
  napoleon: { color: colors.gold, fontSize: 8, fontWeight: "900" },
  partner: { color: colors.green, fontSize: 8, fontWeight: "900" },
});
