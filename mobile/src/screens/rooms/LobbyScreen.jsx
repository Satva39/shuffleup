import { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../../components/Screen";
import AppButton from "../../components/AppButton";
import { colors, radii } from "../../theme";
import { games } from "../../data/games";
import { shuffleSocket } from "../../services/socket";

export default function LobbyScreen({ navigation }) {
  const [gameId, setGameId] = useState(games[0]?.id);
  const [roomCode, setRoomCode] = useState("");
  const [busy, setBusy] = useState(false);

  const selectedGame = useMemo(
    () => games.find((game) => game.id === gameId),
    [gameId],
  );

  async function createRoom() {
    if (!shuffleSocket.isConnected()) {
      Alert.alert(
        "Connecting",
        "Give ShuffleUp a moment to reconnect, then try again.",
      );
      return;
    }

    setBusy(true);
    shuffleSocket.emitSafe("create-room", { gameId }, (result) => {
      setBusy(false);
      if (result?.success) {
        navigation.navigate("Room", { roomCode: result.room.code });
      } else {
        Alert.alert(
          "Could not create room",
          result?.message || "Please try again.",
        );
      }
    });
  }

  async function joinRoom() {
    const code = roomCode.trim().toUpperCase();
    if (code.length !== 6) {
      Alert.alert("Invalid room code", "Enter the 6-character room code.");
      return;
    }

    if (!shuffleSocket.isConnected()) {
      Alert.alert(
        "Connecting",
        "Give ShuffleUp a moment to reconnect, then try again.",
      );
      return;
    }

    setBusy(true);
    shuffleSocket.emitSafe("join-room", { roomCode: code }, (result) => {
      setBusy(false);
      if (result?.success) {
        navigation.navigate("Room", { roomCode: result.room.code });
      } else {
        Alert.alert(
          "Could not join room",
          result?.message || "Please check the code and try again.",
        );
      }
    });
  }

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View
            style={{
              width: 42,
              height: 42,
              borderRadius: 14,
              backgroundColor: colors.surface2,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="people" size={22} color={colors.cyan} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{ color: colors.text, fontSize: 30, fontWeight: "900" }}
            >
              Play with friends
            </Text>
            <Text style={{ color: colors.muted, marginTop: 5 }}>
              Create a table or join one with a code.
            </Text>
          </View>
        </View>

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
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 15,
                backgroundColor: "rgba(124,92,255,0.16)",
                borderWidth: 1,
                borderColor: "rgba(124,92,255,0.3)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons
                name="hardware-chip-outline"
                size={21}
                color={colors.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{ color: colors.text, fontSize: 18, fontWeight: "900" }}
              >
                Play With Bots
              </Text>
              <Text
                style={{ color: colors.muted, marginTop: 4, lineHeight: 18 }}
              >
                Play a real server-side game when you are playing solo.
              </Text>
            </View>
          </View>
          <AppButton
            title="Choose Game & Bots"
            variant="secondary"
            onPress={() => navigation.navigate("PlayWithBots")}
            style={{ marginTop: 14 }}
          />
        </View>

        <View
          style={{
            marginTop: 22,
            backgroundColor: colors.surface,
            borderRadius: radii.lg,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 18,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 18,
          }}
        >
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: "900" }}>
            Create a room
          </Text>
          <Text style={{ color: colors.muted, marginTop: 5 }}>
            Choose the game before creating the table.
          </Text>

          <View
            style={{
              marginTop: 15,
              flexDirection: "row",
              flexWrap: "wrap",
              marginHorizontal: -4,
            }}
          >
            {games.map((game) => {
              const active = game.id === gameId;
              return (
                <Pressable
                  key={game.id}
                  onPress={() => setGameId(game.id)}
                  style={{ width: "50%", padding: 4 }}
                >
                  <View
                    style={{
                      minHeight: 52,
                      paddingHorizontal: 10,
                      paddingVertical: 8,
                      borderRadius: radii.md,
                      borderWidth: 1,
                      borderColor: active ? colors.primary : colors.border,
                      backgroundColor: active
                        ? colors.primary
                        : colors.surface2,
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      numberOfLines={1}
                      style={{
                        color: active ? colors.white : colors.text,
                        fontSize: 13,
                        fontWeight: active ? "900" : "700",
                      }}
                    >
                      {game.name}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={{
                        color: active ? "rgba(255,255,255,0.76)" : colors.muted,
                        fontSize: 10,
                        marginTop: 3,
                      }}
                    >
                      {game.players}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View
            style={{
              marginTop: 14,
              borderRadius: radii.md,
              backgroundColor: colors.surface2,
              padding: 13,
            }}
          >
            <Text
              style={{
                color: colors.muted,
                fontSize: 11,
                fontWeight: "800",
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
                marginTop: 5,
              }}
            >
              {selectedGame?.name}
            </Text>
            <Text style={{ color: colors.muted, fontSize: 12, marginTop: 3 }}>
              {selectedGame?.players} · {selectedGame?.category}
            </Text>
          </View>

          <AppButton
            title="Create room"
            onPress={createRoom}
            loading={busy}
            style={{ marginTop: 14 }}
          />
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            marginVertical: 22,
          }}
        >
          <View
            style={{ flex: 1, height: 1, backgroundColor: colors.border }}
          />
          <Text
            style={{ color: colors.muted, fontWeight: "800", fontSize: 12 }}
          >
            OR
          </Text>
          <View
            style={{ flex: 1, height: 1, backgroundColor: colors.border }}
          />
        </View>

        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: radii.lg,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 18,
          }}
        >
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: "900" }}>
            Join a room
          </Text>
          <Text style={{ color: colors.muted, marginTop: 5 }}>
            Ask your friend for the six-character table code.
          </Text>
          <TextInput
            value={roomCode}
            onChangeText={(value) =>
              setRoomCode(value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase())
            }
            placeholder="ABC123"
            placeholderTextColor="#5F6C88"
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={6}
            style={{
              marginTop: 14,
              color: colors.text,
              backgroundColor: colors.surface2,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: radii.md,
              minHeight: 56,
              paddingHorizontal: 16,
              fontSize: 20,
              letterSpacing: 4,
              fontWeight: "900",
              textAlign: "center",
            }}
          />
          <AppButton
            title="Join room"
            variant="secondary"
            onPress={joinRoom}
            loading={busy}
            style={{ marginTop: 12 }}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}
