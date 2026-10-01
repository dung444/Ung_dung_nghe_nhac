import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet, Platform } from "react-native";
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

  const artistNames = currentSong.artists?.map((a: Artist) => a.name).join(", ") || "Unknown Artist";
  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (position / duration) * 100)) : 0;

  return (
    <View style={styles.outerWrapper}>
      <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.92}>
        {/* Top subtle neon progress line */}
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
        </View>

        <View style={styles.contentRow}>
          <View style={styles.coverWrapper}>
            {currentSong.coverUrl ? (
              <Image source={{ uri: currentSong.coverUrl }} style={styles.cover} />
            ) : (
              <View style={[styles.cover, styles.coverFallback]}>
                <Ionicons name="musical-notes" size={20} color={Colors.dark.primary} />
              </View>
            )}
            {isPlaying && (
              <View style={styles.liveIndicator}>
                <View style={styles.pulseDot} />
              </View>
            )}
          </View>

          <View style={styles.info}>
            <View style={styles.titleRow}>
              <Text style={styles.title} numberOfLines={1}>
                {currentSong.title}
              </Text>
              <View style={styles.qualityBadge}>
                <Text style={styles.qualityText}>LOSSLESS</Text>
              </View>
            </View>
            <Text style={styles.artist} numberOfLines={1}>
              {artistNames}
            </Text>
          </View>

          <View style={styles.controlsRow}>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                setPlaying(!isPlaying);
              }}
              style={styles.playBtn}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isPlaying ? "pause-circle" : "play-circle"}
                size={38}
                color={Colors.dark.primaryLight}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                playNext();
              }}
              style={styles.nextBtn}
              activeOpacity={0.8}
            >
              <Ionicons name="play-skip-forward" size={22} color={Colors.dark.text} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrapper: {
    paddingHorizontal: 8,
    paddingBottom: 4,
  },
  container: {
    backgroundColor: "rgba(26, 26, 46, 0.95)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(233, 30, 140, 0.35)",
    overflow: "hidden",
    shadowColor: Colors.dark.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  progressBarBg: {
    height: 3,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    width: "100%",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: Colors.dark.primaryLight,
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  coverWrapper: {
    position: "relative",
    marginRight: 12,
  },
  cover: {
    width: 46,
    height: 46,
    borderRadius: 10,
    backgroundColor: Colors.dark.card,
  },
  coverFallback: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  liveIndicator: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: Colors.dark.surface,
    borderRadius: 6,
    padding: 2,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.dark.accent,
  },
  info: {
    flex: 1,
    marginRight: 8,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  title: {
    color: Colors.dark.text,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.2,
    flexShrink: 1,
  },
  qualityBadge: {
    backgroundColor: "rgba(6, 182, 212, 0.15)",
    borderWidth: 0.5,
    borderColor: Colors.dark.accent,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  qualityText: {
    color: Colors.dark.accent,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  artist: {
    color: Colors.dark.textMuted,
    fontSize: 12,
    marginTop: 3,
    fontWeight: "500",
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  playBtn: {
    padding: 2,
  },
  nextBtn: {
    padding: 6,
  },
});
