import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radii } from "../../../theme";
import { useAuth } from "../../../context/AuthStore";
import useKachufulSocket from "../hooks/useKachufulSocket";
import { getPlayableCardIds, suitSymbol } from "../utils/rules";
import KachufulCard from "../components/KachufulCard";
import TrickArea from "../components/TrickArea";
import BidPanel from "../components/BidPanel";
import ScoreStrip from "../components/ScoreStrip";
import { GameResultPanel, RoundCompletePanel } from "../components/ResultPanel";

export default function KachufulGameScreen({ route, navigation }) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const landscape = width > height;
  const roomCode = route.params?.roomCode;
  const [selectedBid, setSelectedBid] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [showScores, setShowScores] = useState(false);

  const {
    gameState,
    error,
    connection,
    connected,
    reconnecting,
    submitBid,
    playCard,
    nextRound,
  } = useKachufulSocket(roomCode, user?.id);

  useEffect(() => {
    setSelectedCard(null);
    if (gameState?.yourBid !== null && gameState?.yourBid !== undefined) {
      setSelectedBid(gameState.yourBid);
    } else if (gameState?.status !== "bidding") {
      setSelectedBid(null);
    }
  }, [gameState?.yourBid, gameState?.status, gameState?.round]);

  const players = gameState?.players || [];
  const currentPlayer = players.find(
    (player) => player.id === gameState?.currentPlayerId,
  );
  const isYourTurn = gameState?.currentPlayerId === user?.id;
  const playableIds = useMemo(
    () =>
      gameState?.status === "playing" && isYourTurn
        ? getPlayableCardIds(
            gameState?.yourCards || [],
            gameState?.currentTrick || [],
          )
        : new Set(),
    [
      gameState?.status,
      gameState?.yourCards,
      gameState?.currentTrick,
      isYourTurn,
    ],
  );

  function onCardPress(card) {
    if (
      !isYourTurn ||
      gameState?.status !== "playing" ||
      !playableIds.has(card.id)
    ) {
      return;
    }
    setSelectedCard((current) => (current === card.id ? null : card.id));
  }

  function confirmSelectedCard() {
    if (!selectedCard || !playableIds.has(selectedCard)) return;
    playCard(selectedCard);
    setSelectedCard(null);
  }

  function handleContinue() {
    setSelectedBid(null);
    setSelectedCard(null);
    nextRound();
  }

  if (!gameState) {
    return (
      <View style={styles.loadingRoot}>
        <View style={styles.loadingLogo}>
          <Text style={styles.loadingLogoText}>SU</Text>
        </View>
        <Text style={styles.loadingKicker}>SHUFFLEUP · KACHUFUL</Text>
        <Text style={styles.loadingTitle}>
          {reconnecting ? "RESTORING YOUR SEAT" : "JOINING THE LIVE TABLE"}
        </Text>
        <Text style={styles.loadingSub}>
          {reconnecting
            ? "Reconnecting and restoring server state…"
            : "Preparing your cards and table…"}
        </Text>
        <ActivityIndicator
          color={colors.cyan}
          size="small"
          style={{ marginTop: 18 }}
        />
      </View>
    );
  }

  if (gameState.status === "game-complete") {
    return (
      <GameResultPanel
        gameState={gameState}
        onLobby={() => navigation.navigate("Main", { screen: "Lobby" })}
      />
    );
  }

  const statusText =
    connection === "connected"
      ? "LIVE"
      : connection === "reconnecting"
        ? "RECONNECTING"
        : connection === "connecting"
          ? "CONNECTING"
          : "OFFLINE";
  const statusColor =
    connection === "connected"
      ? colors.green
      : connection === "error" || connection === "offline"
        ? colors.red
        : colors.gold;

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={["#091228", "#06101A", "#07101B"]}
        style={StyleSheet.absoluteFillObject}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingBottom: Math.max(insets.bottom, 12) + 12,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <View style={styles.brandBlock}>
            <View style={styles.brandIcon}>
              <Text style={styles.brandIconText}>SU</Text>
            </View>
            <View>
              <Text style={styles.eyebrow}>SHUFFLEUP</Text>
              <Text style={styles.gameTitle}>Kachuful</Text>
            </View>
          </View>
          <View style={styles.topMeta}>
            <View style={styles.roomPill}>
              <Text style={styles.roomLabel}>ROOM</Text>
              <Text style={styles.roomCode}>
                {String(roomCode || gameState.roomCode || "").toUpperCase()}
              </Text>
            </View>
            <View style={styles.livePill}>
              <View
                style={[styles.liveDot, { backgroundColor: statusColor }]}
              />
              <Text style={[styles.liveText, { color: statusColor }]}>
                {statusText}
              </Text>
            </View>
          </View>
        </View>

        {!connected ? (
          <View style={styles.reconnectBanner}>
            <ActivityIndicator size="small" color={statusColor} />
            <Text style={styles.reconnectText}>
              {connection === "error"
                ? "Connection error. Retrying…"
                : "Reconnecting to the live table…"}
            </Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorBanner}>
            <Ionicons name="warning" size={16} color={colors.red} />
            <View style={{ flex: 1 }}>
              <Text style={styles.errorTitle}>Action unavailable</Text>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.overviewRow}>
          <View style={styles.infoCard}>
            <Text style={styles.cardKicker}>ROUND</Text>
            <Text style={styles.infoValue}>
              {gameState.round}/{gameState.totalRounds}
            </Text>
            <Text style={styles.infoSub}>
              {gameState.cardsPerPlayer} cards each
            </Text>
          </View>
          <View style={[styles.infoCard, isYourTurn && styles.yourTurnCard]}>
            <Text style={styles.cardKicker}>TURN</Text>
            <Text numberOfLines={1} style={styles.infoValue}>
              {isYourTurn ? "YOUR TURN" : currentPlayer?.username || "WAITING"}
            </Text>
            <Text style={styles.infoSub}>
              {isYourTurn ? "Choose an action" : "Live server turn"}
            </Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.cardKicker}>TRUMP</Text>
            <Text style={[styles.infoValue, { color: colors.gold }]}>
              {suitSymbol(gameState.trump?.suit)}{" "}
              {gameState.trump?.english || "—"}
            </Text>
            <Text style={styles.infoSub}>
              {gameState.trump?.kachuful || ""}
            </Text>
          </View>
        </View>

        <ScoreStrip
          players={players}
          userId={user?.id}
          bidsRevealed={gameState.bidsRevealed}
        />

        <View
          style={[styles.tableWrap, landscape && styles.tableWrapLandscape]}
        >
          <LinearGradient
            colors={["#0B493A", "#0A382D", "#08271F"]}
            style={styles.table}
          >
            <View style={styles.tableOuter} />
            <View style={styles.tableInner} />
            <View style={styles.tableCenter}>
              <TrickArea
                trick={gameState.currentTrick}
                lastCompletedTrick={gameState.lastCompletedTrick}
              />
            </View>
            <View style={styles.tableCaption}>
              <Text style={styles.captionSuit}>♠</Text>
              <Text style={styles.captionText}>KACHUFUL</Text>
              <Text style={styles.captionSuit}>♥</Text>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.handPanel}>
          <View style={styles.handHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardKicker}>YOUR HAND</Text>
              <Text style={styles.handTitle}>
                {gameState.yourCards?.length || 0} cards ·{" "}
                {isYourTurn
                  ? "Your turn"
                  : `Waiting for ${currentPlayer?.username || "player"}`}
              </Text>
            </View>
            <Pressable
              onPress={() => setShowScores((value) => !value)}
              style={styles.scoreToggle}
            >
              <Ionicons name="stats-chart" size={14} color={colors.cyan} />
              <Text style={styles.scoreToggleText}>
                {showScores ? "Hide" : "Scores"}
              </Text>
            </Pressable>
          </View>

          {showScores ? (
            <ScoreStrip
              players={players}
              userId={user?.id}
              bidsRevealed={gameState.bidsRevealed}
            />
          ) : null}

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            persistentScrollbar={false}
            contentContainerStyle={styles.hand}
          >
            {(gameState.yourCards || []).map((card) => (
              <KachufulCard
                key={card.id}
                card={card}
                playable={playableIds.has(card.id)}
                selected={selectedCard === card.id}
                onPress={() => onCardPress(card)}
              />
            ))}
          </ScrollView>

          {gameState.status === "playing" && isYourTurn ? (
            <Pressable
              onPress={confirmSelectedCard}
              disabled={!selectedCard || !playableIds.has(selectedCard)}
              style={({ pressed }) => [
                styles.playButton,
                (!selectedCard || !playableIds.has(selectedCard)) &&
                  styles.playButtonDisabled,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons name="play" size={17} color="#08101E" />
              <Text style={styles.playButtonText}>
                {selectedCard ? "PLAY SELECTED CARD" : "SELECT A PLAYABLE CARD"}
              </Text>
            </Pressable>
          ) : null}
        </View>

        {gameState.status === "bidding" ? (
          <BidPanel
            maxBid={gameState.cardsPerPlayer}
            selectedBid={selectedBid}
            submitted={
              gameState.yourBid !== null && gameState.yourBid !== undefined
            }
            myTurn={true}
            onSelect={setSelectedBid}
            onConfirm={() => selectedBid !== null && submitBid(selectedBid)}
          />
        ) : null}

        {gameState.status === "round-complete" ? (
          <RoundCompletePanel
            gameState={gameState}
            isLastRound={gameState.round >= gameState.totalRounds}
            onContinue={handleContinue}
          />
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  loadingRoot: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
  },
  loadingLogo: {
    width: 66,
    height: 66,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingLogoText: { color: colors.white, fontSize: 20, fontWeight: "900" },
  loadingKicker: {
    color: colors.cyan,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginTop: 18,
  },
  loadingTitle: {
    color: colors.text,
    fontSize: 23,
    fontWeight: "900",
    marginTop: 6,
    textAlign: "center",
  },
  loadingSub: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 7,
    maxWidth: 300,
  },
  topBar: {
    paddingHorizontal: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  brandBlock: { flexDirection: "row", alignItems: "center", gap: 9, flex: 1 },
  brandIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  brandIconText: { color: colors.white, fontSize: 12, fontWeight: "900" },
  eyebrow: {
    color: colors.muted,
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 1.3,
  },
  gameTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: "900",
    marginTop: 1,
  },
  topMeta: { alignItems: "flex-end", gap: 5 },
  roomPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  roomLabel: { color: colors.muted, fontSize: 8, fontWeight: "900" },
  roomCode: {
    color: colors.text,
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  livePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingRight: 2,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4 },
  liveText: { fontSize: 8.5, fontWeight: "900", letterSpacing: 0.8 },
  reconnectBanner: {
    marginHorizontal: 14,
    marginTop: 10,
    backgroundColor: "rgba(247,198,93,0.10)",
    borderColor: "rgba(247,198,93,0.22)",
    borderWidth: 1,
    borderRadius: 13,
    paddingHorizontal: 11,
    paddingVertical: 9,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  reconnectText: {
    color: colors.gold,
    fontSize: 10.5,
    fontWeight: "800",
    flex: 1,
  },
  errorBanner: {
    marginHorizontal: 14,
    marginTop: 10,
    backgroundColor: "rgba(255,107,122,0.08)",
    borderColor: "rgba(255,107,122,0.24)",
    borderWidth: 1,
    borderRadius: 13,
    padding: 10,
    flexDirection: "row",
    gap: 8,
  },
  errorTitle: { color: colors.text, fontSize: 10.5, fontWeight: "900" },
  errorText: {
    color: colors.muted,
    fontSize: 10,
    marginTop: 2,
    lineHeight: 15,
  },
  overviewRow: {
    flexDirection: "row",
    gap: 7,
    paddingHorizontal: 14,
    marginTop: 12,
  },
  infoCard: {
    flex: 1,
    minHeight: 72,
    backgroundColor: colors.surface,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 9,
  },
  yourTurnCard: {
    borderColor: colors.gold,
    backgroundColor: "rgba(247,198,93,0.07)",
  },
  cardKicker: {
    color: colors.muted,
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 1.1,
  },
  infoValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "900",
    marginTop: 5,
  },
  infoSub: { color: colors.muted, fontSize: 8.5, marginTop: 2 },
  tableWrap: {
    marginHorizontal: 12,
    marginTop: 12,
    height: 390,
    borderRadius: 32,
    overflow: "hidden",
  },
  tableWrapLandscape: { height: 420 },
  table: {
    flex: 1,
    overflow: "hidden",
    borderRadius: 32,
    borderWidth: 1,
    borderColor: "rgba(53,216,255,0.20)",
    position: "relative",
  },
  tableOuter: {
    position: "absolute",
    left: "5%",
    top: "5%",
    right: "5%",
    bottom: "5%",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(247,198,93,0.20)",
  },
  tableInner: {
    position: "absolute",
    left: "12%",
    top: "11%",
    right: "12%",
    bottom: "11%",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(53,216,255,0.12)",
  },
  tableCenter: {
    position: "absolute",
    left: "8%",
    right: "8%",
    top: "25%",
    bottom: "20%",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  tableCaption: {
    position: "absolute",
    bottom: 7,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  captionSuit: { color: "rgba(247,198,93,0.56)", fontSize: 13 },
  captionText: {
    color: "rgba(247,198,93,0.56)",
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 2.4,
  },
  handPanel: {
    marginHorizontal: 12,
    marginTop: 12,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 13,
  },
  handHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  handTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "900",
    marginTop: 4,
  },
  scoreToggle: {
    minHeight: 36,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  scoreToggleText: { color: colors.cyan, fontSize: 9.5, fontWeight: "900" },
  hand: {
    minHeight: 126,
    paddingTop: 10,
    paddingBottom: 6,
    paddingHorizontal: 4,
    minWidth: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  playButton: {
    minHeight: 52,
    marginTop: 7,
    borderRadius: 15,
    backgroundColor: colors.gold,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  playButtonDisabled: { opacity: 0.42 },
  playButtonText: {
    color: "#08101E",
    fontSize: 11.5,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  pressed: { opacity: 0.84 },
});
