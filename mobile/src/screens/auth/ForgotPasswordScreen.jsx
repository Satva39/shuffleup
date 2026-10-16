import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import BrandMark from "../../components/BrandMark";
import AppButton from "../../components/AppButton";
import { authApi } from "../../services/api";
import { colors, radii } from "../../theme";

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit() {
    if (!email.trim())
      return Alert.alert("Email required", "Enter your account email.");
    setLoading(true);
    try {
      const result = await authApi.forgotPassword(email.trim());
      Alert.alert(
        "Check your email",
        `${result.message || "If an account is eligible, reset instructions will be sent."}\n\nOpen the link on this device or any browser, then return here to sign in.`,
        [{ text: "Back to sign in", onPress: () => navigation.goBack() }],
      );
    } catch (error) {
      Alert.alert(
        "Request unavailable",
        error.message || "Please try again later.",
      );
    } finally {
      setLoading(false);
    }
  }
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: colors.bg }}
    >
      <LinearGradient
        colors={["#131B3D", colors.bg]}
        style={{ flex: 1, padding: 24, justifyContent: "center" }}
      >
        <BrandMark />
        <View style={{ marginTop: 48 }}>
          <Text style={{ color: colors.text, fontSize: 30, fontWeight: "900" }}>
            Reset your password.
          </Text>
          <Text style={{ color: colors.muted, marginTop: 8, lineHeight: 22 }}>
            We will send a one-time reset link if the account is eligible.
          </Text>
          <Text
            style={{
              color: colors.muted,
              marginTop: 24,
              marginBottom: 8,
              fontSize: 13,
              fontWeight: "700",
            }}
          >
            Email
          </Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor="#5F6C88"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={255}
            style={{
              color: colors.text,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: radii.md,
              paddingHorizontal: 16,
              minHeight: 54,
              fontSize: 16,
            }}
          />
          <AppButton
            title="Send reset link"
            onPress={submit}
            loading={loading}
            style={{ marginTop: 16 }}
          />
          <Text
            onPress={() => navigation.goBack()}
            style={{
              color: colors.cyan,
              textAlign: "center",
              marginTop: 22,
              fontWeight: "800",
            }}
          >
            Back to sign in
          </Text>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}
