import React, { useState } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Song } from "@waifu-player/types";
import { formatDuration, formatPlays } from "@waifu-player/utils";
import { Colors } from "../../../constants/colors";
import { usePlayerStore } from "../../../store/playerStore";

interface SongRowProps {
  song: Song;
  onPress: (song: Song) => void;
  isPlaying?: boolean;
  showPlays?: boolean;
  onAddToQueue?: (song: Song) => void;
}

export function SongRow({ song, onPress, isPlaying = false, showPlays = false, onAddToQueue }: SongRowProps) {
  const artistNames = song.artists?.map((a) => a.name).join(", ") ?? "";
  const { addToQueue } = usePlayerStore();
  const [added, setAdded] = useState(false);
  const hasLyrics = !!song.lyrics && song.lyrics.trim().length > 0;

  const handleAddLater = () => {
    if (onAddToQueue) {
      onAddToQueue(song);
    } else {
      addToQueue(song);
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <TouchableOpacity style={styles.row} onPress={() => onPress(song)} activeOpacity={0.7}>
      {song.coverUrl ? (
        <Image source={{ uri: song.coverUrl }} style={styles.cover} />
      ) : (
        <View style={[styles.cover, styles.coverFallback]}>
          <Ionicons name="musical-note" size={16} color={Colors.dark.primary} />
        </View>
      )}
      <View style={styles.info}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, isPlaying && { color: Colors.dark.primary }]} numberOfLines={1}>
            {song.title}
          </Text>
          {hasLyrics ? (
            <View style={styles.vocalBadge}>
              <Ionicons name="mic" size={9} color={Colors.dark.primaryLight} />
              <Text style={styles.vocalBadgeText}>Có Lời</Text>
            </View>
          ) : (
            <View style={styles.instrumentalBadge}>
              <Ionicons name="musical-notes" size={9} color="#22d3ee" />
              <Text style={styles.instrumentalBadgeText}>Không Lời</Text>
            </View>
          )}
        </View>
        <Text style={styles.sub} numberOfLines={1}>
          {artistNames}{showPlays ? `  ·  ${formatPlays(song.plays)}` : ""}
        </Text>
      </View>
      <Text style={styles.duration}>{formatDuration(song.duration)}</Text>

      {/* Nút Thêm vào danh sách phát sau */}
      <TouchableOpacity
        style={styles.addQueueBtn}
        onPress={handleAddLater}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        activeOpacity={0.7}
      >
        <Ionicons
          name={added ? "checkmark-circle" : "time-outline"}
          size={20}
          color={added ? "#10b981" : Colors.dark.textMuted}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 16 },
  cover: { width: 48, height: 48, borderRadius: 8, marginRight: 12 },
  coverFallback: { backgroundColor: Colors.dark.card, alignItems: "center", justifyContent: "center" },
  info: { flex: 1, marginRight: 8 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  title: { color: Colors.dark.text, fontSize: 14, fontWeight: "600", flexShrink: 1 },
  vocalBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(233, 30, 99, 0.15)",
    borderColor: "rgba(233, 30, 99, 0.4)",
    borderWidth: 0.5,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  vocalBadgeText: {
    color: Colors.dark.primaryLight,
    fontSize: 9,
    fontWeight: "700",
  },
  instrumentalBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(6, 182, 212, 0.15)",
    borderColor: "rgba(6, 182, 212, 0.4)",
    borderWidth: 0.5,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  instrumentalBadgeText: {
    color: "#22d3ee",
    fontSize: 9,
    fontWeight: "700",
  },
  sub: { color: Colors.dark.textMuted, fontSize: 12, marginTop: 2 },
  duration: { color: Colors.dark.textMuted, fontSize: 12, marginRight: 12 },
  addQueueBtn: {
    padding: 4,
    justifyContent: "center",
    alignItems: "center",
  },
});
