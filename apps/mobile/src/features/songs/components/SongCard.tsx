import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import type { Song } from "@waifu-player/types";
import { Colors } from "../../../constants/colors";

interface SongCardProps { song: Song; onPress: (song: Song) => void; width?: number; }

export function SongCard({ song, onPress, width = 140 }: SongCardProps) {
  const artistNames = song.artists?.map((a) => a.name).join(", ") ?? "";
  return (
    <TouchableOpacity style={[styles.card, { width }]} onPress={() => onPress(song)} activeOpacity={0.8}>
      {song.coverUrl ? (
        <Image source={{ uri: song.coverUrl }} style={[styles.cover, { width, height: width }]} />
      ) : (
        <View style={[styles.cover, styles.coverFallback, { width, height: width }]} />
      )}
      <Text style={styles.title} numberOfLines={1}>{song.title}</Text>
      <Text style={styles.artist} numberOfLines={1}>{artistNames}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { marginRight: 12 },
  cover: { borderRadius: 10, marginBottom: 8 },
  coverFallback: { backgroundColor: Colors.dark.card },
  title: { color: Colors.dark.text, fontSize: 13, fontWeight: "600" },
  artist: { color: Colors.dark.textMuted, fontSize: 11, marginTop: 2 },
});
