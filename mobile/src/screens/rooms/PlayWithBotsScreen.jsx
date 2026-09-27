import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../../components/Screen";
import AppButton from "../../components/AppButton";
import { colors, radii } from "../../theme";
import { games } from "../../data/games";
import { API_URL } from "../../constants/config";
import { shuffleSocket } from "../../services/socket";
import { useAuth } from "../../context/AuthStore";

const SOLITAIRE_ID = "solitaire";

const GAME_SCREENS = Object.freeze({
  kachuful: "KachufulGame",
  "teen-patti": "TeenPattiGame",
  "indian-rummy": "IndianRummyGame",
  mangoose: "MangooseGame",
  uno: "UnoGame",
  "jack-thief": "JackThiefGame",
  napoleon: "NapoleonGame",
  bridge: "BridgeGame",
  spades: "SpadesGame",
  "twenty-nine": "TwentyNineGame",
  "mindi-coat": "MindiCoatGame",
  bluff: "BluffGame",
  "satte-pe-satta": "SattePeSattaGame",
  war: "WarGame",
});

function gameMeta(gameId) {
  return games.find((game) => game.id === gameId) || null;
}

export default function PlayWithBotsScreen({ navigation, route }) {
  const { user, token } = useAuth();
  const requestedGameId = route.params?.gameId;
  const [configs, setConfigs] = useState([]);
  const [selectedGame, setSelectedGame] = useState("");
  const [botCount, setBotCount] = useState(1);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadBotGames() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`${API_URL}/api/game-config`);
        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            payload?.message || "Could not load bot game configuration.",
          );
        }

        const supported = Array.isArray(payload?.botGames)
          ? payload.botGames.filter(
              (config) =>
                config?.gameId !== SOLITAIRE_ID &&
                GAME_SCREENS[config?.gameId] &&
                gameMeta(config?.gameId),
            )
          : [];

        if (!active) return;

        setConfigs(supported);

        if (supported.length) {
          const requestedConfig = supported.find(
            (config) => config.gameId === requestedGameId,
          );
          const initialConfig = requestedConfig || supported[0];
          setSelectedGame(initialConfig.gameId);
          setBotCount(initialConfig.minBots);
        } else {
          setError("No bot-supported games are currently available.");
        }
      } catch (loadError) {
        if (!active) return;
        setError(
          loadError?.message || "Could not load bot game configuration.",
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    loadBotGames();

    return () => {
      active = false;
    };
  }, [requestedGameId]);

  const selectedConfig = useMemo(
    () => configs.find((config) => config.gameId === selectedGame) || null,
    [configs, selectedGame],
  );

  const selectedMeta = useMemo(() => gameMeta(selectedGame), [selectedGame]);

  function selectGame(gameId) {
    const config = configs.find((item) => item.gameId === gameId);
    setSelectedGame(gameId);
    setBotCount(config?.minBots ?? 1);
    setError("");
  }

  function changeBotCount(delta) {
    if (!selectedConfig) return;

    setBotCount((current) =>
      Math.min(
        selectedConfig.maxBots,
        Math.max(selectedConfig.minBots, current + delta),
      ),
    );
  }

  async function startBotGame() {
    if (!user) {
      navigation.navigate("Login");
      return;
    }

    if (!selectedConfig) {
      setError("Select a game first.");
      return;
    }

    if (!token) {
      setError("Your session is not available. Please sign in again.");
      return;
    }

    setStarting(true);
    setError("");

    try {
      let socket = shuffleSocket.getSocket();

      if (!shuffleSocket.isConnected()) {
        shuffleSocket.connect(token);
        socket = shuffleSocket.getSocket();

        if (!socket?.connected) {
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(
              () => reject(new Error("Multiplayer connection timed out.")),
              8000,
            );

            const cleanup = () => {
              clearTimeout(timeout);
              socket?.off("connect", onConnect);
              socket?.off("connect_error", onConnectError);
            };

            const onConnect = () => {
              cleanup();
              resolve();
            };

            const onConnectError = () => {
              cleanup();
              reject(new Error("Could not connect to the multiplayer server."));
            };

            socket?.once("connect", onConnect);
            socket?.once("connect_error", onConnectError);
          });
        }
      }

      shuffleSocket.emitSafe(
        "create-bot-game",
        {
          gameId: selectedGame,
          botCount,
        },
        (response) => {
          if (!response?.success || !response.room?.code) {
            setStarting(false);
            setError(response?.message || "Could not start the bot game.");
            return;
          }

          const screen = GAME_SCREENS[response.room.gameId || selectedGame];

          if (!screen) {
            setStarting(false);
            setError("This bot game is not available on mobile.");
            return;
          }

          navigation.replace(screen, {
            roomCode: response.room.code,
          });
        },
      );
    } catch (startError) {
      setStarting(false);
      Alert.alert(
        "Could not start game",
        startError?.message || "Please try again.",
      );
    }
  }

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 36 }}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={10}
          style={{
            flexDirection: "row",
            alignItems: "center",
            alignSelf: "flex-start",
            gap: 7,
            marginBottom: 16,
          }}
        >
          <Ionicons name="arrow-back" size={18} color={colors.cyan} />
          <Text style={{ color: colors.cyan, fontWeight: "900" }}>
            Back to Play
          </Text>
        </Pressable>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View
            style={{
              width: 50,
              height: 50,
              borderRadius: 17,
              backgroundColor: "rgba(124,92,255,0.16)",
              borderWidth: 1,
              borderColor: "rgba(124,92,255,0.32)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons
              name="hardware-chip-outline"
              size={24}
              color={colors.primary}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: colors.text,
                fontSize: 30,
                fontWeight: "900",
                letterSpacing: -0.8,
              }}
            >
              Play With Bots
            </Text>
            <Text style={{ color: colors.muted, marginTop: 5 }}>
              Play a real server-side game against computer players.
            </Text>
          </View>
        </View>

        {loading ? (
          <View
            style={{
              minHeight: 260,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ActivityIndicator size="large" color={colors.cyan} />
            <Text style={{ color: colors.muted, marginTop: 12 }}>
              Loading supported games…
            </Text>
          </View>
        ) : (
          <>
            <View
              style={{
                marginTop: 22,
                backgroundColor: colors.surface,
                borderRadius: radii.lg,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 18,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: colors.muted,
                      fontSize: 11,
                      fontWeight: "900",
                      letterSpacing: 1,
                    }}
                  >
                    01 · GAME
                  </Text>
                  <Text
                    style={{
                      color: colors.text,
                      fontSize: 20,
                      fontWeight: "900",
                      marginTop: 7,
                    }}
                  >
                    Choose a game
                  </Text>
                </View>
                <View
                  style={{
                    borderRadius: radii.pill,
                    backgroundColor: colors.surface2,
                    paddingHorizontal: 10,
                    paddingVertical: 7,
                  }}
                >
                  <Text
                    style={{
                      color: colors.green,
                      fontSize: 9,
                      fontWeight: "900",
                    }}
                  >
                    SERVER BOT
                  </Text>
                </View>
              </View>

              <View
                style={{
                  marginTop: 15,
                  gap: 8,
                }}
              >
                {configs.map((config) => {
                  const meta = gameMeta(config.gameId);
                  const active = config.gameId === selectedGame;

                  return (
                    <Pressable
                      key={config.gameId}
                      onPress={() => selectGame(config.gameId)}
                      style={{
                        padding: 14,
                        borderRadius: radii.md,
                        borderWidth: 1,
                        borderColor: active ? colors.primary : colors.border,
                        backgroundColor: active
                          ? "rgba(124,92,255,0.14)"
                          : colors.surface2,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 10,
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text
                            numberOfLines={1}
                            style={{
                              color: colors.text,
                              fontSize: 15,
                              fontWeight: "900",
                            }}
                          >
                            {meta?.name || config.gameId}
                          </Text>
                          <Text
                            style={{
                              color: colors.muted,
                              fontSize: 11,
                              marginTop: 4,
                            }}
                          >
                            {config.minPlayers}–{config.maxPlayers} players
                          </Text>
                        </View>
                        <Ionicons
                          name={active ? "checkmark-circle" : "ellipse-outline"}
                          size={22}
                          color={active ? colors.primary : colors.muted}
                        />
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              {selectedMeta ? (
                <View
                  style={{
                    marginTop: 14,
                    padding: 13,
                    borderRadius: radii.md,
                    backgroundColor: colors.surface2,
                  }}
                >
                  <Text
                    style={{
                      color: colors.muted,
                      fontSize: 10,
                      fontWeight: "900",
                      letterSpacing: 1,
                    }}
                  >
                    SELECTED
                  </Text>
                  <Text
                    style={{
                      color: colors.text,
                      fontSize: 16,
                      fontWeight: "900",
                      marginTop: 4,
                    }}
                  >
                    {selectedMeta.name}
                  </Text>
                  <Text
                    style={{ color: colors.muted, fontSize: 12, marginTop: 3 }}
                  >
                    {selectedMeta.category}
                  </Text>
                </View>
              ) : null}
            </View>

            <View
              style={{
                marginTop: 14,
                backgroundColor: colors.surface,
                borderRadius: radii.lg,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 18,
              }}
            >
              <Text
                style={{
                  color: colors.muted,
                  fontSize: 11,
                  fontWeight: "900",
                  letterSpacing: 1,
                }}
              >
                02 · OPPONENTS
              </Text>
              <Text
                style={{
                  color: colors.text,
                  fontSize: 20,
                  fontWeight: "900",
                  marginTop: 7,
                }}
              >
                Number of bots
              </Text>
              <Text
                style={{ color: colors.muted, marginTop: 5, lineHeight: 20 }}
              >
                One human player plus a valid number of server-controlled bots.
              </Text>

              {selectedConfig ? (
                <>
                  <View
                    style={{
                      marginTop: 18,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                    }}
                  >
                    <Pressable
                      disabled={botCount <= selectedConfig.minBots}
                      onPress={() => changeBotCount(-1)}
                      style={({ pressed }) => ({
                        width: 52,
                        height: 52,
                        borderRadius: 17,
                        borderWidth: 1,
                        borderColor: colors.border,
                        backgroundColor: colors.surface2,
                        alignItems: "center",
                        justifyContent: "center",
                        opacity:
                          botCount <= selectedConfig.minBots
                            ? 0.38
                            : pressed
                              ? 0.72
                              : 1,
                      })}
                    >
                      <Ionicons name="remove" size={22} color={colors.text} />
                    </Pressable>

                    <View style={{ alignItems: "center", flex: 1 }}>
                      <Text
                        style={{
                          color: colors.text,
                          fontSize: 34,
                          fontWeight: "900",
                        }}
                      >
                        {botCount}
                      </Text>
                      <Text style={{ color: colors.muted, fontSize: 12 }}>
                        {botCount === 1 ? "bot" : "bots"}
                      </Text>
                    </View>

                    <Pressable
                      disabled={botCount >= selectedConfig.maxBots}
                      onPress={() => changeBotCount(1)}
                      style={({ pressed }) => ({
                        width: 52,
                        height: 52,
                        borderRadius: 17,
                        borderWidth: 1,
                        borderColor: colors.border,
                        backgroundColor: colors.surface2,
                        alignItems: "center",
                        justifyContent: "center",
                        opacity:
                          botCount >= selectedConfig.maxBots
                            ? 0.38
                            : pressed
                              ? 0.72
                              : 1,
                      })}
                    >
                      <Ionicons name="add" size={22} color={colors.text} />
                    </Pressable>
                  </View>

                  <View
                    style={{
                      marginTop: 16,
                      padding: 13,
                      borderRadius: radii.md,
                      backgroundColor: colors.surface2,
                      gap: 6,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        gap: 12,
                      }}
                    >
                      <Text style={{ color: colors.muted }}>Table size</Text>
                      <Text
                        style={{
                          color: colors.text,
                          fontWeight: "900",
                          flexShrink: 1,
                          textAlign: "right",
                        }}
                      >
                        1 Human + {botCount} Bot{botCount === 1 ? "" : "s"}
                      </Text>
                    </View>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        gap: 12,
                      }}
                    >
                      <Text style={{ color: colors.muted }}>Valid range</Text>
                      <Text style={{ color: colors.cyan, fontWeight: "900" }}>
                        {selectedConfig.minBots}–{selectedConfig.maxBots} bots
                      </Text>
                    </View>
                  </View>
                </>
              ) : (
                <Text style={{ color: colors.muted, marginTop: 18 }}>
                  Select a game to choose its bot count.
                </Text>
              )}
            </View>

            <View
              style={{
                marginTop: 14,
                backgroundColor: colors.surface,
                borderRadius: radii.lg,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 18,
              }}
            >
              <Text
                style={{
                  color: colors.muted,
                  fontSize: 11,
                  fontWeight: "900",
                  letterSpacing: 1,
                }}
              >
                03 · START
              </Text>
              <Text
                style={{
                  color: colors.text,
                  fontSize: 20,
                  fontWeight: "900",
                  marginTop: 7,
                }}
              >
                Ready to play?
              </Text>
              <Text
                style={{ color: colors.muted, marginTop: 5, lineHeight: 20 }}
              >
                The backend creates the real room and runs the same bot strategy
                used by the website.
              </Text>

              <AppButton
                title={starting ? "Starting Bot Game…" : "Start Bot Game"}
                onPress={startBotGame}
                loading={starting}
                disabled={!selectedConfig}
                style={{ marginTop: 16 }}
              />
            </View>
          </>
        )}

        {error ? (
          <View
            style={{
              marginTop: 14,
              padding: 14,
              borderRadius: radii.md,
              backgroundColor: "rgba(255,107,122,0.10)",
              borderWidth: 1,
              borderColor: "rgba(255,107,122,0.24)",
            }}
          >
            <Text
              style={{
                color: colors.red,
                fontSize: 12,
                lineHeight: 19,
                fontWeight: "700",
              }}
            >
              {error}
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
