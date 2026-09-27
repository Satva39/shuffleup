import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../../theme";
import { GamePanelMotion } from "../../../components/GameMotion";

function BridgeResultPanelContent({ state, canContinue, onNextDeal, onLobby }) {
  const result = state.result;
  return (
    <SafeAreaView
      style={styles.root}
      edges={["top", "bottom", "left", "right"]}
    >
      <View style={styles.panel}>
        <View style={styles.icon}>
          <Ionicons
            name={result?.passedOut ? "pause-circle" : "trophy"}
            size={29}
            color={colors.gold}
          />
        </View>
        <Text style={styles.kicker}>DEAL COMPLETE</Text>
        <Text style={styles.title}>
          {result?.passedOut
            ? "Passed Out"
            : result?.contractLabel || "Contract"}
        </Text>
        <Text style={styles.sub}>
          {result?.passedOut
            ? `No contract was reached on deal ${result?.dealNumber ?? state.dealNumber}.`
            : `${result?.made ? "Made" : "Down"} · ${result?.madeTricks || 0} tricks · required ${result?.requiredTricks || 0}.`}
        </Text>
        {!result?.passedOut && (
          <View style={styles.scoreCard}>
            <Text style={styles.scoreLabel}>DEAL SCORE</Text>
            <Text style={styles.scoreValue}>
              {result?.score > 0 ? `+${result.score}` : (result?.score ?? 0)}
            </Text>
            <Text style={styles.side}>
              NS {result?.nsScore ?? 0} · EW {result?.ewScore ?? 0}
            </Text>
          </View>
        )}
        <Pressable
          disabled={!canContinue}
          onPress={onNextDeal}
          style={[styles.primary, !canContinue && styles.disabled]}
        >
          <Text style={styles.primaryText}>
            {canContinue ? "START NEXT DEAL" : "WAITING FOR DEALER"}
          </Text>
          <Ionicons name="arrow-forward" size={17} color="#08101E" />
        </Pressable>
        <Pressable onPress={onLobby} style={styles.secondary}>
          <Text style={styles.secondaryText}>RETURN TO LOBBY</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

export default function BridgeResultPanel(props) {
  return (
    <GamePanelMotion motionKey="result:BridgeResultPanel">
      <BridgeResultPanelContent {...props} />
    </GamePanelMotion>
  );
}

const styles = StyleSheet.create({
  root: {
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
    padding: 17,
  },
  icon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(247,198,93,0.09)",
  },
  kicker: {
    color: colors.gold,
    textAlign: "center",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginTop: 12,
  },
  title: {
    color: colors.text,
    textAlign: "center",
    fontSize: 27,
    fontWeight: "900",
    marginTop: 4,
  },
  sub: {
    color: colors.muted,
    textAlign: "center",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 6,
  },
  scoreCard: {
    marginTop: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
    padding: 12,
  },
  scoreLabel: {
    color: colors.muted,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
  },
  scoreValue: {
    color: colors.gold,
    fontSize: 25,
    fontWeight: "900",
    marginTop: 2,
  },
  side: { color: colors.text, fontSize: 10, fontWeight: "800", marginTop: 4 },
  primary: {
    minHeight: 52,
    marginTop: 14,
    borderRadius: 15,
    backgroundColor: colors.gold,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  disabled: { opacity: 0.55 },
  primaryText: { color: "#08101E", fontSize: 11, fontWeight: "900" },
  secondary: {
    minHeight: 50,
    marginTop: 9,
    borderRadius: 15,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryText: { color: colors.text, fontSize: 10.5, fontWeight: "900" },
});
