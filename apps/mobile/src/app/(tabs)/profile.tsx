import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../constants/colors";
import { useAuthStore } from "../../store/authStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace("/(auth)/login");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Hồ sơ cá nhân</Text>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatarPlaceholder}>
          <Ionicons name="person" size={40} color={Colors.dark.primary} />
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.username}>{user?.username || "Khách"}</Text>
          <Text style={styles.email}>{user?.email || "Chưa đăng nhập"}</Text>
          {user?.isPremium && (
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumText}>PREMIUM</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.menu}>
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="settings-outline" size={24} color={Colors.dark.text} />
          <Text style={styles.menuText}>Cài đặt</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="time-outline" size={24} color={Colors.dark.text} />
          <Text style={styles.menuText}>Lịch sử nghe nhạc</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color={Colors.dark.secondary} />
          <Text style={[styles.menuText, { color: Colors.dark.secondary }]}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: "bold", color: Colors.dark.primary },
  profileCard: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.dark.surface, marginHorizontal: 16, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: Colors.dark.border },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.dark.card, justifyContent: "center", alignItems: "center", marginRight: 20 },
  userInfo: { flex: 1 },
  username: { fontSize: 22, fontWeight: "bold", color: Colors.dark.text, marginBottom: 4 },
  email: { fontSize: 14, color: Colors.dark.textMuted, marginBottom: 8 },
  premiumBadge: { backgroundColor: Colors.dark.primary, alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  premiumText: { color: "#fff", fontSize: 10, fontWeight: "bold" },
  menu: { marginTop: 30, paddingHorizontal: 16 },
  menuItem: { flexDirection: "row", alignItems: "center", paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Colors.dark.border },
  menuText: { fontSize: 16, color: Colors.dark.text, marginLeft: 16, fontWeight: "500" },
});
