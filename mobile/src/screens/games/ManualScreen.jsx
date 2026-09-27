import { ScrollView, Text, View } from "react-native";
import Screen from "../../components/Screen";
import { games } from "../../data/games";
import { getGameManual } from "../../data/gameManuals";
import { colors, radii } from "../../theme";

function renderBody(body) {
  const parts = String(body).split(/(`[^`]+`)/g);

  return parts.map((part, index) => {
    const isCode = part.startsWith("`") && part.endsWith("`");

    return (
      <Text
        key={`${index}-${part}`}
        style={
          isCode
            ? {
                color: colors.cyan,
                fontWeight: "800",
              }
            : undefined
        }
      >
        {isCode ? part.slice(1, -1) : part}
      </Text>
    );
  });
}

export default function ManualScreen({ route }) {
  const game = games.find((item) => item.id === route.params?.gameId);
  const manual = getGameManual(route.params?.gameId);

  if (!game || !manual) {
    return (
      <Screen>
        <Text style={{ color: colors.text, fontSize: 28, fontWeight: "900" }}>
          Manual unavailable
        </Text>
        <Text style={{ color: colors.muted, marginTop: 8, lineHeight: 21 }}>
          This game does not have a published manual yet.
        </Text>
      </Screen>
    );
  }

  const overview = manual.sections.find(
    (section) => section.heading === "Overview",
  );

  return (
    <Screen scroll={false}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        <Text
          style={{
            color: colors.muted,
            fontSize: 12,
            fontWeight: "900",
            letterSpacing: 1.4,
          }}
        >
          SHUFFLEUP · HOW TO PLAY
        </Text>

        <Text
          style={{
            color: colors.text,
            fontSize: 31,
            fontWeight: "900",
            marginTop: 6,
          }}
        >
          {manual.title}
        </Text>

        <Text style={{ color: colors.muted, marginTop: 8, lineHeight: 21 }}>
          {overview?.body || `${game.category} · ${game.players}`}
        </Text>

        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
            marginTop: 16,
          }}
        >
          <View
            style={{
              backgroundColor: colors.surface2,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: radii.pill,
              paddingHorizontal: 12,
              paddingVertical: 7,
            }}
          >
            <Text
              style={{ color: colors.cyan, fontSize: 12, fontWeight: "900" }}
            >
              {game.players}
            </Text>
          </View>
          <View
            style={{
              backgroundColor: colors.surface2,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: radii.pill,
              paddingHorizontal: 12,
              paddingVertical: 7,
            }}
          >
            <Text
              style={{ color: colors.primary, fontSize: 12, fontWeight: "900" }}
            >
              {game.category}
            </Text>
          </View>
          <View
            style={{
              backgroundColor: colors.surface2,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: radii.pill,
              paddingHorizontal: 12,
              paddingVertical: 7,
            }}
          >
            <Text
              style={{ color: colors.text, fontSize: 12, fontWeight: "900" }}
            >
              {manual.sections.length} rules
            </Text>
          </View>
        </View>

        <View style={{ marginTop: 20 }}>
          {manual.sections.map((section, index) => (
            <View
              key={`${section.heading}-${index}`}
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: radii.lg,
                padding: 16,
                marginBottom: 12,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 9,
                    backgroundColor: colors.surface2,
                    borderWidth: 1,
                    borderColor: colors.border,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 10,
                  }}
                >
                  <Text
                    style={{
                      color: colors.primary,
                      fontSize: 11,
                      fontWeight: "900",
                    }}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </Text>
                </View>

                <Text
                  style={{
                    flex: 1,
                    color: colors.text,
                    fontSize: 17,
                    fontWeight: "900",
                  }}
                >
                  {section.heading}
                </Text>
              </View>

              <Text
                style={{ color: colors.muted, lineHeight: 22, marginTop: 12 }}
              >
                {renderBody(section.body)}
              </Text>
            </View>
          ))}
        </View>

        <View
          style={{
            backgroundColor: colors.surface2,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: radii.md,
            padding: 14,
          }}
        >
          <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 18 }}>
            These manuals mirror the rules published on the ShuffleUp website.
            The live game server remains authoritative for legal actions,
            scoring, results, completion, and multiplayer state.
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}
