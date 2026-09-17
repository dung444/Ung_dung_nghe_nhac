import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Colors } from "../../constants/colors";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.headerTitle}>Waifu Player</Text>
        <Text style={styles.subTitle}>Dành cho bạn</Text>
        
        {/* Placeholder cho danh sách bài hát */}
        <View style={styles.placeholderCard}>
          <Text style={styles.placeholderText}>Chưa có dữ liệu bài hát</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80, // Space for mini player
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.dark.primary,
    marginBottom: 8,
  },
  subTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.dark.text,
    marginTop: 16,
    marginBottom: 12,
  },
  placeholderCard: {
    backgroundColor: Colors.dark.surface,
    padding: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  placeholderText: {
    color: Colors.dark.textMuted,
    fontSize: 16,
  }
});
