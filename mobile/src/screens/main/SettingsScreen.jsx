import { Text } from "react-native";
import Screen from "../../components/Screen";
import { colors } from "../../theme";
export default function SettingsScreen() {
  return (
    <Screen>
      <Text style={{ color: colors.text, fontSize: 30, fontWeight: "900" }}>
        Settings
      </Text>
      <Text style={{ color: colors.muted, marginTop: 10, lineHeight: 22 }}>
        This foundation keeps settings intentionally small until production
        requirements are defined.
      </Text>
    </Screen>
  );
}
