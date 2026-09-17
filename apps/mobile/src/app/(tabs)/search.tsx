import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../constants/colors";
import { Ionicons } from "@expo/vector-icons";

export default function SearchScreen() {
  const [query, setQuery] = useState("");

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Tìm kiếm</Text>
      </View>
      
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color={Colors.dark.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Bạn muốn nghe gì?"
          placeholderTextColor={Colors.dark.textMuted}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      <View style={styles.content}>
        {query.length > 0 ? (
          <Text style={styles.noResultsText}>Đang tìm kiếm cho "{query}"...</Text>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Thể loại nổi bật</Text>
            <View style={styles.tagsContainer}>
              {["Anime OP", "J-Pop", "Lofi Girl", "V-Tuber", "Nightcore", "Chill"].map((tag, idx) => (
                <TouchableOpacity key={idx} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: "bold", color: Colors.dark.primary },
  searchBar: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.dark.surface, marginHorizontal: 16, borderRadius: 12, paddingHorizontal: 12, height: 48, marginBottom: 20 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: Colors.dark.text, fontSize: 16 },
  content: { flex: 1, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: Colors.dark.text, marginBottom: 16 },
  tagsContainer: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  tag: { backgroundColor: Colors.dark.surface, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: Colors.dark.border },
  tagText: { color: Colors.dark.text, fontWeight: "600" },
  noResultsText: { color: Colors.dark.textMuted, textAlign: "center", marginTop: 40 },
});
