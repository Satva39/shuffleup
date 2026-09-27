import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radii } from "../../../theme";
import { GamePanelMotion } from "../../../components/GameMotion";

export default function BluffResultModal({
  result,
  winner,
  localPlayerId,
  visible = false,
  onClose,
}) {
  if (!visible || !result) return null;
  const won = winner?.id === localPlayerId;
  return (
    <View style={styles.overlay}>
      <GamePanelMotion
        motionKey="bluff-challenge-result"
        style={{ flex: 0, width: "100%" }}
      >
        <View style={styles.modal}>
          <Text style={styles.eyebrow}>CHALLENGE RESULT</Text>
          <Text
            style={[
              styles.result,
              result.result === "BLUFF" ? styles.bluff : styles.truth,
            ]}
          >
            {result.result}
          </Text>
          <Text style={styles.summary}>
            {result.challengerUsername} challenged {result.claimantUsername}
          </Text>
          <View style={styles.cardsRow}>
            {(result.revealedCards || []).map((card) => (
              <View key={card.id} style={styles.revealedCard}>
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 14,
                    fontWeight: "900",
                  }}
                >
                  {card.rank}
                </Text>
                <Text
                  style={{
                    color: card.color === "red" ? colors.red : colors.text,
                    fontSize: 18,
                  }}
                >
                  {card.symbol}
                </Text>
              </View>
            ))}
          </View>
          <Text style={styles.penalty}>
            {result.penaltyRecipientId === localPlayerId
              ? "You take the pile."
              : `${result.penaltyRecipientUsername} takes the pile.`}
          </Text>
          {winner ? (
            <Text style={styles.winnerText}>
              {won ? "YOU WIN" : `${winner.username} WINS`}
            </Text>
          ) : null}
          <Pressable onPress={onClose} style={styles.button}>
            <Text style={styles.buttonText}>CONTINUE</Text>
          </Pressable>
        </View>
      </GamePanelMotion>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(2,5,14,0.78)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modal: {
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 22,
  },
  eyebrow: {
    color: colors.cyan,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.6,
  },
  result: { fontSize: 38, fontWeight: "900", marginTop: 6 },
  bluff: { color: colors.red },
  truth: { color: colors.green },
  summary: { color: colors.text, fontSize: 14, lineHeight: 20, marginTop: 8 },
  cardsRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 16 },
  revealedCard: {
    width: 52,
    height: 66,
    marginRight: 7,
    marginBottom: 7,
    borderRadius: 11,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  penalty: { color: colors.muted, fontSize: 12, marginTop: 10 },
  winnerText: {
    color: colors.gold,
    fontSize: 20,
    fontWeight: "900",
    marginTop: 14,
  },
  button: {
    marginTop: 18,
    minHeight: 50,
    borderRadius: radii.md,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { color: colors.text, fontWeight: "900", letterSpacing: 0.5 },
});
