import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radii } from "../../../theme";
import { teamName } from "../utils/cards";
import { GamePanelMotion } from "../../../components/GameMotion";

function HandResultPanelContent({ gameState, onContinue }) {
  const result = gameState?.handResult;
  return (
    <SafeAreaView
      style={styles.overlay}
      edges={["top", "left", "right", "bottom"]}
    >
      <View style={styles.panel}>
        <View style={styles.icon}>
          <Ionicons name="trophy" size={28} color={colors.gold} />
        </View>
        <Text style={styles.kicker}>
          {result?.coat ? "COAT / MINDI" : "HAND COMPLETE"}
        </Text>
        <Text style={styles.title}>
          {result?.winnerTeam ? teamName(result.winnerTeam) : "Hand settled"}
        </Text>
        <Text style={styles.sub}>
          {result?.coat
            ? "The server confirmed a Coat for this hand."
            : "The server has finalized the hand."}
        </Text>
        <View style={styles.grid}>
          <Stat
            label="TEAM A"
            value={result?.tens?.A ?? 0}
            suffix="key cards"
          />
          <Stat
            label="TEAM B"
            value={result?.tens?.B ?? 0}
            suffix="key cards"
          />
          <Stat label="SCORE A" value={result?.scores?.A ?? 0} />
          <Stat label="SCORE B" value={result?.scores?.B ?? 0} />
        </View>
        {result?.coat ? (
          <View style={styles.coatBanner}>
            <Ionicons name="sparkles" size={16} color={colors.gold} />
            <Text style={styles.coatText}>COAT CONFIRMED BY SERVER</Text>
          </View>
        ) : null}
        {gameState?.canStartNextHand ? (
          <Pressable
            onPress={onContinue}
            style={({ pressed }) => [styles.button, pressed && styles.pressed]}
          >
            <Text style={styles.buttonText}>NEXT HAND</Text>
            <Ionicons name="arrow-forward" size={17} color="#08101E" />
          </Pressable>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

function GameResultPanelContent({ gameState, onLobby }) {
  return (
    <SafeAreaView
      style={styles.overlay}
      edges={["top", "left", "right", "bottom"]}
    >
      <View style={styles.panel}>
        <View style={[styles.icon, styles.winnerIcon]}>
          <Ionicons name="medal" size={30} color={colors.gold} />
        </View>
        <Text style={styles.kicker}>GAME COMPLETE</Text>
        <Text style={styles.title}>{teamName(gameState?.winnerTeam)} wins</Text>
        <Text style={styles.sub}>
          Final server-controlled partnership score.
        </Text>
        <View style={styles.grid}>
          <Stat label="TEAM A" value={gameState?.scores?.A ?? 0} />
          <Stat label="TEAM B" value={gameState?.scores?.B ?? 0} />
        </View>
        <Pressable
          onPress={onLobby}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
          <Text style={styles.buttonText}>RETURN TO LOBBY</Text>
          <Ionicons name="arrow-back" size={17} color="#08101E" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

export function HandResultPanel(props) {
  return (
    <GamePanelMotion motionKey="mindi-hand-result">
      <HandResultPanelContent {...props} />
    </GamePanelMotion>
  );
}

export function GameResultPanel(props) {
  return (
    <GamePanelMotion motionKey="mindi-game-result">
      <GameResultPanelContent {...props} />
    </GamePanelMotion>
  );
}

function Stat({ label, value, suffix }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      {suffix ? <Text style={styles.statSuffix}>{suffix}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: 16,
    justifyContent: "center",
  },
  panel: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  icon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignSelf: "center",
    backgroundColor: "rgba(247,198,93,0.10)",
    borderWidth: 1,
    borderColor: "rgba(247,198,93,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  winnerIcon: {
    backgroundColor: "rgba(124,92,255,0.12)",
    borderColor: "rgba(124,92,255,0.28)",
  },
  kicker: {
    color: colors.gold,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
    textAlign: "center",
    marginTop: 13,
  },
  title: {
    color: colors.text,
    fontSize: 27,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 4,
  },
  sub: {
    color: colors.muted,
    textAlign: "center",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 5,
  },
  grid: { marginTop: 15, flexDirection: "row", flexWrap: "wrap", gap: 8 },
  stat: {
    width: "48.7%",
    minHeight: 68,
    borderRadius: 14,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
  },
  statLabel: {
    color: colors.muted,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
  },
  statValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900",
    marginTop: 3,
  },
  statSuffix: { color: colors.muted, fontSize: 8.5, marginTop: 1 },
  coatBanner: {
    marginTop: 10,
    minHeight: 38,
    borderRadius: 12,
    backgroundColor: "rgba(247,198,93,0.08)",
    borderWidth: 1,
    borderColor: "rgba(247,198,93,0.2)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  coatText: {
    color: colors.gold,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.7,
  },
  button: {
    minHeight: 52,
    marginTop: 13,
    borderRadius: 15,
    backgroundColor: colors.gold,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  buttonText: {
    color: "#08101E",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  pressed: { opacity: 0.84 },
});
