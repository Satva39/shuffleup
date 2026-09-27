import { Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Screen from "../../components/Screen";
import BrandMark from "../../components/BrandMark";
import GameCard from "../../components/GameCard";
import { games } from "../../data/games";
import { colors, radii } from "../../theme";
import { useAuth } from "../../context/AuthStore";

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const featured = games.slice(0, 3);
  return (
    <Screen>
      <BrandMark compact />
      <View style={{ marginTop: 26 }}>
        <LinearGradient
          colors={["#191C48", "#11162A"]}
          style={{
            borderRadius: radii.lg,
            padding: 22,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text
            style={{
              color: colors.cyan,
              fontSize: 12,
              fontWeight: "900",
              letterSpacing: 1.3,
            }}
          >
            GOOD TO SEE YOU
          </Text>
          <Text
            style={{
              color: colors.text,
              fontSize: 28,
              fontWeight: "900",
              marginTop: 7,
            }}
          >
            Ready, {user?.username || "Player"}?
          </Text>
          <Text style={{ color: colors.muted, lineHeight: 21, marginTop: 7 }}>
            Jump into a table, invite your friends, and play in real time.
          </Text>
        </LinearGradient>
      </View>
      <View
        style={{
          marginTop: 28,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text style={{ color: colors.text, fontSize: 20, fontWeight: "900" }}>
          Featured tables
        </Text>
        <Text
          onPress={() => navigation.navigate("Games")}
          style={{ color: colors.cyan, fontWeight: "800" }}
        >
          See all
        </Text>
      </View>
      <View style={{ marginTop: 14 }}>
        {featured.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            onPress={() => navigation.navigate("Games", { gameId: game.id })}
          />
        ))}
      </View>
    </Screen>
  );
}
