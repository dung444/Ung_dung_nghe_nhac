import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Song } from "@waifu-player/types";
import { formatDuration, formatPlays } from "@waifu-player/utils";
import { Colors } from "../../../constants/colors";

interface SongRowProps {
  song: Song;
  onPress: (song: Song) => void;
  isPlaying?: boolean;
  showPlays?: boolean;
}

export function SongRow({ song, onPress, isPlaying = false, showPlays = false }: SongRowProps) {
  const artistNames = song.artists?.map((a) => a.name).join(", ") ?? "";
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
        <Text style={[styles.title, isPlaying && { color: Colors.dark.primary }]} numberOfLines={1}>
          {song.title}
        </Text>
        <Text style={styles.sub} numberOfLines={1}>
          {artistNames}{showPlays ? `  ·  ${formatPlays(song.plays)}` : ""}
        </Text>
      </View>
      <Text style={styles.duration}>{formatDuration(song.duration)}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 16 },
  cover: { width: 48, height: 48, borderRadius: 8, marginRight: 12 },
  coverFallback: { backgroundColor: Colors.dark.card, alignItems: "center", justifyContent: "center" },
  info: { flex: 1, marginRight: 8 },
  title: { color: Colors.dark.text, fontSize: 14, fontWeight: "600" },
  sub: { color: Colors.dark.textMuted, fontSize: 12, marginTop: 2 },
  duration: { color: Colors.dark.textMuted, fontSize: 12 },
});
