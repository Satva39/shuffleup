import { useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import Screen from "../../components/Screen";
import AppButton from "../../components/AppButton";
import { games } from "../../data/games";
import { colors, radii } from "../../theme";
import { shuffleSocket } from "../../services/socket";

export default function GamePreviewScreen({ route, navigation }) {
  const game = games.find((item) => item.id === route.params?.gameId);
  const roomCode = route.params?.roomCode;
  const [busy, setBusy] = useState(false);

  function createRoom() {
    if (!shuffleSocket.isConnected()) {
      Alert.alert(
        "Connecting",
        "Give ShuffleUp a moment to reconnect, then try again.",
      );
      return;
    }

    setBusy(true);
    shuffleSocket.emitSafe("create-room", { gameId: game.id }, (result) => {
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

  if (!game) {
    return (
      <Screen>
        <Text style={{ color: colors.text, fontSize: 22, fontWeight: "900" }}>
          Game not found.
        </Text>
        <AppButton
          title="Back to Play"
          onPress={() => navigation.navigate("Main", { screen: "Lobby" })}
          style={{ marginTop: 18 }}
        />
      </Screen>
    );
  }

  return (
    <Screen scroll={false}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 28 }}
      >
        <View
          style={{
            width: 74,
            height: 74,
            borderRadius: 24,
            backgroundColor: colors.surface2,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={{ fontSize: 36 }}>🂡</Text>
        </View>

        <Text
          style={{
            color: colors.text,
            fontSize: 34,
            fontWeight: "900",
            marginTop: 20,
          }}
        >
          {game.name}
        </Text>

        <Text
          style={{
            color: colors.muted,
            marginTop: 8,
            fontSize: 16,
            lineHeight: 23,
          }}
        >
          {game.description}
        </Text>

        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: radii.lg,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 18,
            marginTop: 24,
          }}
        >
          <Text style={{ color: colors.muted }}>PLAYERS</Text>
          <Text
            style={{
              color: colors.text,
              fontSize: 18,
              fontWeight: "800",
              marginTop: 5,
            }}
          >
            {game.players}
          </Text>

          <Text style={{ color: colors.muted, marginTop: 15 }}>CATEGORY</Text>
          <Text
            style={{
              color: colors.text,
              fontSize: 18,
              fontWeight: "800",
              marginTop: 5,
            }}
          >
            {game.category}
          </Text>
        </View>

        <AppButton
          title="Create Room"
          onPress={createRoom}
          loading={busy}
          style={{ marginTop: 18 }}
        />

        <AppButton
          title="Back to Play"
          variant="secondary"
          onPress={() => navigation.navigate("Main", { screen: "Lobby" })}
          style={{ marginTop: 10 }}
        />

        <AppButton
          title="How to play"
          variant="secondary"
          onPress={() => navigation.navigate("Manual", { gameId: game.id })}
          style={{ marginTop: 10 }}
        />
      </ScrollView>
    </Screen>
  );
}
