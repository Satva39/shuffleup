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
import { useAuth } from "../../context/AuthStore";
import { colors, radii } from "../../theme";

export default function LoginScreen({ navigation, route }) {
  const { login } = useAuth();
  const redirectRoomCode = route.params?.redirectRoomCode;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!email.trim() || !password)
      return Alert.alert("Missing details", "Enter your email and password.");
    try {
      setLoading(true);
      await login({ email: email.trim(), password });
      if (redirectRoomCode) {
        navigation.replace("Room", { roomCode: redirectRoomCode });
      }
    } catch (error) {
      Alert.alert("Login failed", error.message);
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
          <Text
            style={{
              color: colors.text,
              fontSize: 30,
              fontWeight: "900",
              letterSpacing: -0.8,
            }}
          >
            Welcome back.
          </Text>
          <Text
            style={{
              color: colors.muted,
              fontSize: 15,
              marginTop: 8,
              lineHeight: 22,
            }}
          >
            Your table is waiting. Sign in to continue playing.
          </Text>
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Your password"
            secureTextEntry
          />
          <AppButton
            title="Sign in"
            onPress={submit}
            loading={loading}
            style={{ marginTop: 10 }}
          />
          <Text
            onPress={() => navigation.navigate("Register")}
            style={{ color: colors.muted, textAlign: "center", marginTop: 22 }}
          >
            New to ShuffleUp?{" "}
            <Text style={{ color: colors.cyan, fontWeight: "800" }}>
              Create account
            </Text>
          </Text>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

function Field({ label, ...props }) {
  return (
    <View style={{ marginTop: 18 }}>
      <Text
        style={{
          color: colors.muted,
          marginBottom: 8,
          fontSize: 13,
          fontWeight: "700",
        }}
      >
        {label}
      </Text>
      <TextInput
        {...props}
        placeholderTextColor="#5F6C88"
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
