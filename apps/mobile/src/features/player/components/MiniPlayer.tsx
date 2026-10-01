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
  const { currentSong, isPlaying, setPlaying, playNext, position, duration } = usePlayerStore();
  if (!currentSong) return null;

  const artistNames = currentSong.artists?.map((a: Artist) => a.name).join(", ") ?? "";
  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (position / duration) * 100)) : 0;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.9}>
      {/* Top progress indicator */}
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
      </View>

      <View style={styles.contentRow}>
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
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            setPlaying(!isPlaying);
          }}
          style={styles.btn}
        >
          <Ionicons
            name={isPlaying ? "pause-circle" : "play-circle"}
            size={34}
            color={Colors.dark.primary}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            playNext();
          }}
          style={styles.btn}
        >
          <Ionicons name="play-skip-forward" size={22} color={Colors.dark.textMuted} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.dark.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  progressBarBg: {
    height: 2.5,
    backgroundColor: Colors.dark.card,
    width: "100%",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: Colors.dark.primary,
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  cover: { width: 44, height: 44, borderRadius: 8, marginRight: 12 },
  coverFallback: { backgroundColor: Colors.dark.card, alignItems: "center", justifyContent: "center" },
  info: { flex: 1, marginRight: 8 },
  title: { color: Colors.dark.text, fontSize: 14, fontWeight: "600" },
  artist: { color: Colors.dark.textMuted, fontSize: 12, marginTop: 2 },
  btn: { padding: 4 },
});
