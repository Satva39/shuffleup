import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import Screen from "../../components/Screen";
import GameCard from "../../components/GameCard";
import { games } from "../../data/games";
import { colors, radii } from "../../theme";
import { getGameHistory } from "../../utils/gameHistory";
import { useAuth } from "../../context/AuthStore";
import { API_URL } from "../../constants/config";

const SORTS = [
  { id: "featured", label: "Featured" },
  { id: "name", label: "A–Z" },
  { id: "plays", label: "Most played" },
  { id: "recent", label: "Recent" },
];

export default function GamesScreen({ navigation }) {
  const { user } = useAuth();
  const [sortBy, setSortBy] = useState("featured");
  const [history, setHistory] = useState({});
  const [liveCounts, setLiveCounts] = useState({});

  useEffect(() => {
    let active = true;
    let timer;
    const refresh = async () => {
      try {
        const response = await fetch(
          `${API_URL.replace(/\/$/, "")}/api/live-counts`,
          { cache: "no-store" },
        );
        if (!response.ok) return;
        const result = await response.json();
        if (active) setLiveCounts(result.games || {});
      } catch {
        /* count availability must not affect opening a game */
      }
    };
    refresh();
    timer = setInterval(refresh, 15000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getGameHistory(user?.id || "guest").then((value) => {
        if (active) setHistory(value);
      });
      return () => {
        active = false;
      };
    }, [user?.id]),
  );

  const visibleGames = useMemo(
    () =>
      [...games].sort((a, b) => {
        if (sortBy === "name") return a.name.localeCompare(b.name);
        if (sortBy === "plays")
          return (
            (history[b.id]?.plays || 0) - (history[a.id]?.plays || 0) ||
            a.name.localeCompare(b.name)
          );
        if (sortBy === "recent")
          return (
            (history[b.id]?.lastPlayedAt || 0) -
              (history[a.id]?.lastPlayedAt || 0) || a.name.localeCompare(b.name)
          );
        return (
          games.findIndex((item) => item.id === a.id) -
          games.findIndex((item) => item.id === b.id)
        );
      }),
    [sortBy, history],
  );

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
      <Text
        style={{
          color: colors.muted,
          marginTop: 7,
          marginBottom: 16,
          fontSize: 15,
          lineHeight: 22,
        }}
      >
        15 games. One real-time table network.
      </Text>
      <View
        accessibilityRole="toolbar"
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 18,
        }}
      >
        {SORTS.map((option) => {
          const selected = sortBy === option.id;
          return (
            <Pressable
              key={option.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setSortBy(option.id)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderRadius: radii.md,
                borderWidth: 1,
                borderColor: selected ? colors.primary : colors.border,
                backgroundColor: selected ? colors.surface2 : colors.surface,
              }}
            >
              <Text
                style={{
                  color: selected ? colors.text : colors.muted,
                  fontSize: 13,
                  fontWeight: "800",
                }}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {sortBy === "plays" || sortBy === "recent" ? (
        <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 12 }}>
          Based on games opened on this device for your signed-in account.
        </Text>
      ) : null}
      {visibleGames.map((game) => (
        <GameCard
          key={game.id}
          game={game}
          liveCount={liveCounts[game.id]?.connectedHumans}
          onPress={() =>
            navigation.navigate("GamePreview", { gameId: game.id })
          }
        />
      ))}
    </Screen>
  );
}
