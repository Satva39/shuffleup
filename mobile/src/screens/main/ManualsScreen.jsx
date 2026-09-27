import { FlatList, Pressable, Text, View } from "react-native";
import Screen from "../../components/Screen";
import { games } from "../../data/games";
import { colors, radii } from "../../theme";
import { getGameManual } from "../../data/gameManuals";

export default function ManualsScreen({ navigation }) {
  return (
    <Screen scroll={false}>
      <View style={{ paddingBottom: 14 }}>
        <Text
          style={{
            color: colors.muted,
            fontSize: 12,
            fontWeight: "900",
            letterSpacing: 1.4,
          }}
        >
          SHUFFLEUP · GAME MANUALS
        </Text>
        <Text
          style={{
            color: colors.text,
            fontSize: 31,
            fontWeight: "900",
            marginTop: 6,
          }}
        >
          How to Play
        </Text>
        <Text style={{ color: colors.muted, marginTop: 7, lineHeight: 21 }}>
          Every manual below uses the same rule content published on the
          ShuffleUp website.
        </Text>
      </View>

      <FlatList
        data={games}
        keyExtractor={(game) => game.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 26 }}
        renderItem={({ item: game, index }) => {
          const manual = getGameManual(game.id);
          const overview = manual?.sections?.find(
            (section) => section.heading === "Overview",
          );

          return (
            <Pressable
              onPress={() => navigation.navigate("Manual", { gameId: game.id })}
              style={({ pressed }) => [
                {
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: radii.lg,
                  padding: 16,
                  marginBottom: 10,
                  opacity: pressed ? 0.78 : 1,
                },
              ]}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    backgroundColor: colors.surface2,
                    borderWidth: 1,
                    borderColor: colors.border,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                  }}
                >
                  <Text style={{ color: colors.primary, fontWeight: "900" }}>
                    {String(index + 1).padStart(2, "0")}
                  </Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: colors.text,
                      fontSize: 16,
                      fontWeight: "900",
                    }}
                  >
                    {game.name}
                  </Text>
                  <Text
                    style={{ color: colors.muted, marginTop: 3, fontSize: 12 }}
                  >
                    {game.category} · {game.players}
                  </Text>
                  <Text
                    style={{
                      color: colors.muted,
                      marginTop: 6,
                      lineHeight: 18,
                    }}
                    numberOfLines={2}
                  >
                    {overview?.body || game.description}
                  </Text>
                </View>

                <Text
                  style={{
                    color: colors.primary,
                    fontSize: 26,
                    fontWeight: "500",
                    marginLeft: 10,
                  }}
                >
                  ›
                </Text>
              </View>
            </Pressable>
          );
        }}
      />
    </Screen>
  );
}
