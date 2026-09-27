import { StyleSheet, Text, View } from "react-native";
import { colors, radii } from "../../../theme";
import WarCard, { WarCardBack } from "./WarCard";

export default function WarBattleArea({ state, viewerId }) {
  const isWar = state.phase === "war" || state.phase === "war-reveal";
  const revealed = Array.isArray(state.revealedCards)
    ? state.revealedCards
    : [];
  const faceDownCount = Number(state.faceDownCount || 0);
  const result = state.result;

  return (
    <View style={[styles.root, isWar && styles.warRoot]}>
      <View style={styles.headingRow}>
        <View>
          <Text style={styles.eyebrow}>
            {isWar ? "WAR BATTLE" : `BATTLE ${state.battleCount || 1}`}
          </Text>
          <Text style={styles.title}>
            {isWar ? `War ${state.warDepth || 1}` : "Card reveal"}
          </Text>
        </View>
        <View style={styles.pilePill}>
          <Text style={styles.pilePillText}>
            {state.battlePileCount || revealed.length} IN BATTLE
          </Text>
        </View>
      </View>

      <View style={styles.cardsRow}>
        {(state.players || []).map((player) => {
          const entry = revealed.find((item) => item.playerId === player.id);
          const isTie = (state.tiedPlayerIds || []).includes(player.id);
          const isYou = player.id === viewerId;
          return (
            <View key={player.id} style={styles.cardSlot}>
              <Text
                numberOfLines={1}
                style={[styles.playerLabel, isYou && styles.youLabel]}
              >
                {isYou ? "YOU" : player.username}
              </Text>
              <View style={[styles.cardWrap, isTie && styles.tieCard]}>
                {entry?.card ? (
                  <WarCard card={entry.card} featured />
                ) : (
                  <WarCardBack featured />
                )}
              </View>
              {isTie ? <Text style={styles.tieText}>TIED</Text> : null}
            </View>
          );
        })}
      </View>

      {faceDownCount > 0 ? (
        <View style={styles.warNote}>
          <WarCardBack small />
          <View style={{ flex: 1 }}>
            <Text style={styles.warNoteTitle}>
              {faceDownCount} face-down card{faceDownCount === 1 ? "" : "s"}
            </Text>
            <Text style={styles.warNoteText}>
              War cards are being prepared for the next reveal.
            </Text>
          </View>
        </View>
      ) : null}

      {result?.winnerName ? (
        <View style={styles.resultBanner}>
          <Text style={styles.resultEyebrow}>BATTLE RESULT</Text>
          <Text style={styles.resultTitle}>
            {result.winnerId === viewerId
              ? "YOU WIN THE BATTLE"
              : `${result.winnerName.toUpperCase()} WINS`}
          </Text>
          <Text style={styles.resultText}>
            {result.reason === "opponent-exhausted"
              ? "The opponent could not reveal another card."
              : "The higher card wins the battle."}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: "rgba(4,20,17,0.78)",
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: "#15594D",
    padding: 15,
  },
  warRoot: { borderColor: colors.gold, backgroundColor: "rgba(31,26,8,0.5)" },
  headingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  eyebrow: {
    color: colors.cyan,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.3,
  },
  title: { color: colors.text, fontSize: 20, fontWeight: "900", marginTop: 3 },
  pilePill: {
    backgroundColor: colors.surface2,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
  },
  pilePillText: { color: colors.muted, fontSize: 8, fontWeight: "900" },
  cardsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginTop: 15,
  },
  cardSlot: { flex: 1, maxWidth: 120, alignItems: "center" },
  playerLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "900",
    marginBottom: 7,
  },
  youLabel: { color: colors.cyan },
  cardWrap: {
    padding: 4,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "transparent",
  },
  tieCard: { borderColor: colors.gold },
  tieText: { color: colors.gold, fontSize: 8, fontWeight: "900", marginTop: 6 },
  warNote: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surface2,
    borderRadius: radii.md,
    padding: 10,
  },
  warNoteTitle: { color: colors.gold, fontSize: 11, fontWeight: "900" },
  warNoteText: {
    color: colors.muted,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 2,
  },
  resultBanner: {
    marginTop: 14,
    backgroundColor: "#0E1C31",
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.green,
    padding: 12,
    alignItems: "center",
  },
  resultEyebrow: {
    color: colors.green,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.3,
  },
  resultTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
    marginTop: 4,
    textAlign: "center",
  },
  resultText: {
    color: colors.muted,
    fontSize: 10,
    marginTop: 3,
    textAlign: "center",
  },
});
