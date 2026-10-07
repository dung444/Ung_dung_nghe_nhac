import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Colors } from "../../constants/colors";
import { useAuthStore } from "../../store/authStore";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { setAuth } = useAuthStore();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMessage("Vui lòng nhập Email/Tên đăng nhập và Mật khẩu.");
      try {
        const { useToastStore } = require("../../store/toastStore");
        useToastStore.getState().showWarning("Thiếu thông tin", "Vui lòng nhập Email/Tên đăng nhập và Mật khẩu.");
      } catch {}
      return;
    }

    setLoading(true);
    setErrorMessage("");
    try {
      const { api } = await import("../../services/api");
      const res = await api.post("/api/v1/auth/login", { email: email.trim(), password });
      if (res.data?.success && res.data?.data) {
        const { user, accessToken, refreshToken } = res.data.data;
        setAuth(user, accessToken, refreshToken);
        try {
          const { useToastStore } = require("../../store/toastStore");
          useToastStore.getState().showSuccess("Đăng nhập thành công! ✨", `Chào mừng ${user.displayName || user.username} trở lại với Waifu Player!`);
        } catch {}
        router.replace("/(tabs)");
        return;
      } else {
        const msg = res.data?.message || "Đăng nhập thất bại.";
        setErrorMessage(msg);
        try {
          const { useToastStore } = require("../../store/toastStore");
          useToastStore.getState().showError("Đăng nhập thất bại ⚠️", msg);
        } catch {}
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Email/Tên đăng nhập hoặc mật khẩu không chính xác.";
      setErrorMessage(msg);
      try {
        const { useToastStore } = require("../../store/toastStore");
        useToastStore.getState().showError("Đăng nhập thất bại ⚠️", msg);
      } catch {}
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Waifu Player</Text>
        <Text style={styles.subtitle}>Đăng nhập để nghe nhạc anime không giới hạn</Text>

        {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email hoặc Tên đăng nhập</Text>
          <TextInput
            style={styles.input}
            placeholder="admin@waifu-player.dev hoặc admin"
            placeholderTextColor={Colors.dark.textMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Mật khẩu</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={Colors.dark.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginBtnText}>Đăng nhập</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.registerBtn} onPress={() => router.push("/(auth)/register")}>
          <Text style={styles.registerBtnText}>Chưa có tài khoản? Đăng ký ngay</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  content: { flex: 1, padding: 24, justifyContent: "center" },
  title: { fontSize: 32, fontWeight: "bold", color: Colors.dark.primary, textAlign: "center", marginBottom: 8 },
  subtitle: { fontSize: 16, color: Colors.dark.textMuted, textAlign: "center", marginBottom: 30 },
  errorText: { color: "#ef4444", fontSize: 14, fontWeight: "600", textAlign: "center", marginBottom: 16, backgroundColor: "rgba(239, 68, 68, 0.1)", padding: 10, borderRadius: 8, borderWidth: 1, borderColor: "rgba(239, 68, 68, 0.3)" },
  inputContainer: { marginBottom: 20 },
  label: { color: Colors.dark.text, marginBottom: 8, fontSize: 14, fontWeight: "500" },
  input: { backgroundColor: Colors.dark.surface, borderWidth: 1, borderColor: Colors.dark.border, borderRadius: 8, padding: 14, color: Colors.dark.text, fontSize: 16 },
  loginBtn: { backgroundColor: Colors.dark.primary, padding: 16, borderRadius: 8, alignItems: "center", marginTop: 12 },
  loginBtnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  registerBtn: { padding: 16, alignItems: "center", marginTop: 8 },
  registerBtnText: { color: Colors.dark.secondary, fontSize: 14, fontWeight: "600" },
});
