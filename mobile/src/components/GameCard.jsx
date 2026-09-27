import { Pressable, Text, View } from "react-native";
import { colors, radii } from "../theme";
import { GameCardMotion } from "./GameMotion";

const accents = ["#7C5CFF", "#35D8FF", "#4ADE80", "#F7C65D", "#FF6B7A"];

export default function GameCard({ game, onPress }) {
  const index = game.id.length % accents.length;
  return (
    <GameCardMotion motionKey={`game:${game.id}`}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          {
            opacity: pressed ? 0.9 : 1,
            transform: [{ scale: pressed ? 0.985 : 1 }],
          },
        ]}
      >
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: radii.lg,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 18,
            marginBottom: 12,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                backgroundColor: `${accents[index]}20`,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 25 }}>🂡</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text
                style={{ color: colors.text, fontSize: 18, fontWeight: "850" }}
              >
                {game.name}
              </Text>
              <Text style={{ color: colors.muted, fontSize: 12, marginTop: 3 }}>
                {game.players} players · {game.category}
              </Text>
            </View>
            <Text
              style={{ color: colors.primary, fontSize: 24, fontWeight: "700" }}
            >
              ›
            </Text>
          </View>
          <Text style={{ color: colors.muted, lineHeight: 20, marginTop: 13 }}>
            {game.description}
          </Text>
        </View>
      </Pressable>
    </GameCardMotion>
  );
}
