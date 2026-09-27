import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radii } from "../../../theme";
import UnoCard from "./UnoCard";
import { GameSeatMotion, seatMotionKey } from "../../../components/GameMotion";
import { isBotPlayer } from "../../../utils/player";

function UnoSeatContent({ player, local, active, onCallUno }) {
  const canCall =
    !local && player.cardCount === 1 && !player.unoDeclared && onCallUno;

  return (
    <View
      style={[
        styles.seat,
        active && styles.activeSeat,
        !player.connected && styles.offlineSeat,
      ]}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {player.username?.charAt(0)?.toUpperCase() || "?"}
        </Text>
      </View>
      <View style={styles.copy}>
        <View style={styles.nameRow}>
          <Text numberOfLines={1} style={styles.name}>
            {player.username}
          </Text>
          {!local && isBotPlayer(player) ? (
            <Text style={styles.bot}>BOT</Text>
          ) : null}
          {local ? <Text style={styles.you}>YOU</Text> : null}
          {player.unoDeclared && player.cardCount === 1 ? (
            <Text style={styles.uno}>UNO</Text>
          ) : null}
        </View>
        <Text style={styles.meta}>
          {player.cardCount} cards · {player.score} pts
        </Text>
        {active ? (
          <Text style={styles.turn}>{local ? "YOUR TURN" : "TURN"}</Text>
        ) : null}
        {!player.connected ? <Text style={styles.offline}>OFFLINE</Text> : null}
      </View>
      <View style={styles.stackWrap}>
        <View style={styles.stack}>
          {Array.from({ length: Math.min(player.cardCount, 3) }).map(
            (_, index) => (
              <View key={index} style={[styles.stackCard, { left: index * 7 }]}>
                <UnoCard small faceDown />
              </View>
            ),
          )}
        </View>
      </View>
      {canCall ? (
        <Pressable
          onPress={() => onCallUno(player.id)}
          style={styles.callButton}
        >
          <Text style={styles.callText}>CALL UNO</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export default function UnoSeat(props) {
  const active = Boolean(
    props.active || props.isCurrentTurn || props.isTurn || props.current,
  );

  return (
    <GameSeatMotion motionKey={seatMotionKey(props)} active={active}>
      <UnoSeatContent {...props} />
    </GameSeatMotion>
  );
}

const styles = StyleSheet.create({
  seat: {
    minWidth: 168,
    maxWidth: 190,
    minHeight: 88,
    padding: 12,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "rgba(13,20,38,0.92)",
    flexDirection: "row",
    alignItems: "center",
  },
  activeSeat: {
    borderColor: colors.gold,
    backgroundColor: "rgba(247,198,93,0.12)",
  },
  offlineSeat: {
    opacity: 0.62,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "#18334A",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  avatarText: {
    color: colors.cyan,
    fontSize: 14,
    fontWeight: "900",
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  name: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "900",
    flexShrink: 1,
  },
  bot: {
    color: colors.primary,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  you: {
    color: colors.cyan,
    fontSize: 9,
    fontWeight: "900",
  },
  uno: {
    color: colors.gold,
    fontSize: 9,
    fontWeight: "900",
  },
  meta: {
    color: colors.muted,
    fontSize: 10,
    marginTop: 4,
  },
  turn: {
    color: colors.gold,
    fontSize: 10,
    fontWeight: "900",
    marginTop: 4,
  },
  offline: {
    color: colors.red,
    fontSize: 10,
    fontWeight: "900",
    marginTop: 4,
  },
  stackWrap: {
    width: 58,
    height: 60,
    marginLeft: 5,
    justifyContent: "center",
  },
  stack: {
    width: 58,
    height: 46,
    position: "relative",
  },
  stackCard: {
    position: "absolute",
    top: 0,
  },
  callButton: {
    position: "absolute",
    right: 8,
    bottom: 7,
    minHeight: 26,
    paddingHorizontal: 8,
    borderRadius: 9,
    backgroundColor: colors.red,
    justifyContent: "center",
  },
  callText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: "900",
  },
});
