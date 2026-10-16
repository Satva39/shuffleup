import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Screen from "../../components/Screen";
import BrandMark from "../../components/BrandMark";
import GameCard from "../../components/GameCard";
import { games } from "../../data/games";
import { colors, radii } from "../../theme";
import { useAuth } from "../../context/AuthStore";
import { shuffleSocket } from "../../services/socket";
import { API_URL } from "../../constants/config";

const SCREEN_BY_GAME = {
  kachuful: "KachufulGame", "teen-patti": "TeenPattiGame", "indian-rummy": "IndianRummyGame",
  mangoose: "MangooseGame", uno: "UnoGame", "jack-thief": "JackThiefGame", napoleon: "NapoleonGame",
  bridge: "BridgeGame", spades: "SpadesGame", "twenty-nine": "TwentyNineGame", "mindi-coat": "MindiCoatGame",
  bluff: "BluffGame", "satte-pe-satta": "SattePeSattaGame", war: "WarGame", solitaire: "SolitaireGame",
};

export default function HomeScreen({ navigation }) {
  const { user, token, logout } = useAuth();
  const [demoRemaining, setDemoRemaining] = useState(120);
  const featured = games.slice(0, 3);
  const [activeRoom, setActiveRoom] = useState(null);
  const [liveCounts, setLiveCounts] = useState({});

  useEffect(() => {
    let active = true;
    let timer;
    const refresh = async () => {
      try {
        const response = await fetch(`${API_URL.replace(/\/$/, "")}/api/live-counts`, { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json();
        if (active) setLiveCounts(data.games || {});
      } catch { /* live counts must never block navigation */ }
    };
    refresh();
    timer = setInterval(refresh, 15000);
    return () => { active = false; clearInterval(timer); };
  }, []);

  useEffect(() => {
    if (!user?.isGuest || !user.demoExpiresAt) return undefined;
    const update = () => setDemoRemaining(Math.max(0, Math.ceil((Number(user.demoExpiresAt) - Date.now()) / 1000)));
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [user?.isGuest, user?.demoExpiresAt]);

  useEffect(() => {
    if (!token || user?.isGuest) { setActiveRoom(null); return undefined; }
    let active = true;
    const requestRoom = () => {
      if (!shuffleSocket.isConnected()) return;
      shuffleSocket.emitSafe("get-my-active-room", {}, (result) => {
        if (active) setActiveRoom(result?.success && result.room ? result : null);
      });
    };
    const socket = shuffleSocket.getSocket();
    const offConnect = shuffleSocket.on("connect", requestRoom);
    if (socket?.connected) requestRoom();
    return () => { active = false; offConnect(); };
  }, [token]);

  const rejoin = useCallback(() => {
    if (!activeRoom?.room) return;
    const { room } = activeRoom;
    if (room.status === "waiting") {
      navigation.navigate("Room", { roomCode: room.code });
      return;
    }
    const screen = SCREEN_BY_GAME[room.gameId];
    if (screen) navigation.navigate(screen, { roomCode: room.code });
    else navigation.navigate("Main", { screen: "Lobby" });
  }, [activeRoom, navigation]);

  return (
    <Screen>
      <BrandMark compact />
      {user?.isGuest ? (
        <View style={{ marginTop: 12, padding: 14, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.cyan, flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.cyan, fontWeight: "900", fontSize: 13 }}>2-MINUTE DEMO · {Math.floor(demoRemaining / 60)}:{String(demoRemaining % 60).padStart(2, "0")}</Text>
            <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>Demo sessions can play bot games. Create an account to keep playing.</Text>
          </View>
          <Pressable onPress={async () => { await logout(); navigation.getParent()?.navigate("Register"); }} accessibilityRole="button"><Text style={{ color: colors.cyan, fontWeight: "900", fontSize: 12 }}>Sign up</Text></Pressable>
        </View>
      ) : null}
      {activeRoom?.room ? (
        <Pressable onPress={rejoin} style={{ marginTop: 18, padding: 16, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.primary, backgroundColor: colors.surface, flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: "900" }}>Rejoin your game</Text>
            <Text style={{ color: colors.muted, marginTop: 4, fontSize: 13 }}>Room {activeRoom.room.code} · {games.find((item) => item.id === activeRoom.room.gameId)?.name || activeRoom.room.gameId}</Text>
          </View>
          <Text style={{ color: colors.primary, fontSize: 26, fontWeight: "900" }}>›</Text>
        </Pressable>
      ) : null}
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
      <Pressable
        accessibilityRole="button"
        onPress={() => navigation.navigate("Friends")}
        style={{ marginTop: 20, padding: 15, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: "900" }}>Friends & Challenges</Text>
          <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>Add players and invite them to a game</Text>
        </View>
        <Text style={{ color: colors.cyan, fontSize: 26, fontWeight: "900" }}>›</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() => navigation.navigate("Stats")}
        style={{ marginTop: 10, padding: 15, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: "900" }}>Game dashboard</Text>
          <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>View match results and recorded game activity</Text>
        </View>
        <Text style={{ color: colors.cyan, fontSize: 26, fontWeight: "900" }}>›</Text>
      </Pressable>
      <View style={{ marginTop: 14 }}>
        {featured.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            onPress={() => navigation.navigate("Games", { gameId: game.id })}
            liveCount={liveCounts[game.id]?.connectedHumans}
          />
        ))}
      </View>
    </Screen>
  );
}
