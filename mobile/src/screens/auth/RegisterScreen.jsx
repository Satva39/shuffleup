import { useState } from "react";
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
import { colors, radii } from "../../theme";

export default function RegisterScreen({ navigation, route }) {
  const { register } = useAuth();
  const redirectRoomCode = route.params?.redirectRoomCode;
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const set = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));

  async function submit() {
    if (!form.username.trim() || !form.email.trim() || !form.password) {
      return Alert.alert("Missing details", "Complete all fields.");
    }
    if (form.password.length < 8 || form.password.length > 128) {
      return Alert.alert(
        "Password requirements",
        "Use between 8 and 128 characters.",
      );
    }
    try {
      setLoading(true);
      await register({
        ...form,
        username: form.username.trim(),
        email: form.email.trim(),
      });
      Alert.alert(
        "Check your email",
        "Open the ShuffleUp verification link from your inbox, then sign in. The link expires in 30 minutes.",
        [
          {
            text: "Continue to sign in",
            onPress: () => navigation.replace("Login", { redirectRoomCode }),
          },
        ],
      );
    } catch (error) {
      Alert.alert(
        "Could not create account",
        error.message || "Please try again.",
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
        <View style={{ marginTop: 42 }}>
          <Text style={{ color: colors.text, fontSize: 30, fontWeight: "900" }}>
            Create your account.
          </Text>
          <Text style={{ color: colors.muted, marginTop: 8, lineHeight: 22 }}>
            Verify your email before signing in.
          </Text>
          <Field
            label="Username"
            value={form.username}
            onChangeText={(value) => set("username", value)}
            placeholder="Your username"
            autoCapitalize="none"
            maxLength={30}
          />
          <Field
            label="Email"
            value={form.email}
            onChangeText={(value) => set("email", value)}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            maxLength={255}
          />
          <Field
            label="Password"
            value={form.password}
            onChangeText={(value) => set("password", value)}
            placeholder="8–128 characters"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            maxLength={128}
          />
          <Pressable
            onPress={() => setShowPassword((value) => !value)}
            accessibilityRole="button"
            accessibilityLabel={
              showPassword ? "Hide password" : "Show password"
            }
            hitSlop={8}
            style={{ alignSelf: "flex-end", marginTop: 8, padding: 4 }}
          >
            <Text style={{ color: colors.cyan, fontWeight: "800" }}>
              {showPassword ? "Hide password" : "Show password"}
            </Text>
          </Pressable>
          <Text
            style={{
              color: colors.muted,
              fontSize: 12,
              lineHeight: 17,
              marginTop: 4,
            }}
          >
            Avoid common passwords and repeated characters.
          </Text>
          <AppButton
            title="Create account"
            onPress={submit}
            loading={loading}
            style={{ marginTop: 14 }}
          />
          <Text
            onPress={() => navigation.goBack()}
            style={{ color: colors.muted, textAlign: "center", marginTop: 20 }}
          >
            Already have an account?{" "}
            <Text style={{ color: colors.cyan, fontWeight: "800" }}>
              Sign in
            </Text>
          </Text>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

function Field({ label, ...props }) {
  return (
    <View style={{ marginTop: 16 }}>
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
        autoCorrect={false}
        style={{
          color: colors.text,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radii.md,
          paddingHorizontal: 16,
          minHeight: 52,
          fontSize: 16,
        }}
      />
    </View>
  );
}
