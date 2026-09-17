import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../constants/colors";
import { usePlayerStore } from "../../store/playerStore";
import { api } from "../../services/api";
import type { Song } from "@waifu-player/types";
import { formatDuration } from "@waifu-player/utils";

const SAMPLE_ANIME_SONGS: Song[] = [
  {
    id: "s1",
    title: "World is Mine",
    duration: 225,
    fileUrl: "/uploads/audio/world_is_mine.mp3",
    coverUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80",
    plays: 420000,
    isPublic: true,
    releaseDate: "2023-03-09",
    albumId: "a1",
    artists: [{ id: "art1", name: "Hatsune Miku", bio: null, avatarUrl: null, verified: true, userId: null, createdAt: "", updatedAt: "" }],
    genres: [{ id: "g1", name: "Vocaloid", slug: "vocaloid" }],
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "s2",
    title: "Gurenge (紅蓮華)",
    duration: 258,
    fileUrl: "/uploads/audio/gurenge.mp3",
    coverUrl: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400&q=80",
    plays: 890000,
    isPublic: true,
    releaseDate: "2019-10-16",
    albumId: "a2",
    artists: [{ id: "art2", name: "LiSA", bio: null, avatarUrl: null, verified: true, userId: null, createdAt: "", updatedAt: "" }],
    genres: [{ id: "g2", name: "Anisong", slug: "anime-ost" }],
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "s3",
    title: "Idol (アイドル)",
    duration: 212,
    fileUrl: "/uploads/audio/idol.mp3",
    coverUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&q=80",
    plays: 1200000,
    isPublic: true,
    releaseDate: "2023-04-12",
    albumId: "a3",
    artists: [{ id: "art3", name: "YOASOBI", bio: null, avatarUrl: null, verified: true, userId: null, createdAt: "", updatedAt: "" }],
    genres: [{ id: "g3", name: "J-Pop", slug: "j-pop" }],
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "s4",
    title: "Crossing Field",
    duration: 247,
    fileUrl: "/uploads/audio/crossing_field.mp3",
    coverUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&q=80",
    plays: 650000,
    isPublic: true,
    releaseDate: "2012-08-08",
    albumId: "a2",
    artists: [{ id: "art2", name: "LiSA", bio: null, avatarUrl: null, verified: true, userId: null, createdAt: "", updatedAt: "" }],
    genres: [{ id: "g2", name: "Anisong", slug: "anime-ost" }],
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "s5",
    title: "Kaibutsu (怪物)",
    duration: 251,
    fileUrl: "/uploads/audio/kaibutsu.mp3",
    coverUrl: "https://images.unsplash.com/photo-1563089145-599997674d42?w=400&q=80",
    plays: 780000,
    isPublic: true,
    releaseDate: "2021-01-06",
    albumId: "a3",
    artists: [{ id: "art3", name: "YOASOBI", bio: null, avatarUrl: null, verified: true, userId: null, createdAt: "", updatedAt: "" }],
    genres: [{ id: "g3", name: "J-Pop", slug: "j-pop" }],
    createdAt: "",
    updatedAt: "",
  },
];

const CATEGORIES = ["Tất cả", "Vocaloid", "Anisong", "J-Pop", "Lo-fi Anime"];

export default function HomeScreen() {
  const [activeCategory, setActiveCategory] = useState("Tất cả");
  const [songs, setSongs] = useState<Song[]>(SAMPLE_ANIME_SONGS);
  const { currentSong, isPlaying, setCurrentSong, setQueue, setPlaying } = usePlayerStore();

  useEffect(() => {
    api
      .get("/api/v1/songs")
      .then((res) => {
        if (res.data.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          setSongs(res.data.data);
        }
      })
      .catch(() => {
        // Fallback to rich sample data
      });
  }, []);

  const handlePlaySong = (song: Song, index: number) => {
    if (currentSong?.id === song.id) {
      setPlaying(!isPlaying);
    } else {
      setQueue(songs, index);
      setCurrentSong(song);
    }
  };

  const filteredSongs =
    activeCategory === "Tất cả"
      ? songs
      : songs.filter((s) => s.genres.some((g) => g.name.toLowerCase().includes(activeCategory.toLowerCase())));

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greetingText}>Konnichiwa! ✨</Text>
            <Text style={styles.headerTitle}>Waifu Player 🎧</Text>
          </View>
          <TouchableOpacity style={styles.bellButton}>
            <Ionicons name="notifications-outline" size={22} color={Colors.dark.text} />
          </TouchableOpacity>
        </View>

        {/* Anime Banner Highlight */}
        <View style={styles.bannerCard}>
          <View style={styles.bannerBadge}>
            <Text style={styles.bannerBadgeText}>FEATURED WAIFU</Text>
          </View>
          <Text style={styles.bannerTitle}>Hatsune Miku Live Concert 2026</Text>
          <Text style={styles.bannerSubtitle}>Thưởng thức những giai điệu Vocaloid huyền thoại</Text>
          <TouchableOpacity
            style={styles.bannerPlayBtn}
            onPress={() => handlePlaySong(songs[0], 0)}
          >
            <Ionicons name="play" size={18} color="#fff" />
            <Text style={styles.bannerPlayText}>Phát Ngay</Text>
          </TouchableOpacity>
        </View>

        {/* Category Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {CATEGORIES.map((cat) => {
            const isSelected = activeCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                onPress={() => setActiveCategory(cat)}
              >
                <Text style={[styles.categoryText, isSelected && styles.categoryTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Trending Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Bảng Xếp Hạng Anime 🔥</Text>
          <Text style={styles.seeAllText}>Xem tất cả</Text>
        </View>

        {filteredSongs.map((song, index) => {
          const isCurrent = currentSong?.id === song.id;
          const artistName = song.artists?.map((a) => a.name).join(", ") || "Unknown";

          return (
            <TouchableOpacity
              key={song.id}
              style={[styles.songCard, isCurrent && styles.songCardActive]}
              onPress={() => handlePlaySong(song, index)}
              activeOpacity={0.8}
            >
              <Text style={styles.rankIndex}>{index + 1}</Text>
              <Image
                source={{ uri: song.coverUrl ?? "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80" }}
                style={styles.songThumb}
              />
              <View style={styles.songInfo}>
                <Text style={[styles.songTitle, isCurrent && { color: Colors.dark.primary }]} numberOfLines={1}>
                  {song.title}
                </Text>
                <Text style={styles.songArtist} numberOfLines={1}>
                  {artistName} • {formatDuration(song.duration)}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.playIconBtn}
                onPress={() => handlePlaySong(song, index)}
              >
                <Ionicons
                  name={isCurrent && isPlaying ? "pause-circle" : "play-circle"}
                  size={34}
                  color={isCurrent ? Colors.dark.primary : Colors.dark.accent}
                />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}
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
    paddingBottom: 110,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  greetingText: {
    fontSize: 14,
    color: Colors.dark.primaryLight,
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: Colors.dark.text,
  },
  bellButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.dark.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  bannerCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  bannerBadge: {
    alignSelf: "flex-start",
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  bannerBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.dark.text,
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: Colors.dark.textMuted,
    marginBottom: 14,
  },
  bannerPlayBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  bannerPlayText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  categoryScroll: {
    marginBottom: 20,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.dark.surface,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  categoryChipActive: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
  },
  categoryText: {
    color: Colors.dark.textMuted,
    fontWeight: "600",
    fontSize: 13,
  },
  categoryTextActive: {
    color: "#fff",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.dark.text,
  },
  seeAllText: {
    fontSize: 13,
    color: Colors.dark.primaryLight,
    fontWeight: "600",
  },
  songCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.surface,
    padding: 10,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  songCardActive: {
    borderColor: Colors.dark.primary,
    backgroundColor: Colors.dark.card,
  },
  rankIndex: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.dark.textMuted,
    width: 24,
    textAlign: "center",
    marginRight: 6,
  },
  songThumb: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.dark.text,
    marginBottom: 4,
  },
  songArtist: {
    fontSize: 12,
    color: Colors.dark.textMuted,
  },
  playIconBtn: {
    padding: 4,
  },
});
