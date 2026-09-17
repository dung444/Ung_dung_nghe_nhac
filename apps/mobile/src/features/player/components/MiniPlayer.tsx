import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { usePlayerStore } from "../../../store/playerStore";
import { Colors } from "../../../constants/colors";
import type { Artist } from "@waifu-player/types";

interface MiniPlayerProps {
  onPress: () => void;
}

export function MiniPlayer({ onPress }: MiniPlayerProps) {
  const { currentSong, isPlaying, setPlaying, playNext } = usePlayerStore();
  if (!currentSong) return null;

  const artistNames = currentSong.artists?.map((a: Artist) => a.name).join(", ") ?? "";

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.9}>
      {currentSong.coverUrl ? (
        <Image source={{ uri: currentSong.coverUrl }} style={styles.cover} />
      ) : (
        <View style={[styles.cover, styles.coverFallback]}>
          <Ionicons name="musical-note" size={20} color={Colors.dark.primary} />
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {currentSong.title}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>
          {artistNames}
        </Text>
      </View>
      <TouchableOpacity onPress={() => setPlaying(!isPlaying)} style={styles.btn}>
        <Ionicons name={isPlaying ? "pause" : "play"} size={24} color={Colors.dark.text} />
      </TouchableOpacity>
      <TouchableOpacity onPress={playNext} style={styles.btn}>
        <Ionicons name="play-skip-forward" size={22} color={Colors.dark.textMuted} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
  cover: { width: 44, height: 44, borderRadius: 8, marginRight: 12 },
  coverFallback: { backgroundColor: Colors.dark.card, alignItems: "center", justifyContent: "center" },
  info: { flex: 1, marginRight: 8 },
  title: { color: Colors.dark.text, fontSize: 14, fontWeight: "600" },
  artist: { color: Colors.dark.textMuted, fontSize: 12, marginTop: 2 },
  btn: { padding: 6 },
});
