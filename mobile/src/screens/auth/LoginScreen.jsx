import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import BrandMark from "../../components/BrandMark";
import AppButton from "../../components/AppButton";
import { useAuth } from "../../context/AuthStore";
import { authApi } from "../../services/api";
import { colors, radii } from "../../theme";

export default function LoginScreen({ navigation, route }) {
  const { login, startDemo, demoExpired, clearDemoExpired } = useAuth();
  const redirectRoomCode = route.params?.redirectRoomCode;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [canResendVerification, setCanResendVerification] = useState(false);

  useEffect(() => {
    if (!demoExpired) return;
    Alert.alert("Demo finished", "Your two-minute demo has ended. Sign in or create an account to keep playing.", [{ text: "OK", onPress: clearDemoExpired }]);
  }, [demoExpired, clearDemoExpired]);

  async function submit() {
    if (!email.trim() || !password) return Alert.alert("Missing details", "Enter your email and password.");
    try {
      setLoading(true);
      setCanResendVerification(false);
      await login({ email: email.trim(), password });
      if (redirectRoomCode) navigation.replace("Room", { roomCode: redirectRoomCode });
    } catch (error) {
      setCanResendVerification(Boolean(error.data?.verificationRequired));
      Alert.alert("Login failed", error.message || "Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function beginDemo() {
    try {
      setLoading(true);
      await startDemo();
    } catch (error) {
      Alert.alert("Demo unavailable", error?.message || "Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  async function resendVerification() {
    if (!email.trim()) return Alert.alert("Email required", "Enter the email address used to register.");
    try {
      setLoading(true);
      const result = await authApi.resendVerification(email.trim());
      Alert.alert("Check your email", result.message || "If verification is needed, a link will be sent.");
    } catch (error) {
      Alert.alert("Request unavailable", error.message || "Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, backgroundColor: colors.bg }}>
      <LinearGradient colors={["#131B3D", colors.bg]} style={{ flex: 1, padding: 24, justifyContent: "center" }}>
        <BrandMark />
        <View style={{ marginTop: 48 }}>
          <Text style={{ color: colors.text, fontSize: 30, fontWeight: "900", letterSpacing: -0.8 }}>Welcome back.</Text>
          <Text style={{ color: colors.muted, fontSize: 15, marginTop: 8, lineHeight: 22 }}>Your table is waiting. Sign in to continue playing.</Text>
          <Field label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" maxLength={255} />
          <Field label="Password" value={password} onChangeText={setPassword} placeholder="Your password" secureTextEntry={!showPassword} autoCapitalize="none" />
          <Pressable onPress={() => setShowPassword((value) => !value)} accessibilityRole="button" accessibilityLabel={showPassword ? "Hide password" : "Show password"} hitSlop={8} style={{ alignSelf: "flex-end", marginTop: 8, padding: 4 }}>
            <Text style={{ color: colors.cyan, fontWeight: "800" }}>{showPassword ? "Hide password" : "Show password"}</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate("ForgotPassword")} hitSlop={8} style={{ alignSelf: "flex-end", marginTop: 14, padding: 4 }}>
            <Text style={{ color: colors.cyan, fontWeight: "800" }}>Forgot password?</Text>
          </Pressable>
          <AppButton title="Sign in" onPress={submit} loading={loading} style={{ marginTop: 12 }} />
          <AppButton title="Try a 2-minute demo" variant="secondary" onPress={beginDemo} loading={loading} style={{ marginTop: 10 }} />
          {canResendVerification && (
            <AppButton title="Resend verification email" variant="secondary" onPress={resendVerification} loading={loading} style={{ marginTop: 10 }} />
          )}
          <Text onPress={() => navigation.navigate("Register", { redirectRoomCode })} style={{ color: colors.muted, textAlign: "center", marginTop: 22 }}>
            New to ShuffleUp? <Text style={{ color: colors.cyan, fontWeight: "800" }}>Create account</Text>
          </Text>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

function Field({ label, ...props }) {
  return (
    <View style={{ marginTop: 18 }}>
      <Text style={{ color: colors.muted, marginBottom: 8, fontSize: 13, fontWeight: "700" }}>{label}</Text>
      <TextInput
        {...props}
        placeholderTextColor="#5F6C88"
        autoCorrect={false}
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
    </View>
  );
}
