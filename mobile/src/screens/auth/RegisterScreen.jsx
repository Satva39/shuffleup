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

export default function RegisterScreen({ navigation, route }) {
  const { register } = useAuth();
  const redirectRoomCode = route.params?.redirectRoomCode;
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const set = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));
  async function submit() {
    if (!form.username.trim() || !form.email.trim() || !form.password)
      return Alert.alert("Missing details", "Complete all fields.");
    try {
      setLoading(true);
      await register(form);
      if (redirectRoomCode) {
        navigation.replace("Room", { roomCode: redirectRoomCode });
      }
    } catch (error) {
      Alert.alert("Could not create account", error.message);
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
            One account for every table on ShuffleUp.
          </Text>
          <Field
            label="Username"
            value={form.username}
            onChangeText={(v) => set("username", v)}
            placeholder="Your username"
          />
          <Field
            label="Email"
            value={form.email}
            onChangeText={(v) => set("email", v)}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Field
            label="Password"
            value={form.password}
            onChangeText={(v) => set("password", v)}
            placeholder="At least 8 characters"
            secureTextEntry
          />
          <AppButton
            title="Create account"
            onPress={submit}
            loading={loading}
            style={{ marginTop: 10 }}
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
