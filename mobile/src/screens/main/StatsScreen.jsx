import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Screen from "../../components/Screen";
import { useAuth } from "../../context/AuthStore";
import { games } from "../../data/games";
import { getGameHistory } from "../../utils/gameHistory";
import { colors, radii } from "../../theme";
import { authApi } from "../../services/api";

export default function StatsScreen() {
  const { user, token } = useAuth();
  const [history, setHistory] = useState({});
  const [serverStats, setServerStats] = useState(null);
  const [statsError, setStatsError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = useCallback(
    async () => setHistory(await getGameHistory(user?.id || "guest")),
    [user?.id],
  );
  useEffect(() => {
    refresh();
  }, [refresh, refreshKey]);
  useEffect(() => {
    let active = true;
    if (!token || user?.isGuest) {
      setServerStats(null);
      return undefined;
    }
    authApi
      .stats(token)
      .then((data) => {
        if (active) {
          setServerStats(data);
          setStatsError("");
        }
      })
      .catch((error) => {
        if (active) {
          setServerStats(null);
          setStatsError(
            error.message || "Server match history is unavailable.",
          );
        }
      });
    return () => {
      active = false;
    };
  }, [token, user?.id, user?.isGuest, refreshKey]);
  const rows = useMemo(
    () =>
      games
        .map((game) => ({
          ...game,
          plays: Math.max(0, Number(history[game.id]?.plays) || 0),
          lastPlayedAt: Math.max(
            0,
            Number(history[game.id]?.lastPlayedAt) || 0,
          ),
        }))
        .sort(
          (a, b) =>
            b.plays - a.plays ||
            b.lastPlayedAt - a.lastPlayedAt ||
            a.name.localeCompare(b.name),
        ),
    [history],
  );
  const total = rows.reduce((sum, row) => sum + row.plays, 0);
  const explored = rows.filter((row) => row.plays > 0).length;
  const max = Math.max(1, ...rows.map((row) => row.plays));

  return (
    <Screen>
      <Text
        style={{
          color: colors.cyan,
          fontSize: 12,
          fontWeight: "900",
          letterSpacing: 1.2,
        }}
      >
        YOUR ACTIVITY
      </Text>
      <Text
        style={{
          color: colors.text,
          fontSize: 30,
          lineHeight: 36,
          fontWeight: "900",
          marginTop: 7,
        }}
      >
        Game dashboard
      </Text>
      <Text style={{ color: colors.muted, lineHeight: 21, marginTop: 8 }}>
        Completed results come from server game-completion events. Local
        launches below only mean you opened a game screen; they are not match
        results.
      </Text>
      {statsError ? (
        <Text
          accessibilityRole="alert"
          style={{
            color: colors.orange || colors.cyan,
            lineHeight: 20,
            marginTop: 8,
          }}
        >
          {statsError}
        </Text>
      ) : null}
      {serverStats ? (
        <>
          <View style={{ flexDirection: "row", gap: 10, marginTop: 18 }}>
            {[
              {
                label: "Completed matches",
                value: serverStats.overall?.gamesPlayed ?? 0,
              },
              {
                label: "Wins / losses",
                value: `${serverStats.overall?.wins ?? 0} / ${serverStats.overall?.losses ?? 0}`,
              },
              {
                label: "Win rate",
                value:
                  serverStats.overall?.winRate == null
                    ? "—"
                    : `${serverStats.overall.winRate}%`,
              },
            ].map((metric) => (
              <View
                key={metric.label}
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: radii.lg,
                  backgroundColor: colors.surface,
                  padding: 12,
                }}
              >
                <Text
                  style={{
                    color: colors.muted,
                    fontSize: 11,
                    fontWeight: "800",
                  }}
                >
                  {metric.label}
                </Text>
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 23,
                    fontWeight: "900",
                    marginTop: 5,
                  }}
                >
                  {metric.value}
                </Text>
              </View>
            ))}
          </View>
          <View
            style={{
              marginTop: 16,
              padding: 15,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: radii.lg,
              backgroundColor: colors.surface,
            }}
          >
            <Text
              style={{ color: colors.text, fontSize: 18, fontWeight: "900" }}
            >
              Completed matches by game
            </Text>
            {(serverStats.byGame || []).length ? (
              serverStats.byGame.map((row) => {
                const name =
                  games.find((game) => game.id === row.gameId)?.name ||
                  row.gameId;
                const maxGames = Math.max(
                  1,
                  ...(serverStats.byGame || []).map(
                    (item) => Number(item.gamesPlayed) || 0,
                  ),
                );
                return (
                  <View key={row.gameId} style={{ marginTop: 13 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        gap: 10,
                        marginBottom: 6,
                      }}
                    >
                      <Text
                        style={{ color: colors.text, flex: 1, fontSize: 13 }}
                      >
                        {name}
                      </Text>
                      <Text style={{ color: colors.muted, fontSize: 11 }}>
                        {row.gamesPlayed} · {row.wins}W/{row.losses}L
                      </Text>
                    </View>
                    <View
                      style={{
                        height: 8,
                        borderRadius: 9,
                        overflow: "hidden",
                        backgroundColor: colors.surface2,
                      }}
                    >
                      <View
                        style={{
                          height: 8,
                          width: `${Math.max(0, Math.min(100, (Number(row.gamesPlayed) / maxGames) * 100))}%`,
                          backgroundColor: colors.cyan,
                        }}
                      />
                    </View>
                    <Text
                      style={{
                        color: colors.muted,
                        fontSize: 10,
                        marginTop: 4,
                      }}
                    >
                      Win rate{" "}
                      {row.winRate == null ? "unknown" : `${row.winRate}%`} ·
                      unknown results: {row.unknownResults || 0}
                    </Text>
                  </View>
                );
              })
            ) : (
              <Text
                style={{ color: colors.muted, marginTop: 12, lineHeight: 20 }}
              >
                No completed matches have been recorded yet. Install the
                statistics migration and play supported game modes.
              </Text>
            )}
            <Text
              style={{
                color: colors.muted,
                fontSize: 11,
                lineHeight: 17,
                marginTop: 12,
              }}
            >
              {serverStats.note}
            </Text>
          </View>
        </>
      ) : null}
      {serverStats ? (
        <View
          style={{
            marginTop: 14,
            padding: 15,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: radii.lg,
            backgroundColor: colors.surface,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <Text
              style={{ color: colors.text, fontSize: 18, fontWeight: "900" }}
            >
              Match activity · last 30 days
            </Text>
            <Text style={{ color: colors.muted, fontSize: 11 }}>
              {(serverStats.daily || []).reduce(
                (sum, item) => sum + Number(item.gamesPlayed || 0),
                0,
              )}{" "}
              matches
            </Text>
          </View>
          <View
            accessibilityRole="image"
            accessibilityLabel="Bar chart of completed matches over the last 30 days"
            style={{
              height: 112,
              flexDirection: "row",
              alignItems: "stretch",
              gap: 3,
            }}
          >
            {(() => {
              const daily = serverStats.daily || [];
              const maximum = Math.max(
                1,
                ...daily.map((item) => Number(item.gamesPlayed) || 0),
              );
              return daily.map((item) => (
                <View
                  key={item.day}
                  style={{
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "flex-end",
                  }}
                >
                  <View
                    style={{
                      width: "100%",
                      maxWidth: 13,
                      height: Math.max(
                        2,
                        (Number(item.gamesPlayed) / maximum) * 91,
                      ),
                      borderTopLeftRadius: 4,
                      borderTopRightRadius: 4,
                      backgroundColor: Number(item.gamesPlayed)
                        ? colors.cyan
                        : colors.surface2,
                    }}
                  />
                </View>
              ));
            })()}
          </View>
          <Text style={{ color: colors.muted, fontSize: 10, marginTop: 8 }}>
            Each bar is one day; values are completed matches recorded by the
            server.
          </Text>
        </View>
      ) : null}
      <View style={{ flexDirection: "row", gap: 10, marginTop: 18 }}>
        {[
          { label: "Game launches", value: total },
          { label: "Games explored", value: `${explored}/15` },
        ].map((metric) => (
          <View
            key={metric.label}
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: radii.lg,
              backgroundColor: colors.surface,
              padding: 14,
            }}
          >
            <Text
              style={{ color: colors.muted, fontSize: 12, fontWeight: "800" }}
            >
              {metric.label}
            </Text>
            <Text
              style={{
                color: colors.text,
                fontSize: 28,
                fontWeight: "900",
                marginTop: 5,
              }}
            >
              {metric.value}
            </Text>
          </View>
        ))}
      </View>
      <View
        style={{
          marginTop: 16,
          padding: 15,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radii.lg,
          backgroundColor: colors.surface,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: "900" }}>
            Launches by game
          </Text>
          <Pressable onPress={() => setRefreshKey((key) => key + 1)}>
            <Text
              style={{ color: colors.cyan, fontSize: 12, fontWeight: "900" }}
            >
              Refresh
            </Text>
          </Pressable>
        </View>
        {rows.map((row) => (
          <View key={row.id} style={{ marginTop: 11 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                gap: 12,
                marginBottom: 5,
              }}
            >
              <Text style={{ color: colors.text, fontSize: 13, flex: 1 }}>
                {row.name}
              </Text>
              <Text
                style={{ color: colors.muted, fontSize: 12, fontWeight: "800" }}
              >
                {row.plays}
              </Text>
            </View>
            <View
              style={{
                height: 8,
                borderRadius: 9,
                overflow: "hidden",
                backgroundColor: colors.surface2,
              }}
            >
              <View
                style={{
                  height: 8,
                  width: `${(row.plays / max) * 100}%`,
                  minWidth: 0,
                  backgroundColor: colors.cyan,
                  borderRadius: 9,
                }}
              />
            </View>
            {row.lastPlayedAt > 0 ? (
              <Text style={{ color: colors.muted, fontSize: 10, marginTop: 4 }}>
                Last opened {new Date(row.lastPlayedAt).toLocaleDateString()}
              </Text>
            ) : null}
          </View>
        ))}
      </View>
    </Screen>
  );
}
