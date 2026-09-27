import { StyleSheet, Text, View } from "react-native";
import { colors, radii } from "../../../theme";
import TeenPattiCard from "./TeenPattiCard";
import { GameSeatMotion, seatMotionKey } from "../../../components/GameMotion";

function TeenPattiSeatContent({ player, isLocal, isTurn }) {
  if (!player) return null;

  const disconnected = !player.connected || player.status === "disconnected";
  const folded = player.status === "folded";
  const winner = player.status === "winner";

  return (
    <View
      style={[
        styles.wrap,
        isTurn && styles.turn,
        isLocal && styles.local,
        disconnected && styles.disconnected,
        folded && styles.folded,
        winner && styles.winner,
      ]}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {String(player.username || "?")
            .slice(0, 1)
            .toUpperCase()}
        </Text>
      </View>
      <View style={styles.meta}>
        <Text numberOfLines={1} style={styles.name}>
          {isLocal ? "YOU" : player.username}
        </Text>
        <Text style={[styles.status, isTurn && styles.turnText]}>
          {winner
            ? "WINNER"
            : disconnected
              ? "DISCONNECTED"
              : folded
                ? "FOLDED"
                : isTurn
                  ? "YOUR TURN"
                  : `${player.cardCount || 0} CARDS`}
        </Text>
      </View>
      {!isLocal && !folded && player.cardCount > 0 ? (
        <View style={styles.miniCards}>
          {Array.from({ length: Math.min(player.cardCount, 3) }).map(
            (_, index) => (
              <View key={index} style={{ marginLeft: index ? -17 : 0 }}>
                <TeenPattiCard hidden compact />
              </View>
            ),
          )}
        </View>
      ) : null}
    </View>
  );
}

export default function TeenPattiSeat(props) {
  const active = Boolean(
    props.active || props.isCurrentTurn || props.isTurn || props.current,
  );

  return (
    <GameSeatMotion motionKey={seatMotionKey(props)} active={active}>
      <TeenPattiSeatContent {...props} />
    </GameSeatMotion>
  );
}

const styles = StyleSheet.create({
  wrap: {
    minWidth: 104,
    maxWidth: 136,
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: "rgba(154,167,194,0.18)",
    backgroundColor: "rgba(10,18,34,0.92)",
    flexDirection: "row",
    alignItems: "center",
  },
  turn: {
    borderColor: colors.gold,
    backgroundColor: "transparent",
    shadowColor: colors.gold,
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 5,
  },
  local: { borderColor: colors.cyan },
  disconnected: { opacity: 0.55 },
  folded: { opacity: 0.5 },
  winner: { borderColor: colors.green },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(53,216,255,0.13)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.cyan, fontSize: 10, fontWeight: "900" },
  meta: { flex: 1, flexShrink: 1, minWidth: 0, marginLeft: 7 },
  name: { color: colors.text, fontSize: 10.5, fontWeight: "900" },
  status: {
    color: colors.muted,
    fontSize: 7.5,
    fontWeight: "900",
    marginTop: 2,
  },
  turnText: { color: colors.gold },
  miniCards: {
    flexDirection: "row",
    marginLeft: 3,
    flexShrink: 0,
    backgroundColor: "transparent",
    maxWidth: 78,
    overflow: "visible",
  },
});
