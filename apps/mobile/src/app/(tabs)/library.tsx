import React from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../constants/colors";
import { Ionicons } from "@expo/vector-icons";

export default function LibraryScreen() {
  const dummyPlaylists = [
    { id: "1", name: "Bài hát yêu thích", count: 120, type: "liked" },
    { id: "2", name: "Anime Nhạc Mở Đầu", count: 45, type: "playlist" },
    { id: "3", name: "Lofi Học Tập", count: 20, type: "playlist" },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Thư viện</Text>
        <TouchableOpacity>
          <Ionicons name="add" size={28} color={Colors.dark.text} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={dummyPlaylists}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.playlistItem}>
            <View style={styles.cover}>
              <Ionicons 
                name={item.type === "liked" ? "heart" : "musical-notes"} 
                size={32} 
                color={item.type === "liked" ? Colors.dark.secondary : Colors.dark.primary} 
              />
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.count}>{item.count} bài hát</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.dark.textMuted} />
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: "bold", color: Colors.dark.primary },
  listContent: { paddingHorizontal: 16 },
  playlistItem: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.dark.surface, padding: 12, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: Colors.dark.border },
  cover: { width: 60, height: 60, borderRadius: 8, backgroundColor: Colors.dark.card, justifyContent: "center", alignItems: "center", marginRight: 16 },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: "bold", color: Colors.dark.text, marginBottom: 4 },
  count: { fontSize: 14, color: Colors.dark.textMuted },
});
