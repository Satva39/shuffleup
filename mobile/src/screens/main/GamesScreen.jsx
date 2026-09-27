import { Text, View } from "react-native";
import Screen from "../../components/Screen";
import GameCard from "../../components/GameCard";
import { games } from "../../data/games";
import { colors } from "../../theme";

export default function GamesScreen({ navigation }) {
  return (
    <Screen>
      <Text
        style={{
          color: colors.text,
          fontSize: 30,
          fontWeight: "900",
          letterSpacing: -0.8,
        }}
      >
        Games
      </Text>
      <Text style={{ color: colors.muted, marginTop: 7, marginBottom: 20 }}>
        15 games. One real-time table network.
      </Text>
      {games.map((game) => (
        <GameCard
          key={game.id}
          game={game}
          onPress={() =>
            navigation.navigate("GamePreview", { gameId: game.id })
          }
        />
      ))}
    </Screen>
  );
}
