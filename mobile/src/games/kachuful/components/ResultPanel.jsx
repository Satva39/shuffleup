import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, radii } from "../../../theme";
import { GamePanelMotion } from "../../../components/GameMotion";

function RoundCompletePanelContent({ gameState, isLastRound, onContinue }) {
  return (
    <SafeAreaView
      style={styles.overlay}
      edges={["top", "left", "right", "bottom"]}
    >
      <View style={styles.panel}>
        <View style={styles.icon}>
          <Ionicons name="trophy" size={28} color={colors.gold} />
        </View>
        <Text style={styles.kicker}>ROUND COMPLETE</Text>
        <Text style={styles.title}>Round {gameState.round}</Text>
        <Text style={styles.sub}>
          The server has finalized every trick and score.
        </Text>

        <View style={styles.results}>
          {(gameState.players || []).map((player) => (
            <View key={player.id} style={styles.row}>
              <View style={styles.rowMain}>
                <View style={styles.smallAvatar}>
                  <Text style={styles.smallAvatarText}>
                    {String(player.username || "?")
                      .slice(0, 1)
                      .toUpperCase()}
                  </Text>
                </View>
                <Text numberOfLines={1} style={styles.rowName}>
                  {player.username}
                </Text>
              </View>
              <Text style={styles.rowMeta}>
                {player.bid ?? "—"} bid · {player.tricksWon ?? 0} won
              </Text>
              <Text style={styles.rowScore}>
                {player.roundScore > 0 ? `+${player.roundScore}` : "0"}
              </Text>
            </View>
          ))}
        </View>

        <Pressable
          onPress={onContinue}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
          <Text style={styles.buttonText}>
            {isLastRound ? "FINISH GAME" : "NEXT ROUND"}
          </Text>
          <Ionicons
            name={isLastRound ? "flag" : "arrow-forward"}
            size={17}
            color="#08101E"
          />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function GameResultPanelContent({ gameState, onLobby }) {
  const winnerId = gameState?.winner?.id;

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
        <Text style={styles.title}>
          {gameState?.winner?.username || "Winner"} wins
        </Text>
        <Text style={styles.sub}>Final server-controlled standings.</Text>

        <View style={styles.results}>
          {[...(gameState.players || [])]
            .sort((a, b) => (b.score || 0) - (a.score || 0))
            .map((player, index) => (
              <View
                key={player.id}
                style={[styles.row, player.id === winnerId && styles.winnerRow]}
              >
                <View style={styles.rowMain}>
                  <Text style={styles.rank}>{index + 1}</Text>
                  <Text numberOfLines={1} style={styles.rowName}>
                    {player.username}
                  </Text>
                </View>
                <Text style={styles.rowMeta}>
                  {player.tricksWon ?? 0} final tricks
                </Text>
                <Text style={styles.rowScore}>{player.score ?? 0}</Text>
              </View>
            ))}
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

export function RoundCompletePanel(props) {
  return (
    <GamePanelMotion motionKey="kachuful-round-result">
      <RoundCompletePanelContent {...props} />
    </GamePanelMotion>
  );
}

export function GameResultPanel(props) {
  return (
    <GamePanelMotion motionKey="kachuful-game-result">
      <GameResultPanelContent {...props} />
    </GamePanelMotion>
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
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    maxHeight: "92%",
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
    letterSpacing: 1.3,
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
  results: { marginTop: 15, gap: 7 },
  row: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 9,
    gap: 8,
  },
  winnerRow: {
    borderColor: colors.gold,
    backgroundColor: "rgba(247,198,93,0.08)",
  },
  rowMain: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  smallAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(53,216,255,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  smallAvatarText: { color: colors.cyan, fontSize: 10, fontWeight: "900" },
  rowName: {
    color: colors.text,
    fontSize: 11,
    fontWeight: "900",
    flexShrink: 1,
  },
  rowMeta: {
    color: colors.muted,
    fontSize: 8.5,
    maxWidth: 92,
    textAlign: "right",
  },
  rowScore: {
    color: colors.gold,
    minWidth: 32,
    textAlign: "right",
    fontSize: 15,
    fontWeight: "900",
  },
  rank: {
    color: colors.muted,
    width: 20,
    fontSize: 11,
    fontWeight: "900",
    textAlign: "center",
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
