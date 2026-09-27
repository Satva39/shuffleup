import { StyleSheet, Text, View } from "react-native";
import { colors, radii } from "../../../theme";
import { GameSeatMotion, seatMotionKey } from "../../../components/GameMotion";

function statusColor(status) {
  if (status === "COMPLETE") return colors.green;
  if (status === "DISCONNECTED") return colors.red;
  return colors.cyan;
}

function SolitaireSeatContent({ player, isYou = false }) {
  if (!player) return null;
  const progress = Math.min(
    100,
    Math.max(0, ((Number(player.progress) || 0) / 52) * 100),
  );
  const accent = statusColor(player.status);

  return (
    <View style={[styles.card, isYou && styles.youCard]}>
      <View style={styles.topRow}>
        <View style={styles.nameBlock}>
          <View style={[styles.dot, { backgroundColor: accent }]} />
          <Text numberOfLines={1} style={styles.name}>
            {player.username}
          </Text>
          {isYou ? <Text style={styles.you}>YOU</Text> : null}
        </View>
        <Text style={[styles.status, { color: accent }]}>{player.status}</Text>
      </View>
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${progress}%`, backgroundColor: accent },
          ]}
        />
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.meta}>{player.progress}/52</Text>
        <Text style={styles.meta}>{player.score} pts</Text>
        <Text style={styles.meta}>{player.moves} moves</Text>
      </View>
    </View>
  );
}

export default function SolitaireSeat(props) {
  const active = Boolean(
    props.active || props.isCurrentTurn || props.isTurn || props.current,
  );

  return (
    <GameSeatMotion motionKey={seatMotionKey(props)} active={active}>
      <SolitaireSeatContent {...props} />
    </GameSeatMotion>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 0,
    padding: 11,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  youCard: { borderColor: colors.primary2 },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  nameBlock: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minWidth: 0,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  name: { color: colors.text, fontWeight: "900", fontSize: 12, flexShrink: 1 },
  you: { color: colors.cyan, fontWeight: "900", fontSize: 9 },
  status: { fontSize: 9, fontWeight: "900" },
  progressTrack: {
    marginTop: 9,
    height: 5,
    borderRadius: 999,
    backgroundColor: colors.surface2,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 999 },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 5,
    marginTop: 8,
  },
  meta: { color: colors.muted, fontSize: 9, fontWeight: "800" },
});
