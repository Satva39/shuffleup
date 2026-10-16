import { useMemo, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import BrandMark from "../../components/BrandMark";
import AppButton from "../../components/AppButton";
import { authApi } from "../../services/api";
import { useAuth } from "../../context/AuthStore";
import { colors, radii } from "../../theme";

export default function ResetPasswordScreen({ navigation, route }) {
  const { user, logout } = useAuth();
  const rawToken = route.params?.token;
  const token = typeof rawToken === "string" ? rawToken : Array.isArray(rawToken) ? rawToken[0] : "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState(false);
  const passwordHint = useMemo(() => {
    if (!password) return "Use 8–128 characters; avoid common passwords and repeated characters.";
    if (password.length < 8 || password.length > 128) return "Password must be between 8 and 128 characters.";
    if (password !== confirmPassword) return "Enter the same password in both fields.";
    return "Passwords match. The server will validate the full password policy.";
  }, [password, confirmPassword]);

  async function submit() {
    if (!token) return Alert.alert("Reset link required", "Open the password reset link from your email again.");
    if (password !== confirmPassword) return Alert.alert("Passwords do not match", "Enter the same new password twice.");
    if (password.length < 8 || password.length > 128) return Alert.alert("Password requirements", "Use between 8 and 128 characters.");
    setLoading(true);
    try {
      const result = await authApi.resetPassword(token, password);
      setComplete(true);
      setPassword("");
      setConfirmPassword("");
      Alert.alert("Password updated", result.message || "You can now sign in with your new password.", [{ text: user ? "Continue" : "Continue to sign in", onPress: async () => { if (user) await logout(); else navigation.navigate("Login"); } }]);
    } catch (error) {
      Alert.alert("Could not reset password", error.message || "The link may have expired. Request a new one and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }}>
        <LinearGradient colors={["#131B3D", colors.bg]} style={{ flexGrow: 1, padding: 24, justifyContent: "center" }}>
          <BrandMark />
          <View style={{ marginTop: 42 }}>
            <Text style={{ color: colors.text, fontSize: 30, fontWeight: "900" }}>Reset password.</Text>
            <Text style={{ color: colors.muted, marginTop: 8, lineHeight: 22 }}>Choose a new password you do not use elsewhere.</Text>
            {!token ? <Text accessibilityRole="alert" style={{ color: colors.danger || "#FF9292", marginTop: 20, lineHeight: 21 }}>This reset link is missing its token. Open the full link from your email or request a new one.</Text> : null}
            {!complete && <>
              <PasswordField label="New password" value={password} onChangeText={setPassword} visible={showPassword} onToggle={() => setShowPassword((value) => !value)} placeholder="8–128 characters" />
              <PasswordField label="Confirm new password" value={confirmPassword} onChangeText={setConfirmPassword} visible={showConfirm} onToggle={() => setShowConfirm((value) => !value)} placeholder="Enter it again" />
              <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 10 }}>{passwordHint}</Text>
              <AppButton title="Update password" onPress={submit} loading={loading} disabled={!token} style={{ marginTop: 18 }} />
            </>}
            <Pressable onPress={() => navigation.navigate("Login")} accessibilityRole="button" style={{ padding: 12, marginTop: 16 }}>
              <Text style={{ color: colors.cyan, textAlign: "center", fontWeight: "800", fontSize: 15 }}>Back to sign in</Text>
            </Pressable>
          </View>
        </LinearGradient>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function PasswordField({ label, value, onChangeText, visible, onToggle, placeholder }) {
  return (
    <View style={{ marginTop: 18 }}>
      <Text style={{ color: colors.muted, marginBottom: 8, fontSize: 13, fontWeight: "700" }}>{label}</Text>
      <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, paddingRight: 12 }}>
        <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#5F6C88" autoCapitalize="none" autoCorrect={false} maxLength={128} secureTextEntry={!visible} textContentType="newPassword" autoComplete="new-password" style={{ color: colors.text, flex: 1, minHeight: 54, paddingHorizontal: 16, fontSize: 16 }} />
        <Pressable onPress={onToggle} accessibilityRole="button" accessibilityLabel={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`} hitSlop={10} style={{ padding: 6 }}>
          <Ionicons name={visible ? "eye-off-outline" : "eye-outline"} size={22} color={colors.cyan} />
        </Pressable>
      </View>
    </View>
  );
}
