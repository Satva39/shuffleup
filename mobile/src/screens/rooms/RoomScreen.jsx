import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../../components/Screen";
import AppButton from "../../components/AppButton";
import { colors, radii } from "../../theme";
import { useAuth } from "../../context/AuthStore";
import { shuffleSocket } from "../../services/socket";
import { useRoomSocket } from "../../hooks/useRoomSocket";

const statusCopy = {
  connected: {
    label: "Connected",
    color: colors.green,
    icon: "radio-button-on",
  },
  connecting: { label: "Connecting", color: colors.cyan, icon: "sync" },
  reconnecting: { label: "Reconnecting", color: colors.amber, icon: "sync" },
  error: { label: "Connection error", color: colors.red, icon: "warning" },
  offline: { label: "Offline", color: colors.red, icon: "cloud-offline" },
};

export default function RoomScreen({ route, navigation }) {
  const roomCode = route?.params?.roomCode;
  const { user } = useAuth();
  const { room, status, connected, request } = useRoomSocket(roomCode);
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const normalizedCode = String(roomCode).trim().toUpperCase();
  const me = room?.players?.find((player) => player.id === user?.id);
  const isHost = room?.hostId === user?.id;
  const limits = room?.gameId ? getPlayersText(room.gameId) : null;
  const statusMeta = statusCopy[status] || statusCopy.connecting;

  useEffect(() => {
    if (!roomCode) {
      navigation.replace(user ? "Main" : "Login");
      return;
    }

    if (!user) {
      navigation.replace("Login", { redirectRoomCode: normalizedCode });
    }
  }, [navigation, normalizedCode, roomCode, user]);

  useEffect(() => {
    if (room?.gameId === "kachuful" && room.status === "playing") {
      navigation.replace("KachufulGame", { roomCode: room.code });
      return;
    }

    if (room?.gameId === "teen-patti" && room.status === "playing") {
      navigation.replace("TeenPattiGame", { roomCode: room.code });
      return;
    }

    if (room?.gameId === "indian-rummy" && room.status === "playing") {
      navigation.replace("IndianRummyGame", { roomCode: room.code });
      return;
    }

    if (room?.gameId === "mangoose" && room.status === "playing") {
      navigation.replace("MangooseGame", { roomCode: room.code });
      return;
    }

    if (room?.gameId === "uno" && room.status === "playing") {
      navigation.replace("UnoGame", { roomCode: room.code });
      return;
    }

    if (room?.gameId === "jack-thief" && room.status === "playing") {
      navigation.replace("JackThiefGame", { roomCode: room.code });
      return;
    }

    if (room?.gameId === "napoleon" && room.status === "playing") {
      navigation.replace("NapoleonGame", { roomCode: room.code });
      return;
    }

    if (room?.gameId === "bridge" && room.status === "playing") {
      navigation.replace("BridgeGame", { roomCode: room.code });
      return;
    }

    if (room?.gameId === "spades" && room.status === "playing") {
      navigation.replace("SpadesGame", { roomCode: room.code });
      return;
    }

    if (room?.gameId === "twenty-nine" && room.status === "playing") {
      navigation.replace("TwentyNineGame", { roomCode: room.code });
      return;
    }

    if (room?.gameId === "mindi-coat" && room.status === "playing") {
      navigation.replace("MindiCoatGame", { roomCode: room.code });
      return;
    }

    if (room?.gameId === "bluff" && room.status === "playing") {
      navigation.replace("BluffGame", { roomCode: room.code });
      return;
    }

    if (room?.gameId === "satte-pe-satta" && room.status === "playing") {
      navigation.replace("SattePeSattaGame", { roomCode: room.code });
      return;
    }

    if (room?.gameId === "war" && room.status === "playing") {
      navigation.replace("WarGame", { roomCode: room.code });
      return;
    }

    if (room?.gameId === "solitaire" && room.status === "playing") {
      navigation.replace("SolitaireGame", { roomCode: room.code });
      return;
    }
  }, [navigation, room?.code, room?.gameId, room?.status]);

  useEffect(() => {
    const onGameStarted = (nextRoom) => {
      if (nextRoom?.gameId === "kachuful") {
        navigation.replace("KachufulGame", {
          roomCode: nextRoom.code,
        });
        return;
      }

      if (nextRoom?.gameId === "teen-patti") {
        navigation.replace("TeenPattiGame", {
          roomCode: nextRoom.code,
        });
        return;
      }

      if (nextRoom?.gameId === "indian-rummy") {
        navigation.replace("IndianRummyGame", {
          roomCode: nextRoom.code,
        });
        return;
      }

      if (nextRoom?.gameId === "mangoose") {
        navigation.replace("MangooseGame", {
          roomCode: nextRoom.code,
        });
        return;
      }

      if (nextRoom?.gameId === "uno") {
        navigation.replace("UnoGame", {
          roomCode: nextRoom.code,
        });
        return;
      }

      if (nextRoom?.gameId === "jack-thief") {
        navigation.replace("JackThiefGame", {
          roomCode: nextRoom.code,
        });
        return;
      }

      if (nextRoom?.gameId === "napoleon") {
        navigation.replace("NapoleonGame", {
          roomCode: nextRoom.code,
        });
        return;
      }

      if (nextRoom?.gameId === "bridge") {
        navigation.replace("BridgeGame", {
          roomCode: nextRoom.code,
        });
        return;
      }

      if (nextRoom?.gameId === "spades") {
        navigation.replace("SpadesGame", {
          roomCode: nextRoom.code,
        });
        return;
      }

      if (nextRoom?.gameId === "twenty-nine") {
        navigation.replace("TwentyNineGame", {
          roomCode: nextRoom.code,
        });
        return;
      }

      if (nextRoom?.gameId === "mindi-coat") {
        navigation.replace("MindiCoatGame", {
          roomCode: nextRoom.code,
        });
        return;
      }

      if (nextRoom?.gameId === "bluff") {
        navigation.replace("BluffGame", {
          roomCode: nextRoom.code,
        });
        return;
      }

      if (nextRoom?.gameId === "satte-pe-satta") {
        navigation.replace("SattePeSattaGame", {
          roomCode: nextRoom.code,
        });
        return;
      }

      if (nextRoom?.gameId === "war") {
        navigation.replace("WarGame", {
          roomCode: nextRoom.code,
        });
        return;
      }

      if (nextRoom?.gameId === "solitaire") {
        navigation.replace("SolitaireGame", {
          roomCode: nextRoom.code,
        });
        return;
      }

      navigation.replace("GamePreview", {
        gameId: nextRoom.gameId,
        roomCode: nextRoom.code,
      });
    };

    return shuffleSocket.on("game-started", onGameStarted);
  }, [navigation]);

  async function toggleReady() {
    setBusy(true);
    const result = await request("toggle-ready", { roomCode: normalizedCode });
    setBusy(false);
    if (!result?.success)
      Alert.alert(
        "Ready status",
        result?.message || "Unable to update ready status.",
      );
  }

  async function startGame() {
    if (!isHost) return;
    setBusy(true);
    const result = await request("start-game", { roomCode: normalizedCode });
    setBusy(false);
    if (!result?.success)
      Alert.alert(
        "Cannot start game",
        result?.message || "Make sure the required players are ready.",
      );
  }

  async function shareRoom() {
    const gameName = room?.gameId ? prettify(room.gameId) : "ShuffleUp";
    const shareUrl = `https://shuffleup-five.vercel.app/room/${encodeURIComponent(
      normalizedCode,
    )}`;

    try {
      await Share.share({
        title: `Join my ${gameName} room`,
        message: `Join my ${gameName} room on ShuffleUp.\n\n${shareUrl}`,
        url: shareUrl,
      });
    } catch (error) {
      if (error?.message) {
        Alert.alert("Share room", error.message);
      }
    }
  }

  async function leaveRoom() {
    Alert.alert(
      "Leave room?",
      "You will leave this table and return to the lobby.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: () => {
            shuffleSocket
              .getSocket()
              ?.emit("leave-room", { roomCode: normalizedCode });
            navigation.goBack();
          },
        },
      ],
    );
  }

  async function refreshRoom() {
    setRefreshing(true);
    const result = await request("join-room", { roomCode: normalizedCode });
    setRefreshing(false);
    if (!result?.success)
      Alert.alert("Room", result?.message || "Unable to refresh the room.");
  }

  const readyCount = useMemo(
    () =>
      (room?.players || []).filter(
        (player) => player.ready || player.id === room?.hostId,
      ).length,
    [room],
  );

  if (!roomCode || !user) return null;

  return (
    <Screen scroll={false} contentStyle={{ paddingBottom: 14 }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshRoom}
            tintColor={colors.cyan}
          />
        }
        contentContainerStyle={{ paddingBottom: 28 }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: colors.muted,
                fontSize: 12,
                fontWeight: "800",
                letterSpacing: 1.2,
              }}
            >
              ROOM
            </Text>
            <Text
              style={{
                color: colors.text,
                fontSize: 32,
                fontWeight: "900",
                marginTop: 4,
              }}
            >
              {normalizedCode}
            </Text>
          </View>
          <Pressable
            onPress={refreshRoom}
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="refresh" size={19} color={colors.text} />
          </Pressable>
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginTop: 12,
            gap: 8,
          }}
        >
          <Ionicons name={statusMeta.icon} size={15} color={statusMeta.color} />
          <Text
            style={{ color: statusMeta.color, fontSize: 12, fontWeight: "800" }}
          >
            {statusMeta.label}
          </Text>
          {room?.status ? (
            <Text style={{ color: colors.muted, fontSize: 12 }}>
              · {room.status}
            </Text>
          ) : null}
        </View>

        <View
          style={{
            marginTop: 20,
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
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View>
              <Text
                style={{ color: colors.text, fontSize: 18, fontWeight: "900" }}
              >
                {room?.gameId ? prettify(room.gameId) : "Loading game…"}
              </Text>
              <Text style={{ color: colors.muted, marginTop: 4 }}>
                {limits || "Waiting for room data"}
              </Text>
            </View>
            <View
              style={{
                backgroundColor: colors.surface2,
                paddingHorizontal: 10,
                paddingVertical: 7,
                borderRadius: 999,
              }}
            >
              <Text
                style={{ color: colors.cyan, fontSize: 11, fontWeight: "900" }}
              >
                {readyCount}/{room?.players?.length || 0} READY
              </Text>
            </View>
          </View>
        </View>

        <View
          style={{
            marginTop: 14,
            backgroundColor: colors.surface,
            borderRadius: radii.lg,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: 18,
          }}
        >
          <View style={{ paddingTop: 18, paddingBottom: 8 }}>
            <Text
              style={{
                color: colors.muted,
                fontSize: 12,
                fontWeight: "800",
                letterSpacing: 1,
              }}
            >
              PLAYERS
            </Text>
          </View>
          {(room?.players || []).map((player, index) => (
            <View
              key={player.id}
              style={{
                minHeight: 66,
                paddingVertical: 12,
                borderTopWidth: index === 0 ? 0 : 1,
                borderTopColor: colors.border,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 14,
                  backgroundColor: player.connected
                    ? colors.primarySoft
                    : colors.surface2,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                <Ionicons
                  name={player.connected ? "person" : "person-outline"}
                  size={19}
                  color={player.connected ? colors.cyan : colors.muted}
                />
              </View>
              <View style={{ flex: 1 }}>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 7 }}
                >
                  <Text
                    numberOfLines={1}
                    style={{
                      color: colors.text,
                      fontWeight: "900",
                      flexShrink: 1,
                    }}
                  >
                    {player.username}
                  </Text>
                  {player.id === room?.hostId ? (
                    <Text
                      style={{
                        color: colors.amber,
                        fontSize: 10,
                        fontWeight: "900",
                      }}
                    >
                      HOST
                    </Text>
                  ) : null}
                  {player.id === user?.id ? (
                    <Text
                      style={{
                        color: colors.cyan,
                        fontSize: 10,
                        fontWeight: "900",
                      }}
                    >
                      YOU
                    </Text>
                  ) : null}
                </View>
                <Text
                  style={{
                    color: player.connected
                      ? player.ready || player.id === room?.hostId
                        ? colors.green
                        : colors.muted
                      : colors.red,
                    fontSize: 12,
                    marginTop: 4,
                  }}
                >
                  {player.connected
                    ? player.ready || player.id === room?.hostId
                      ? "Ready to play"
                      : "Not ready"
                    : "Disconnected"}
                </Text>
              </View>
              {player.ready || player.id === room?.hostId ? (
                <Ionicons
                  name="checkmark-circle"
                  size={22}
                  color={colors.green}
                />
              ) : (
                <Ionicons name="time-outline" size={21} color={colors.muted} />
              )}
            </View>
          ))}
          {!room ? (
            <Text style={{ color: colors.muted, paddingVertical: 18 }}>
              Syncing room…
            </Text>
          ) : null}
        </View>

        <AppButton
          title="Share Room"
          variant="secondary"
          onPress={shareRoom}
          style={{ marginTop: 14 }}
        />

        <View style={{ marginTop: 10, gap: 10 }}>
          <AppButton
            title={me?.ready ? "Set not ready" : "Ready up"}
            variant={me?.ready ? "secondary" : "primary"}
            onPress={toggleReady}
            loading={busy}
          />
          {isHost ? (
            <AppButton
              title="Start game"
              onPress={startGame}
              loading={busy}
              disabled={
                !connected ||
                !room ||
                room.players.length < (room ? getMinPlayers(room.gameId) : 99)
              }
            />
          ) : null}
          <AppButton
            title="Leave room"
            variant="secondary"
            onPress={leaveRoom}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

function prettify(gameId) {
  return String(gameId || "")
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
    .replace("Twenty Nine", "Twenty-Nine")
    .replace("Teen Patti", "Teen Patti")
    .replace("Uno", "UNO");
}

function getPlayersText(gameId) {
  const limits = {
    kachuful: "4–10 players",
    "teen-patti": "3–6 players",
    "indian-rummy": "2–6 players",
    mangoose: "2–12 players",
    uno: "2–12 players",
    "jack-thief": "2–8 players",
    napoleon: "5 players",
    bridge: "4 players",
    spades: "4 players",
    "twenty-nine": "4 players",
    "mindi-coat": "4 players",
    bluff: "2–6 players",
    "satte-pe-satta": "3–8 players",
    war: "2 players",
    solitaire: "2–8 players",
  };
  return limits[gameId] || null;
}

function getMinPlayers(gameId) {
  const min = {
    kachuful: 4,
    "teen-patti": 3,
    "indian-rummy": 2,
    mangoose: 2,
    uno: 2,
    "jack-thief": 2,
    napoleon: 5,
    bridge: 4,
    spades: 4,
    "twenty-nine": 4,
    "mindi-coat": 4,
    bluff: 2,
    "satte-pe-satta": 3,
    war: 2,
    solitaire: 2,
  };
  return min[gameId] || 2;
}
