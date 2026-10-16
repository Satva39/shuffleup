import { Ionicons } from "@expo/vector-icons";
import { Alert, Pressable, Text, View } from "react-native";
import {
  NavigationContainer,
  DefaultTheme,
  useNavigationContainerRef,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRef, useState } from "react";
import { recordGamePlayed } from "../utils/gameHistory";
import GameExperienceLayer from "../components/game-experience/GameExperienceLayer";
import { shuffleSocket } from "../services/socket";
import { colors } from "../theme";
import { useAuth } from "../context/AuthStore";
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
import ForgotPasswordScreen from "../screens/auth/ForgotPasswordScreen";
import ResetPasswordScreen from "../screens/auth/ResetPasswordScreen";
import HomeScreen from "../screens/main/HomeScreen";
import GamesScreen from "../screens/main/GamesScreen";
import ManualsScreen from "../screens/main/ManualsScreen";
import ProfileScreen from "../screens/main/ProfileScreen";
import FriendsScreen from "../screens/main/FriendsScreen";
import StatsScreen from "../screens/main/StatsScreen";
import SettingsScreen from "../screens/main/SettingsScreen";
import LobbyScreen from "../screens/rooms/LobbyScreen";
import RoomScreen from "../screens/rooms/RoomScreen";
import PlayWithBotsScreen from "../screens/rooms/PlayWithBotsScreen";
import GamePreviewScreen from "../screens/games/GamePreviewScreen";
import ManualScreen from "../screens/games/ManualScreen";
import KachufulGameScreen from "../games/kachuful/pages/KachufulGameScreen";
import TeenPattiGameScreen from "../games/teen-patti/pages/TeenPattiGameScreen";
import IndianRummyGameScreen from "../games/indian-rummy/pages/IndianRummyGameScreen";
import MangooseGameScreen from "../games/mangoose/pages/MangooseGameScreen";
import UnoGameScreen from "../games/uno/pages/UnoGameScreen";
import JackThiefGameScreen from "../games/jack-thief/pages/JackThiefGameScreen";
import NapoleonGameScreen from "../games/napoleon/pages/NapoleonGameScreen";
import BridgeGameScreen from "../games/bridge/pages/BridgeGameScreen";
import SpadesGameScreen from "../games/spades/pages/SpadesGameScreen";
import TwentyNineGameScreen from "../games/twenty-nine/pages/TwentyNineGameScreen";
import MindiCoatGameScreen from "../games/mindi-coat/pages/MindiCoatGameScreen";
import BluffGameScreen from "../games/bluff/pages/BluffGameScreen";
import SattePeSattaGameScreen from "../games/satte-pe-satta/pages/SattePeSattaGameScreen";
import WarGameScreen from "../games/war/pages/WarGameScreen";
import SolitaireGameScreen from "../games/solitaire/pages/SolitaireGameScreen";

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

const linking = {
  prefixes: ["https://shuffleup-five.vercel.app", "shuffleup://"],
  config: {
    screens: {
      Room: "room/:roomCode",
      ResetPassword: "reset-password",
    },
  },
};

const tabIcons = {
  Home: ["home", "home-outline"],
  Games: ["grid", "grid-outline"],
  Lobby: ["people", "people-outline"],
  HowToPlay: ["book", "book-outline"],
  Profile: ["person-circle", "person-circle-outline"],
};

function MainTabs() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 6);

  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 62 + bottomInset,
          paddingTop: 7,
          paddingBottom: bottomInset + 5,
          elevation: 12,
          shadowColor: "#000",
          shadowOpacity: 0.28,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: -4 },
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: {
          fontSize: 10.5,
          fontWeight: "800",
          marginTop: 1,
        },
        tabBarHideOnKeyboard: true,
        tabBarIcon: ({ focused, color, size }) => {
          const [active, inactive] = tabIcons[route.name] || [
            "ellipse",
            "ellipse-outline",
          ];
          return (
            <Ionicons
              name={focused ? active : inactive}
              size={size + 1}
              color={color}
            />
          );
        },
      })}
    >
      <Tabs.Screen name="Home" component={HomeScreen} />
      <Tabs.Screen name="Games" component={GamesScreen} />
      {!user?.isGuest && (
        <Tabs.Screen
          name="Lobby"
          component={LobbyScreen}
          options={{ title: "Play" }}
        />
      )}
      <Tabs.Screen
        name="HowToPlay"
        component={ManualsScreen}
        options={{ title: "Rules" }}
      />
      {!user?.isGuest && (
        <Tabs.Screen name="Profile" component={ProfileScreen} />
      )}
    </Tabs.Navigator>
  );
}

function gameScreenOptions(title, navigation, route) {
  function confirmNewGame() {
    const gameId = GAME_SCREEN_IDS[route?.name];
    if (!gameId) return;
    Alert.alert(
      "Start a new game?",
      "You will leave this table and create a fresh game session.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave and continue",
          style: "destructive",
          onPress: () => {
            const roomCode = route?.params?.roomCode;
            if (roomCode && shuffleSocket.isConnected()) {
              shuffleSocket.emitSafe("leave-room", { roomCode }, () => {});
            }
            navigation.navigate("GamePreview", { gameId });
          },
        },
      ],
    );
  }
  return {
    headerShown: true,
    title,
    headerBackVisible: true,
    headerTintColor: colors.text,
    headerStyle: { backgroundColor: colors.surface },
    headerTitleStyle: { color: colors.text, fontSize: 16, fontWeight: "800" },
    headerShadowVisible: false,
    headerRight: () => (
      <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Start a new game"
          hitSlop={10}
          onPress={confirmNewGame}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            paddingVertical: 8,
          }}
        >
          <Ionicons name="refresh-outline" size={19} color={colors.cyan} />
          <Text style={{ color: colors.cyan, fontWeight: "800", fontSize: 13 }}>
            New
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go to home"
          hitSlop={10}
          onPress={() => navigation.navigate("Main", { screen: "Home" })}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            paddingVertical: 8,
          }}
        >
          <Ionicons name="home-outline" size={19} color={colors.cyan} />
          <Text style={{ color: colors.cyan, fontWeight: "800", fontSize: 13 }}>
            Home
          </Text>
        </Pressable>
      </View>
    ),
    gestureEnabled: false,
  };
}

const GAME_SCREEN_IDS = {
  KachufulGame: "kachuful",
  TeenPattiGame: "teen-patti",
  IndianRummyGame: "indian-rummy",
  MangooseGame: "mangoose",
  UnoGame: "uno",
  JackThiefGame: "jack-thief",
  NapoleonGame: "napoleon",
  BridgeGame: "bridge",
  SpadesGame: "spades",
  TwentyNineGame: "twenty-nine",
  MindiCoatGame: "mindi-coat",
  BluffGame: "bluff",
  SattePeSattaGame: "satte-pe-satta",
  WarGame: "war",
  SolitaireGame: "solitaire",
};

export default function AppNavigator() {
  const { user, loading } = useAuth();
  const navigationRef = useNavigationContainerRef();
  const lastTrackedRouteRef = useRef(null);
  const [currentRoute, setCurrentRoute] = useState(null);
  const trackCurrentGame = () => {
    const route = navigationRef.getCurrentRoute();
    setCurrentRoute(route || null);
    const gameId = GAME_SCREEN_IDS[route?.name];
    if (!gameId) {
      lastTrackedRouteRef.current = route?.key || route?.name || null;
      return;
    }
    const trackingKey = `${route.key || route.name}:${route.params?.roomCode || ""}`;
    if (lastTrackedRouteRef.current === trackingKey) return;
    lastTrackedRouteRef.current = trackingKey;
    void recordGamePlayed(user?.id || "guest", gameId).catch(() => {});
  };
  if (loading) return null;

  return (
    <NavigationContainer
      ref={navigationRef}
      linking={linking}
      onReady={trackCurrentGame}
      onStateChange={trackCurrentGame}
      theme={{
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: colors.bg,
          card: colors.surface,
          text: colors.text,
          border: colors.border,
          primary: colors.primary,
        },
      }}
    >
      <GameExperienceLayer
        active={Boolean(GAME_SCREEN_IDS[currentRoute?.name])}
      />
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: "fade",
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        {user ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            {user?.isGuest ? (
              <Stack.Screen name="Register" component={RegisterScreen} />
            ) : null}
            <Stack.Screen name="Room" component={RoomScreen} />
            <Stack.Screen name="PlayWithBots" component={PlayWithBotsScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen
              name="ResetPassword"
              component={ResetPasswordScreen}
            />
            <Stack.Screen
              name="Friends"
              component={FriendsScreen}
              options={{
                title: "Friends & Challenges",
                headerShown: true,
                headerTintColor: colors.text,
                headerStyle: { backgroundColor: colors.surface },
                headerTitleStyle: { color: colors.text, fontWeight: "800" },
              }}
            />
            <Stack.Screen
              name="Stats"
              component={StatsScreen}
              options={{
                title: "Game dashboard",
                headerShown: true,
                headerTintColor: colors.text,
                headerStyle: { backgroundColor: colors.surface },
                headerTitleStyle: { color: colors.text, fontWeight: "800" },
              }}
            />
            <Stack.Screen name="GamePreview" component={GamePreviewScreen} />
            <Stack.Screen name="Manual" component={ManualScreen} />
            <Stack.Screen
              name="KachufulGame"
              component={KachufulGameScreen}
              options={({ navigation, route }) =>
                gameScreenOptions("Kachuful", navigation, route)
              }
            />
            <Stack.Screen
              name="TeenPattiGame"
              component={TeenPattiGameScreen}
              options={({ navigation, route }) =>
                gameScreenOptions("Teen Patti", navigation, route)
              }
            />
            <Stack.Screen
              name="IndianRummyGame"
              component={IndianRummyGameScreen}
              options={({ navigation, route }) =>
                gameScreenOptions("Indian Rummy", navigation, route)
              }
            />
            <Stack.Screen
              name="MangooseGame"
              component={MangooseGameScreen}
              options={({ navigation, route }) =>
                gameScreenOptions("Mangoose", navigation, route)
              }
            />
            <Stack.Screen
              name="UnoGame"
              component={UnoGameScreen}
              options={({ navigation, route }) =>
                gameScreenOptions("UNO", navigation, route)
              }
            />
            <Stack.Screen
              name="JackThiefGame"
              component={JackThiefGameScreen}
              options={({ navigation, route }) =>
                gameScreenOptions("Jack Thief", navigation, route)
              }
            />
            <Stack.Screen
              name="NapoleonGame"
              component={NapoleonGameScreen}
              options={({ navigation, route }) =>
                gameScreenOptions("Napoleon", navigation, route)
              }
            />
            <Stack.Screen
              name="BridgeGame"
              component={BridgeGameScreen}
              options={({ navigation, route }) =>
                gameScreenOptions("Bridge", navigation, route)
              }
            />
            <Stack.Screen
              name="SpadesGame"
              component={SpadesGameScreen}
              options={({ navigation, route }) =>
                gameScreenOptions("Spades", navigation, route)
              }
            />
            <Stack.Screen
              name="TwentyNineGame"
              component={TwentyNineGameScreen}
              options={({ navigation, route }) =>
                gameScreenOptions("Twenty-Nine", navigation, route)
              }
            />
            <Stack.Screen
              name="MindiCoatGame"
              component={MindiCoatGameScreen}
              options={({ navigation, route }) =>
                gameScreenOptions("Mindi Coat", navigation, route)
              }
            />
            <Stack.Screen
              name="BluffGame"
              component={BluffGameScreen}
              options={({ navigation, route }) =>
                gameScreenOptions("Bluff", navigation, route)
              }
            />
            <Stack.Screen
              name="SattePeSattaGame"
              component={SattePeSattaGameScreen}
              options={({ navigation, route }) =>
                gameScreenOptions("Satte Pe Satta", navigation, route)
              }
            />
            <Stack.Screen
              name="WarGame"
              component={WarGameScreen}
              options={({ navigation, route }) =>
                gameScreenOptions("War", navigation, route)
              }
            />
            <Stack.Screen
              name="SolitaireGame"
              component={SolitaireGameScreen}
              options={({ navigation, route }) =>
                gameScreenOptions("Solitaire", navigation, route)
              }
            />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen
              name="ForgotPassword"
              component={ForgotPasswordScreen}
            />
            <Stack.Screen
              name="ResetPassword"
              component={ResetPasswordScreen}
            />
            <Stack.Screen name="Room" component={RoomScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
