import { StyleSheet, Text, View } from "react-native";
import { colors, radii } from "../../../theme";
import MangooseCard from "./MangooseCard";
import { GameSeatMotion, seatMotionKey } from "../../../components/GameMotion";

function MangooseSeatContent({
  player,
  isYou,
  isCurrentTurn,
  onTarget,
  canTarget,
}) {
  const initials = String(player?.username || "P")
    .trim()
    .slice(0, 1)
    .toUpperCase();

  return (
    <View style={[styles.seat, isCurrentTurn && styles.activeSeat]}>
      <View style={[styles.avatar, isYou && styles.youAvatar]}>
        <Text style={styles.avatarText}>{initials}</Text>
        <View
          style={[
            styles.dot,
            player?.connected ? styles.online : styles.offline,
          ]}
        />
      </View>
      <View style={styles.meta}>
        <Text numberOfLines={1} style={styles.name}>
          {player?.username || "Player"}
          {isYou ? " · YOU" : ""}
        </Text>
        <Text style={styles.stats}>
          {player?.closedCount ?? 0} closed · {player?.openCount ?? 0} open
        </Text>
      </View>
      {isCurrentTurn ? <Text style={styles.turn}>TURN</Text> : null}

      {!isYou ? (
        <PressableTarget
          player={player}
          canTarget={canTarget}
          onTarget={onTarget}
        />
      ) : null}
    </View>
  );
}

function PressableTarget({ player, canTarget, onTarget }) {
  return (
    <View style={styles.openPileWrap}>
      <MangooseCard
        card={player?.openTopCard}
        compact
        disabled={!canTarget}
        onPress={canTarget ? () => onTarget(player.id) : undefined}
        hidden={!player?.openTopCard}
      />
      <View style={styles.countBadge}>
        <Text style={styles.countText}>{player?.openCount ?? 0}</Text>
      </View>
    </View>
  );
}

export default function MangooseSeat(props) {
  const active = Boolean(
    props.active || props.isCurrentTurn || props.isTurn || props.current,
  );

  return (
    <GameSeatMotion motionKey={seatMotionKey(props)} active={active}>
      <MangooseSeatContent {...props} />
    </GameSeatMotion>
  );
}

const styles = StyleSheet.create({
  seat: {
    width: 156,
    minHeight: 70,
    borderRadius: radii.md,
    backgroundColor: "rgba(8,15,30,0.92)",
    borderWidth: 1,
    borderColor: "rgba(96,111,150,0.38)",
    padding: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    position: "relative",
  },
  activeSeat: {
    borderColor: colors.gold,
    backgroundColor: "rgba(40,33,16,0.96)",
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
  youAvatar: { borderColor: colors.cyan },
  avatarText: { color: colors.text, fontSize: 12, fontWeight: "900" },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: "absolute",
    right: -1,
    bottom: 0,
    borderWidth: 1.5,
    borderColor: "#080F1E",
  },
  online: { backgroundColor: colors.green },
  offline: { backgroundColor: colors.red },
  meta: { flex: 1, minWidth: 0 },
  name: { color: colors.text, fontSize: 10.5, fontWeight: "900" },
  stats: { color: colors.muted, fontSize: 8.5, marginTop: 2 },
  turn: {
    position: "absolute",
    top: -8,
    right: 8,
    color: "#08101E",
    backgroundColor: colors.gold,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 3,
    fontSize: 7.5,
    fontWeight: "900",
  },
  openPileWrap: {
    position: "absolute",
    right: -2,
    top: 39,
    alignItems: "center",
  },
  countBadge: {
    marginTop: 2,
    minWidth: 20,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: colors.surface2,
    alignItems: "center",
  },
  countText: { color: colors.text, fontSize: 8, fontWeight: "900" },
});
