import { ScrollView } from "react-native";
import BluffSeat from "./BluffSeat";

export default function BluffSeatRow({
  players = [],
  viewerId,
  currentPlayerId,
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingRight: 4 }}
    >
      {players
        .filter((player) => player.id !== viewerId)
        .map((player) => (
          <BluffSeat
            key={player.id}
            player={player}
            isYou={false}
            active={player.id === currentPlayerId}
          />
        ))}
    </ScrollView>
  );
}
