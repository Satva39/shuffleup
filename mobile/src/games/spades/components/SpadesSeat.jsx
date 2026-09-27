import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../../theme";
import { GameSeatMotion, seatMotionKey } from "../../../components/GameMotion";

const SEATS = { N: "North", E: "East", S: "South", W: "West" };

function bidText(bid) {
  return bid === null || bid === undefined ? "—" : String(bid);
}

function SpadesSeatContent({ player, viewerId, active = false }) {
  if (!player) return null;

  const isYou = player.id === viewerId;
  const team =
    player.team === "A"
      ? "Team A · N/S"
      : player.team === "B"
        ? "Team B · E/W"
        : "Team";

  return (
    <View style={[styles.card, isYou && styles.you, active && styles.active]}>
      <View style={styles.identity}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {isYou ? "YOU" : player.username?.slice(0, 1)?.toUpperCase() || "S"}
          </Text>
        </View>
        <View style={styles.nameBox}>
          <Text numberOfLines={1} style={styles.name}>
            {isYou ? "You" : player.username || "Player"}
          </Text>
          <Text numberOfLines={1} style={styles.meta}>
            {SEATS[player.seat] || player.seat} · {team}
          </Text>
        </View>
        <View
          style={[
            styles.statusDot,
            {
              backgroundColor:
                player.connected === false ? colors.red : colors.green,
            },
          ]}
        />
      </View>
      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>BID</Text>
          <Text style={styles.statValue}>{bidText(player.bid)}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>TRICKS</Text>
          <Text style={styles.statValue}>{player.tricksWon ?? 0}</Text>
        </View>
        {!isYou ? (
          <View style={styles.stat}>
            <Text style={styles.statLabel}>CARDS</Text>
            <Text style={styles.statValue}>{player.cardCount ?? 0}</Text>
          </View>
        ) : null}
      </View>
      {player.connected === false ? (
        <Text style={styles.disconnected}>Disconnected</Text>
      ) : null}
    </View>
  );
}

export default function SpadesSeat(props) {
  const active = Boolean(
    props.active || props.isCurrentTurn || props.isTurn || props.current,
  );

  return (
    <GameSeatMotion motionKey={seatMotionKey(props)} active={active}>
      <SpadesSeatContent {...props} />
    </GameSeatMotion>
  );
}

const styles = StyleSheet.create({
  card: {
    minWidth: 0,
    padding: 9,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  you: {
    borderColor: colors.cyan,
    backgroundColor: "rgba(53,216,255,0.06)",
  },
  active: {
    borderColor: colors.gold,
    shadowColor: colors.gold,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  identity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#10364E",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: colors.cyan,
    fontSize: 8,
    fontWeight: "900",
  },
  nameBox: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    color: colors.text,
    fontSize: 11,
    fontWeight: "900",
  },
  meta: {
    color: colors.muted,
    fontSize: 7.2,
    fontWeight: "700",
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stats: {
    flexDirection: "row",
    gap: 5,
    marginTop: 7,
  },
  stat: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 5,
    paddingHorizontal: 5,
    borderRadius: 9,
    backgroundColor: colors.surface2,
  },
  statLabel: {
    color: colors.muted,
    fontSize: 6,
    fontWeight: "900",
    letterSpacing: 0.7,
  },
  statValue: {
    color: colors.text,
    fontSize: 11,
    fontWeight: "900",
    marginTop: 1,
  },
  disconnected: {
    color: colors.red,
    fontSize: 7,
    fontWeight: "900",
    marginTop: 5,
  },
});
