import { Ionicons } from "@expo/vector-icons";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../theme";
import { useAuth } from "../context/AuthContext";
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

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();
const screenOptions = {
  headerShown: false,
  contentStyle: { backgroundColor: colors.bg },
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
          height: 64 + bottomInset,
          paddingTop: 7,
          paddingBottom: bottomInset + 6,
          elevation: 10,
          shadowColor: "#000000",
          shadowOpacity: 0.24,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: -4 },
        },
        tabBarItemStyle: { flex: 1 },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 10.5, fontWeight: "800", marginTop: 1 },
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
      <Stack.Navigator screenOptions={screenOptions}>
        {user ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="Room" component={RoomScreen} />
            <Stack.Screen name="GamePreview" component={GamePreviewScreen} />
            <Stack.Screen name="Manual" component={ManualScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
