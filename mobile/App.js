import { StatusBar, View } from "react-native";
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import AppNavigator from "./src/navigation/AppNavigator";
import { AuthProvider } from "./src/context/AuthStore";
import LastPlayedCardToast from "./src/components/LastPlayedCardToast";

export default function App() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <StatusBar barStyle="light-content" backgroundColor="#070B17" />
      <AuthProvider>
        <View style={{ flex: 1 }}>
          <AppNavigator />
          <LastPlayedCardToast />
        </View>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
