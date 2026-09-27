import { Ionicons } from "@expo/vector-icons";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../theme";
import { useAuth } from "../context/AuthStore";
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
import HomeScreen from "../screens/main/HomeScreen";
import GamesScreen from "../screens/main/GamesScreen";
import ManualsScreen from "../screens/main/ManualsScreen";
import ProfileScreen from "../screens/main/ProfileScreen";
import SettingsScreen from "../screens/main/SettingsScreen";
import LobbyScreen from "../screens/rooms/LobbyScreen";
import RoomScreen from "../screens/rooms/RoomScreen";
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
      <Tabs.Screen
        name="Lobby"
        component={LobbyScreen}
        options={{ title: "Play" }}
      />
      <Tabs.Screen
        name="HowToPlay"
        component={ManualsScreen}
        options={{ title: "Rules" }}
      />
      <Tabs.Screen name="Profile" component={ProfileScreen} />
    </Tabs.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();
  if (loading) return null;

  return (
    <NavigationContainer
      linking={linking}
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
            <Stack.Screen name="Room" component={RoomScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="GamePreview" component={GamePreviewScreen} />
            <Stack.Screen name="Manual" component={ManualScreen} />
            <Stack.Screen
              name="KachufulGame"
              component={KachufulGameScreen}
              options={{ gestureEnabled: false }}
            />
            <Stack.Screen
              name="TeenPattiGame"
              component={TeenPattiGameScreen}
              options={{ gestureEnabled: false }}
            />
            <Stack.Screen
              name="IndianRummyGame"
              component={IndianRummyGameScreen}
              options={{ gestureEnabled: false }}
            />
            <Stack.Screen
              name="MangooseGame"
              component={MangooseGameScreen}
              options={{ gestureEnabled: false }}
            />
            <Stack.Screen
              name="UnoGame"
              component={UnoGameScreen}
              options={{ gestureEnabled: false }}
            />
            <Stack.Screen
              name="JackThiefGame"
              component={JackThiefGameScreen}
              options={{ gestureEnabled: false }}
            />
            <Stack.Screen
              name="NapoleonGame"
              component={NapoleonGameScreen}
              options={{ gestureEnabled: false }}
            />
            <Stack.Screen
              name="BridgeGame"
              component={BridgeGameScreen}
              options={{ gestureEnabled: false }}
            />
            <Stack.Screen
              name="SpadesGame"
              component={SpadesGameScreen}
              options={{ gestureEnabled: false }}
            />
            <Stack.Screen
              name="TwentyNineGame"
              component={TwentyNineGameScreen}
              options={{ gestureEnabled: false }}
            />
            <Stack.Screen
              name="MindiCoatGame"
              component={MindiCoatGameScreen}
              options={{ gestureEnabled: false }}
            />
            <Stack.Screen
              name="BluffGame"
              component={BluffGameScreen}
              options={{ gestureEnabled: false }}
            />
            <Stack.Screen
              name="SattePeSattaGame"
              component={SattePeSattaGameScreen}
              options={{ gestureEnabled: false }}
            />
            <Stack.Screen
              name="WarGame"
              component={WarGameScreen}
              options={{ gestureEnabled: false }}
            />
            <Stack.Screen
              name="SolitaireGame"
              component={SolitaireGameScreen}
              options={{ gestureEnabled: false }}
            />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="Room" component={RoomScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
