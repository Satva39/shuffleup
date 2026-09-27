import { Alert, Text, View } from "react-native";
import Screen from "../../components/Screen";
import AppButton from "../../components/AppButton";
import { useAuth } from "../../context/AuthStore";
import { colors, radii } from "../../theme";

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  return (
    <Screen>
      <Text style={{ color: colors.text, fontSize: 30, fontWeight: "900" }}>
        Profile
      </Text>
      <View
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: radii.lg,
          padding: 20,
          marginTop: 22,
        }}
      >
        <Text style={{ color: colors.text, fontSize: 23, fontWeight: "900" }}>
          {user?.username}
        </Text>
        <Text style={{ color: colors.muted, marginTop: 5 }}>{user?.email}</Text>
        <View
          style={{
            height: 1,
            backgroundColor: colors.border,
            marginVertical: 20,
          }}
        />
        <Text
          style={{
            color: colors.muted,
            fontSize: 12,
            fontWeight: "800",
            letterSpacing: 1,
          }}
        >
          ACCOUNT ID
        </Text>
        <Text style={{ color: colors.text, marginTop: 5 }}>{user?.id}</Text>
      </View>
      <AppButton
        title="Log out"
        variant="secondary"
        style={{ marginTop: 18 }}
        onPress={() =>
          Alert.alert("Log out?", "You will need to sign in again.", [
            { text: "Cancel", style: "cancel" },
            { text: "Log out", style: "destructive", onPress: logout },
          ])
        }
      />
    </Screen>
  );
}
