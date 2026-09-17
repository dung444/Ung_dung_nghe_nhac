import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Colors } from "../../constants/colors";
import { useAuthStore } from "../../store/authStore";

export default function RegisterScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { setTokens, setUser } = useAuthStore();

  const handleRegister = async () => {
    if (!email || !username || !password) {
      setErrorMessage("Vui lòng điền đầy đủ các thông tin bắt buộc");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    try {
      const { api } = await import("../../services/api");
      const res = await api.post("/api/v1/auth/register", {
        email,
        username,
        displayName: displayName || username,
        password,
      });

      if (res.data.success) {
        setUser(res.data.data.user);
        setTokens(res.data.data.accessToken, res.data.data.refreshToken);
        router.replace("/(tabs)");
        return;
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || "Đăng ký không thành công";
      setErrorMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Tạo Tài Khoản</Text>
        <Text style={styles.subtitle}>Gia nhập cộng đồng người nghe nhạc Anime Waifu Player</Text>

        {errorMessage ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email *</Text>
          <TextInput
            style={styles.input}
            placeholder="waifu@example.com"
            placeholderTextColor={Colors.dark.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Tên đăng nhập *</Text>
          <TextInput
            style={styles.input}
            placeholder="miku_chan"
            placeholderTextColor={Colors.dark.textMuted}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Tên hiển thị</Text>
          <TextInput
            style={styles.input}
            placeholder="Hatsune Miku Fan"
            placeholderTextColor={Colors.dark.textMuted}
            value={displayName}
            onChangeText={setDisplayName}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Mật khẩu * (Tối thiểu 8 ký tự)</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={Colors.dark.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity style={styles.registerBtn} onPress={handleRegister} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.registerBtnText}>Đăng Ký</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Đã có tài khoản? Quay lại Đăng nhập</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  content: { padding: 24, justifyContent: "center" },
  title: { fontSize: 28, fontWeight: "bold", color: Colors.dark.primary, textAlign: "center", marginBottom: 8 },
  subtitle: { fontSize: 14, color: Colors.dark.textMuted, textAlign: "center", marginBottom: 28 },
  errorBanner: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderColor: Colors.dark.error,
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: { color: Colors.dark.error, fontSize: 13, textAlign: "center" },
  inputContainer: { marginBottom: 16 },
  label: { color: Colors.dark.text, marginBottom: 8, fontSize: 14, fontWeight: "500" },
  input: {
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: 8,
    padding: 14,
    color: Colors.dark.text,
    fontSize: 16,
  },
  registerBtn: {
    backgroundColor: Colors.dark.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
  },
  registerBtnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  backBtn: { padding: 16, alignItems: "center", marginTop: 8 },
  backBtnText: { color: Colors.dark.secondary, fontSize: 14, fontWeight: "600" },
});
