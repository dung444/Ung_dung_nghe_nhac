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
import { useRouter } from "expo-router";
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
    artists: [{ id: "art1", name: "Hatsune Miku", bio: null, avatarUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=200&q=80", verified: true, userId: null, createdAt: "", updatedAt: "" }],
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
    artists: [{ id: "art2", name: "LiSA", bio: null, avatarUrl: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=200&q=80", verified: true, userId: null, createdAt: "", updatedAt: "" }],
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
    artists: [{ id: "art3", name: "YOASOBI", bio: null, avatarUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=200&q=80", verified: true, userId: null, createdAt: "", updatedAt: "" }],
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
    artists: [{ id: "art2", name: "LiSA", bio: null, avatarUrl: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=200&q=80", verified: true, userId: null, createdAt: "", updatedAt: "" }],
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
    artists: [{ id: "art3", name: "YOASOBI", bio: null, avatarUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=200&q=80", verified: true, userId: null, createdAt: "", updatedAt: "" }],
    genres: [{ id: "g3", name: "J-Pop", slug: "j-pop" }],
    createdAt: "",
    updatedAt: "",
  },
];

const FEATURED_ARTISTS = [
  { id: "art1", name: "Hatsune Miku", role: "Vocaloid Queen", avatar: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=200&q=80" },
  { id: "art2", name: "LiSA", role: "Anisong Diva", avatar: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=200&q=80" },
  { id: "art3", name: "YOASOBI", role: "J-Pop Duo", avatar: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=200&q=80" },
  { id: "art4", name: "Ado", role: "Utaite Legend", avatar: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=200&q=80" },
  { id: "art5", name: "Aimer", role: "Mystic Vocals", avatar: "https://images.unsplash.com/photo-1563089145-599997674d42?w=200&q=80" },
];

const CATEGORIES = ["Tất cả", "Vocaloid", "Anisong", "J-Pop", "Lo-fi Anime"];

export default function HomeScreen() {
  const router = useRouter();
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

  const getRankBadge = (index: number) => {
    if (index === 0) return { bg: "rgba(251, 191, 36, 0.2)", color: "#fbbf24", label: "🥇" };
    if (index === 1) return { bg: "rgba(226, 232, 240, 0.2)", color: "#e2e8f0", label: "🥈" };
    if (index === 2) return { bg: "rgba(217, 119, 6, 0.2)", color: "#f59e0b", label: "🥉" };
    return { bg: "transparent", color: Colors.dark.textMuted, label: `${index + 1}` };
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Header */}
        <View style={styles.headerRow}>
          <View>
            <View style={styles.greetingBadge}>
              <Text style={styles.greetingText}>✨ KONNICHIWA WAIFU FAN</Text>
            </View>
            <Text style={styles.headerTitle}>Waifu Player <Text style={styles.headerTitleHighlight}>Stream</Text></Text>
          </View>
          <View style={styles.headerRightActions}>
            <TouchableOpacity
              style={styles.actionIconButton}
              onPress={() => router.push("/room/r1" as any)}
              activeOpacity={0.8}
            >
              <Ionicons name="radio" size={20} color={Colors.dark.accent} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionIconButton}
              onPress={() => router.push("/profile" as any)}
              activeOpacity={0.8}
            >
              <Ionicons name="sparkles" size={20} color={Colors.dark.primaryLight} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Anime Banner Highlight */}
        <View style={styles.bannerCard}>
          <View style={styles.bannerGlow} />
          <View style={styles.bannerHeader}>
            <View style={styles.bannerBadge}>
              <Ionicons name="flame" size={12} color="#fff" />
              <Text style={styles.bannerBadgeText}>FEATURED WAIFU LIVE</Text>
            </View>
            <View style={styles.hqTag}>
              <Text style={styles.hqTagText}>24-BIT HI-RES</Text>
            </View>
          </View>

          <Text style={styles.bannerTitle}>Hatsune Miku Magical Mirai 2026</Text>
          <Text style={styles.bannerSubtitle}>
            Không gian âm nhạc Vocaloid & Anisong đỉnh cao với công nghệ đồng bộ thời gian thực
          </Text>

          <View style={styles.bannerFooter}>
            <TouchableOpacity
              style={styles.bannerPlayBtn}
              onPress={() => handlePlaySong(songs[0], 0)}
              activeOpacity={0.85}
            >
              <Ionicons name="play" size={18} color="#fff" />
              <Text style={styles.bannerPlayText}>Phát Ngay</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.bannerRoomBtn}
              onPress={() => router.push("/room/r1" as any)}
              activeOpacity={0.85}
            >
              <Ionicons name="people" size={16} color={Colors.dark.accent} />
              <Text style={styles.bannerRoomText}>Phòng Nghe Chung</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Hub Shortcuts */}
        <View style={styles.quickHubGrid}>
          <TouchableOpacity
            style={styles.quickHubCard}
            onPress={() => router.push("/room/r1" as any)}
            activeOpacity={0.8}
          >
            <View style={[styles.quickHubIconBg, { backgroundColor: "rgba(6, 182, 212, 0.15)" }]}>
              <Ionicons name="headset" size={20} color={Colors.dark.accent} />
            </View>
            <Text style={styles.quickHubTitle}>Phòng Live</Text>
            <Text style={styles.quickHubSub}>Nghe cùng bạn bè</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickHubCard}
            onPress={() => router.push("/library" as any)}
            activeOpacity={0.8}
          >
            <View style={[styles.quickHubIconBg, { backgroundColor: "rgba(233, 30, 140, 0.15)" }]}>
              <Ionicons name="heart" size={20} color={Colors.dark.primary} />
            </View>
            <Text style={styles.quickHubTitle}>Yêu Thích</Text>
            <Text style={styles.quickHubSub}>Bộ sưu tập</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickHubCard}
            onPress={() => router.push("/profile" as any)}
            activeOpacity={0.8}
          >
            <View style={[styles.quickHubIconBg, { backgroundColor: "rgba(168, 85, 247, 0.15)" }]}>
              <Ionicons name="shield-checkmark" size={20} color={Colors.dark.secondary} />
            </View>
            <Text style={styles.quickHubTitle}>Bản Quyền</Text>
            <Text style={styles.quickHubSub}>ISRC & DMCA</Text>
          </TouchableOpacity>
        </View>

        {/* Featured Waifu Artists */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Nghệ Sĩ Waifu Nổi Bật ⭐</Text>
          <TouchableOpacity onPress={() => router.push("/search" as any)}>
            <Text style={styles.seeAllText}>Khám phá</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.artistsScroll}>
          {FEATURED_ARTISTS.map((artist) => (
            <TouchableOpacity
              key={artist.id}
              style={styles.artistItem}
              onPress={() => router.push(`/artist/${artist.id}` as any)}
              activeOpacity={0.8}
            >
              <View style={styles.artistAvatarWrapper}>
                <Image source={{ uri: artist.avatar }} style={styles.artistAvatar} />
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={14} color={Colors.dark.accent} />
                </View>
              </View>
              <Text style={styles.artistName} numberOfLines={1}>{artist.name}</Text>
              <Text style={styles.artistRole} numberOfLines={1}>{artist.role}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Category Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {CATEGORIES.map((cat) => {
            const isSelected = activeCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                onPress={() => setActiveCategory(cat)}
                activeOpacity={0.8}
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
          <Text style={styles.sectionTitle}>Bảng Xếp Hạng Thịnh Hành 🔥</Text>
          <Text style={styles.songCountText}>{filteredSongs.length} bài hát</Text>
        </View>

        {filteredSongs.map((song, index) => {
          const isCurrent = currentSong?.id === song.id;
          const artistName = song.artists?.map((a) => a.name).join(", ") || "Unknown Artist";
          const rankInfo = getRankBadge(index);

          return (
            <TouchableOpacity
              key={song.id}
              style={[styles.songCard, isCurrent && styles.songCardActive]}
              onPress={() => handlePlaySong(song, index)}
              activeOpacity={0.82}
            >
              <View style={[styles.rankBox, { backgroundColor: rankInfo.bg }]}>
                <Text style={[styles.rankIndex, { color: rankInfo.color }]}>
                  {rankInfo.label}
                </Text>
              </View>

              <Image
                source={{ uri: song.coverUrl ?? "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80" }}
                style={styles.songThumb}
              />

              <View style={styles.songInfo}>
                <View style={styles.songTitleRow}>
                  <Text style={[styles.songTitle, isCurrent && { color: Colors.dark.primaryLight }]} numberOfLines={1}>
                    {song.title}
                  </Text>
                  {isCurrent && isPlaying && (
                    <View style={styles.nowPlayingTag}>
                      <Ionicons name="musical-notes" size={11} color={Colors.dark.accent} />
                    </View>
                  )}
                </View>
                <Text style={styles.songArtist} numberOfLines={1}>
                  {artistName} • {formatDuration(song.duration)} • {(song.plays || 0).toLocaleString()} lượt nghe
                </Text>
              </View>

              <TouchableOpacity
                style={styles.playIconBtn}
                onPress={() => handlePlaySong(song, index)}
              >
                <Ionicons
                  name={isCurrent && isPlaying ? "pause-circle" : "play-circle"}
                  size={36}
                  color={isCurrent ? Colors.dark.primaryLight : Colors.dark.accent}
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
    paddingBottom: 130,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  greetingBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(233, 30, 140, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(233, 30, 140, 0.3)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 4,
  },
  greetingText: {
    fontSize: 10,
    color: Colors.dark.primaryLight,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: Colors.dark.text,
    letterSpacing: -0.5,
  },
  headerTitleHighlight: {
    color: Colors.dark.primaryLight,
  },
  headerRightActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionIconButton: {
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
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(233, 30, 140, 0.3)",
    overflow: "hidden",
    position: "relative",
  },
  bannerGlow: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(233, 30, 140, 0.15)",
  },
  bannerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  bannerBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  bannerBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  hqTag: {
    backgroundColor: "rgba(6, 182, 212, 0.15)",
    borderWidth: 0.5,
    borderColor: Colors.dark.accent,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  hqTagText: {
    color: Colors.dark.accent,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  bannerTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: Colors.dark.text,
    marginBottom: 6,
    lineHeight: 26,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: Colors.dark.textMuted,
    marginBottom: 16,
    lineHeight: 18,
  },
  bannerFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  bannerPlayBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 22,
    gap: 6,
    shadowColor: Colors.dark.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  bannerPlayText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  bannerRoomBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(6, 182, 212, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(6, 182, 212, 0.3)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 22,
    gap: 6,
  },
  bannerRoomText: {
    color: Colors.dark.accent,
    fontWeight: "700",
    fontSize: 13,
  },
  quickHubGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },
  quickHubCard: {
    flex: 1,
    backgroundColor: Colors.dark.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    alignItems: "center",
  },
  quickHubIconBg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  quickHubTitle: {
    color: Colors.dark.text,
    fontSize: 12,
    fontWeight: "700",
  },
  quickHubSub: {
    color: Colors.dark.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.dark.text,
    letterSpacing: -0.3,
  },
  seeAllText: {
    fontSize: 13,
    color: Colors.dark.primaryLight,
    fontWeight: "700",
  },
  songCountText: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    fontWeight: "600",
  },
  artistsScroll: {
    marginBottom: 22,
  },
  artistItem: {
    alignItems: "center",
    marginRight: 16,
    width: 80,
  },
  artistAvatarWrapper: {
    position: "relative",
    marginBottom: 6,
  },
  artistAvatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: "rgba(233, 30, 140, 0.4)",
    backgroundColor: Colors.dark.card,
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: Colors.dark.surface,
    borderRadius: 8,
  },
  artistName: {
    color: Colors.dark.text,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  artistRole: {
    color: Colors.dark.textMuted,
    fontSize: 10,
    textAlign: "center",
    marginTop: 2,
  },
  categoryScroll: {
    marginBottom: 16,
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
    borderColor: Colors.dark.primaryLight,
  },
  categoryText: {
    color: Colors.dark.textMuted,
    fontWeight: "700",
    fontSize: 13,
  },
  categoryTextActive: {
    color: "#fff",
  },
  songCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.surface,
    padding: 10,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  songCardActive: {
    borderColor: "rgba(233, 30, 140, 0.6)",
    backgroundColor: Colors.dark.card,
  },
  rankBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  rankIndex: {
    fontSize: 14,
    fontWeight: "800",
  },
  songThumb: {
    width: 52,
    height: 52,
    borderRadius: 10,
    marginRight: 12,
    backgroundColor: Colors.dark.card,
  },
  songInfo: {
    flex: 1,
    marginRight: 6,
  },
  songTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  songTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.dark.text,
    marginBottom: 3,
    flexShrink: 1,
  },
  nowPlayingTag: {
    backgroundColor: "rgba(6, 182, 212, 0.15)",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  songArtist: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    fontWeight: "500",
  },
  playIconBtn: {
    padding: 4,
  },
});
