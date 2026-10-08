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
import type { Artist, Song } from "@waifu-player/types";
import { formatDuration } from "@waifu-player/utils";
import { GoldCoin } from "../../components/ui/GoldCoin";

const SAMPLE_ANIME_SONGS: Song[] = [
  {
    id: "s1",
    title: "World is Mine",
    duration: 225,
    fileUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
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
    fileUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
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
    fileUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
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
    fileUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
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
    fileUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",
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

import { useAuthStore } from "../../store/authStore";
import { useToastStore } from "../../store/toastStore";
import { NotificationModal } from "../../components/ui/NotificationModal";
import { ENDPOINTS } from "../../constants/api";
import { GiftModal } from "../../features/gifts/GiftModal";

const CATEGORIES = [
  "Tất cả",
  "BXH Quà Tặng 🎁",
  "Có Lời 🎤",
  "Không Lời 🎵",
  "Tuyển Chọn 🇻🇳",
  "Anime & EDM ✨",
  "Dành Cho Bạn 💖",
  "Future Bass",
  "Hip-Hop & Rock",
  "Dân Ca Cổ Truyền",
  "Melodic House",
  "Lo-fi Chillhop",
];

export default function HomeScreen() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState("Tất cả");
  const [songs, setSongs] = useState<Song[]>(SAMPLE_ANIME_SONGS);
  const [featuredArtists, setFeaturedArtists] = useState<Artist[]>([]);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const { history } = useToastStore();
  const unreadCount = history.filter((h) => !h.read).length;
  const { currentSong, isPlaying, setCurrentSong, setQueue, setPlaying, addToQueue } = usePlayerStore();
  const { user, preferredGenres, preferredArtists } = useAuthStore();

  // Gift Leaderboard States
  const [giftLeaderboard, setGiftLeaderboard] = useState<any[]>([]);
  const [leaderboardTab, setLeaderboardTab] = useState<"plays" | "gifts">("plays");
  const [selectedGiftSong, setSelectedGiftSong] = useState<Song | null>(null);
  const [showGiftModal, setShowGiftModal] = useState(false);

  const loadGiftLeaderboardData = () => {
    api
      .get(ENDPOINTS.giftLeaderboard)
      .then((res) => {
        const raw = res.data;
        const items = Array.isArray(raw?.data)
          ? raw.data
          : Array.isArray(raw?.data?.leaderboard)
          ? raw.data.leaderboard
          : Array.isArray(raw?.leaderboard)
          ? raw.leaderboard
          : Array.isArray(raw)
          ? raw
          : [];

        if (items.length > 0) {
          setGiftLeaderboard(items);
        } else {
          setGiftLeaderboard(
            SAMPLE_ANIME_SONGS.map((s, idx) => ({
              rank: idx + 1,
              ...s,
              totalCoins: (5 - idx) * 350 + 120,
              giftCount: (5 - idx) * 8 + 5,
            }))
          );
        }
      })
      .catch(() => {
        setGiftLeaderboard(
          SAMPLE_ANIME_SONGS.map((s, idx) => ({
            rank: idx + 1,
            ...s,
            totalCoins: (5 - idx) * 350 + 120,
            giftCount: (5 - idx) * 8 + 5,
          }))
        );
      });
  };

  useEffect(() => {
    api
      .get("/api/v1/songs?limit=100")
      .then((res) => {
        if (res.data.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          setSongs(res.data.data);
        }
      })
      .catch(() => {
        // Fallback to rich sample data
      });

    api
      .get(ENDPOINTS.artists)
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data?.data)) {
          setFeaturedArtists(res.data.data);
        }
      })
      .catch(() => {});

    loadGiftLeaderboardData();
  }, []);

  const handlePlaySong = (song: Song, index: number) => {
    if (currentSong?.id === song.id) {
      setPlaying(!isPlaying);
    } else {
      setQueue(songs, index);
      setCurrentSong(song);
    }
  };

  const handleAddToPlayLater = (song: Song, e?: any) => {
    e?.stopPropagation?.();
    addToQueue(song);
  };

  const vietSongs = songs.filter((s) => {
    const isVietGenre = (s.genres || []).some(
      (g) =>
        g.slug.includes("dan-ca") ||
        g.slug.includes("viet") ||
        g.name.toLowerCase().includes("dân ca") ||
        g.name.toLowerCase().includes("việt")
    );
    const hasVietLyrics =
      !!s.lyrics &&
      (s.lyrics.includes("Tôi") ||
        s.lyrics.includes("anh") ||
        s.lyrics.includes("em") ||
        s.lyrics.includes("Việt") ||
        s.lyrics.includes("quê hương"));
    return isVietGenre || hasVietLyrics;
  });

  const filteredSongs =
    activeCategory === "Tất cả"
      ? songs
      : activeCategory === "Có Lời 🎤"
      ? songs.filter((s) => !!s.lyrics && s.lyrics.trim().length > 0)
      : activeCategory === "Không Lời 🎵"
      ? songs.filter((s) => !s.lyrics || s.lyrics.trim().length === 0)
      : activeCategory === "Tuyển Chọn 🇻🇳"
      ? vietSongs.length > 0
        ? vietSongs
        : songs
      : activeCategory === "Anime & EDM ✨"
      ? songs.filter(
          (s) =>
            (s.genres || []).some((g) => g.slug.includes("edm") || g.slug.includes("future-bass") || g.slug.includes("electronic"))
        )
      : activeCategory === "Future Bass"
      ? songs.filter((s) => (s.genres || []).some((g) => g.slug.includes("future-bass") || g.slug.includes("melodic-bass")))
      : activeCategory === "Hip-Hop & Rock"
      ? songs.filter((s) => (s.genres || []).some((g) => g.slug.includes("hip-hop") || g.slug.includes("rock") || g.slug.includes("rap")))
      : activeCategory === "Dân Ca Cổ Truyền"
      ? vietSongs
      : activeCategory === "Melodic House"
      ? songs.filter((s) => (s.genres || []).some((g) => g.slug.includes("house")))
      : activeCategory === "Dành Cho Bạn 💖"
      ? songs.filter((s) => {
          const matchGenre = (s.genres || []).some((g) =>
            preferredGenres.some(
              (pg) =>
                pg.toLowerCase().includes(g.name.toLowerCase()) ||
                g.name.toLowerCase().includes(pg.toLowerCase())
            )
          );
          const matchArtist = (s.artists || []).some(
            (a) =>
              preferredArtists.includes(a.id) ||
              preferredArtists.some((pa) => a.name.toLowerCase().includes(pa.toLowerCase()))
          );
          return matchGenre || matchArtist;
        }).length > 0
        ? songs.filter((s) => {
            const matchGenre = (s.genres || []).some((g) =>
              preferredGenres.some(
                (pg) =>
                  pg.toLowerCase().includes(g.name.toLowerCase()) ||
                  g.name.toLowerCase().includes(pg.toLowerCase())
              )
            );
            const matchArtist = (s.artists || []).some(
              (a) =>
                preferredArtists.includes(a.id) ||
                preferredArtists.some((pa) => a.name.toLowerCase().includes(pa.toLowerCase()))
            );
            return matchGenre || matchArtist;
          })
        : songs
      : songs.filter((s) =>
          (s.genres || []).some((g) => g.name.toLowerCase().includes(activeCategory.toLowerCase()))
        );

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
            <Text style={styles.headerTitle}>
              Waifu Player <Text style={styles.headerTitleHighlight}>Stream</Text>
            </Text>
          </View>
          <View style={styles.headerRightActions}>
            <TouchableOpacity
              style={styles.actionIconButton}
              onPress={() => setShowNotificationModal(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="notifications-outline" size={20} color={Colors.dark.primary} />
              {unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
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

          <Text style={styles.bannerTitle}>Tuyển Tập Âm Nhạc Tự Do & Anime 2026</Text>
          <Text style={styles.bannerSubtitle}>
            Hòa mình vào thế giới âm nhạc không bản quyền có lời đầy đủ và đồng bộ siêu chuẩn
          </Text>

          <View style={styles.bannerFooter}>
            <TouchableOpacity
              style={styles.bannerPlayBtn}
              onPress={() => handlePlaySong(vietSongs[0] || songs[0], 0)}
              activeOpacity={0.85}
            >
              <Ionicons name="play" size={18} color="#fff" />
              <Text style={styles.bannerPlayText}>Khám Phá Ngay</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.bannerRoomBtn}
              onPress={() => router.push("/song/current" as any)}
              activeOpacity={0.85}
            >
              <Ionicons name="document-text" size={16} color={Colors.dark.accent} />
              <Text style={styles.bannerRoomText}>Xem Lời Bài Hát</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Hub Shortcuts */}
        <View style={styles.quickHubGrid}>
          <TouchableOpacity
            style={styles.quickHubCard}
            onPress={() => setActiveCategory("Tuyển Chọn 🇻🇳")}
            activeOpacity={0.8}
          >
            <View style={[styles.quickHubIconBg, { backgroundColor: "rgba(233, 30, 99, 0.18)" }]}>
              <Ionicons name="mic" size={20} color={Colors.dark.primary} />
            </View>
            <Text style={styles.quickHubTitle}>Tuyển Chọn</Text>
            <Text style={styles.quickHubSub}>Âm nhạc có lời</Text>
          </TouchableOpacity>

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

        {/* Vietnamese Songs with Synced Lyrics Showcase */}
        {vietSongs.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <View style={styles.sectionHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Ionicons name="sparkles" size={18} color="#f59e0b" />
                <Text style={styles.sectionTitle}>Giai Điệu Quê Hương & Dân Ca 🇻🇳</Text>
              </View>
              <TouchableOpacity onPress={() => setActiveCategory("Tuyển Chọn 🇻🇳")}>
                <Text style={styles.seeAllText}>Xem tất cả</Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16, paddingHorizontal: 16 }}>
              {vietSongs.slice(0, 10).map((vietSong, vIdx) => {
                const isCurrent = currentSong?.id === vietSong.id;
                return (
                  <TouchableOpacity
                    key={vietSong.id}
                    style={styles.vietSongCard}
                    onPress={() => handlePlaySong(vietSong, songs.findIndex((s) => s.id === vietSong.id))}
                    activeOpacity={0.85}
                  >
                    <View style={styles.vietCoverWrapper}>
                      <Image source={{ uri: vietSong.coverUrl ?? "" }} style={styles.vietSongCover} />
                      {!!vietSong.lyrics && vietSong.lyrics.trim().length > 0 ? (
                        <View style={styles.vietBadge}>
                          <Ionicons name="mic" size={10} color="#fff" />
                          <Text style={styles.vietBadgeText}>CÓ LỜI</Text>
                        </View>
                      ) : (
                        <View style={[styles.vietBadge, { backgroundColor: "rgba(6, 182, 212, 0.85)" }]}>
                          <Ionicons name="musical-notes" size={10} color="#fff" />
                          <Text style={styles.vietBadgeText}>KHÔNG LỜI</Text>
                        </View>
                      )}
                      <TouchableOpacity
                        style={styles.vietAddLaterBtn}
                        onPress={(e) => handleAddToPlayLater(vietSong, e)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="time-outline" size={14} color="#fff" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.vietPlayOverlay, isCurrent && isPlaying && styles.vietPlayOverlayActive]}
                        onPress={() => handlePlaySong(vietSong, songs.findIndex((s) => s.id === vietSong.id))}
                      >
                        <Ionicons
                          name={isCurrent && isPlaying ? "pause" : "play"}
                          size={18}
                          color="#fff"
                        />
                      </TouchableOpacity>
                    </View>
                    <Text style={[styles.vietSongTitle, isCurrent && { color: Colors.dark.primaryLight }]} numberOfLines={1}>
                      {vietSong.title}
                    </Text>
                    <Text style={styles.vietSongArtist} numberOfLines={1}>
                      {vietSong.artists?.map((a) => a.name).join(", ") || "V-Pop"}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Featured Waifu Artists */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Nghệ Sĩ Nổi Bật ⭐</Text>
          <TouchableOpacity onPress={() => router.push("/search" as any)}>
            <Text style={styles.seeAllText}>Khám phá</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.artistsScroll}>
           {featuredArtists.map((artist) => (
            <TouchableOpacity
              key={artist.id}
              style={styles.artistItem}
              onPress={() => router.push(`/artist/${artist.id}` as any)}
              activeOpacity={0.8}
            >
              <View style={styles.artistAvatarWrapper}>
                <Image source={{ uri: artist.avatarUrl || undefined }} style={styles.artistAvatar} />
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={14} color={Colors.dark.accent} />
                </View>
              </View>
              <Text style={styles.artistName} numberOfLines={1}>
                {artist.name}
              </Text>
              <Text style={styles.artistRole} numberOfLines={1}>
                {artist.bio || "Nghệ sĩ Waifu"}
              </Text>
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
                style={[
                  styles.categoryChip,
                  isSelected && styles.categoryChipActive,
                  cat === "BXH Quà Tặng 🎁" && styles.giftCategoryChip,
                  cat === "BXH Quà Tặng 🎁" && isSelected && styles.giftCategoryChipActive,
                ]}
                onPress={() => {
                  setActiveCategory(cat);
                  if (cat === "BXH Quà Tặng 🎁") {
                    setLeaderboardTab("gifts");
                  } else {
                    setLeaderboardTab("plays");
                  }
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.categoryText,
                    isSelected && styles.categoryTextActive,
                    cat === "BXH Quà Tặng 🎁" && { color: "#ec4899", fontWeight: "700" },
                    cat === "BXH Quà Tặng 🎁" && isSelected && { color: "#fff", fontWeight: "800" },
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ─── SHOWCASE TOP 3 QUÀ TẶNG (PODIUM) ─────────────────────────── */}
        {giftLeaderboard.length >= 3 && (leaderboardTab === "gifts" || activeCategory === "BXH Quà Tặng 🎁") && (
          <View style={styles.podiumContainer}>
            <View style={styles.podiumHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Ionicons name="trophy" size={18} color="#f59e0b" />
                <Text style={styles.podiumHeaderTitle}>TOP 3 BÀI HÁT NHẬN NHIỀU QUÀ NHẤT 👑</Text>
              </View>
              <Text style={styles.podiumHeaderSub}>Vinh danh bởi người nghe</Text>
            </View>

            <View style={styles.podiumCardsRow}>
              {/* Rank 2 (Á Quân) */}
              {giftLeaderboard[1] && (
                <TouchableOpacity
                  style={[styles.podiumCard, styles.podiumCardRank2]}
                  onPress={() => handlePlaySong(giftLeaderboard[1], 0)}
                  activeOpacity={0.85}
                >
                  <View style={styles.podiumRankBadgeSilver}>
                    <Text style={styles.podiumRankText}>🥈 TOP 2</Text>
                  </View>
                  <Image source={{ uri: giftLeaderboard[1].coverUrl }} style={styles.podiumImg} />
                  <Text style={styles.podiumSongTitle} numberOfLines={1}>{giftLeaderboard[1].title}</Text>
                  <Text style={styles.podiumArtist} numberOfLines={1}>
                    {giftLeaderboard[1].artists?.map((a: any) => a.name).join(", ") || "Artist"}
                  </Text>
                  <View style={styles.podiumCoinBadge}>
                    <GoldCoin size={14} />
                    <Text style={styles.podiumCoinText}>{giftLeaderboard[1].totalCoins?.toLocaleString()} Xu</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.podiumGiftBtnMini}
                    onPress={(e) => {
                      e.stopPropagation();
                      setSelectedGiftSong(giftLeaderboard[1]);
                      setShowGiftModal(true);
                    }}
                  >
                    <Ionicons name="gift" size={12} color="#fff" />
                    <Text style={styles.podiumGiftBtnMiniText}>Tặng Quà</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              )}

              {/* Rank 1 (Quán Quân - Chính giữa & Nổi bật nhất) */}
              {giftLeaderboard[0] && (
                <TouchableOpacity
                  style={[styles.podiumCard, styles.podiumCardRank1]}
                  onPress={() => handlePlaySong(giftLeaderboard[0], 0)}
                  activeOpacity={0.85}
                >
                  <View style={styles.podiumCrownBadge}>
                    <Ionicons name="sparkles" size={12} color="#fff" />
                    <Text style={styles.podiumCrownText}>👑 QUÁN QUÂN</Text>
                  </View>
                  <Image source={{ uri: giftLeaderboard[0].coverUrl }} style={[styles.podiumImg, styles.podiumImgRank1]} />
                  <Text style={[styles.podiumSongTitle, { color: "#f59e0b", fontWeight: "900" }]} numberOfLines={1}>
                    {giftLeaderboard[0].title}
                  </Text>
                  <Text style={styles.podiumArtist} numberOfLines={1}>
                    {giftLeaderboard[0].artists?.map((a: any) => a.name).join(", ") || "Artist"}
                  </Text>
                  <View style={[styles.podiumCoinBadge, { backgroundColor: "rgba(245, 158, 11, 0.25)", borderColor: "#f59e0b" }]}>
                    <GoldCoin size={16} />
                    <Text style={[styles.podiumCoinText, { color: "#f59e0b", fontWeight: "900" }]}>
                      {giftLeaderboard[0].totalCoins?.toLocaleString()} Xu
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.podiumGiftBtnMini, { backgroundColor: "#ec4899" }]}
                    onPress={(e) => {
                      e.stopPropagation();
                      setSelectedGiftSong(giftLeaderboard[0]);
                      setShowGiftModal(true);
                    }}
                  >
                    <Ionicons name="gift" size={12} color="#fff" />
                    <Text style={styles.podiumGiftBtnMiniText}>Tặng Quà 🎁</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              )}

              {/* Rank 3 (Quý Quân) */}
              {giftLeaderboard[2] && (
                <TouchableOpacity
                  style={[styles.podiumCard, styles.podiumCardRank3]}
                  onPress={() => handlePlaySong(giftLeaderboard[2], 0)}
                  activeOpacity={0.85}
                >
                  <View style={styles.podiumRankBadgeBronze}>
                    <Text style={styles.podiumRankText}>🥉 TOP 3</Text>
                  </View>
                  <Image source={{ uri: giftLeaderboard[2].coverUrl }} style={styles.podiumImg} />
                  <Text style={styles.podiumSongTitle} numberOfLines={1}>{giftLeaderboard[2].title}</Text>
                  <Text style={styles.podiumArtist} numberOfLines={1}>
                    {giftLeaderboard[2].artists?.map((a: any) => a.name).join(", ") || "Artist"}
                  </Text>
                  <View style={styles.podiumCoinBadge}>
                    <GoldCoin size={14} />
                    <Text style={styles.podiumCoinText}>{giftLeaderboard[2].totalCoins?.toLocaleString()} Xu</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.podiumGiftBtnMini}
                    onPress={(e) => {
                      e.stopPropagation();
                      setSelectedGiftSong(giftLeaderboard[2]);
                      setShowGiftModal(true);
                    }}
                  >
                    <Ionicons name="gift" size={12} color="#fff" />
                    <Text style={styles.podiumGiftBtnMiniText}>Tặng Quà</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* ─── LEADERBOARD SECTION HEADER & TAB SWITCHER ───────────────── */}
        <View style={styles.leaderboardSectionHeader}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {leaderboardTab === "gifts" ? "Bảng Xếp Hạng Quà Tặng 🎁" : "Bảng Xếp Hạng & Bài Hát 🔥"}
            </Text>
            <Text style={styles.songCountText}>
              {leaderboardTab === "gifts" ? `${giftLeaderboard.length} bài hát` : `${filteredSongs.length} bài hát`}
            </Text>
          </View>

          {/* Switcher Buttons: Lượt Nghe vs Quà Tặng */}
          <View style={styles.leaderboardTabSwitcher}>
            <TouchableOpacity
              style={[styles.lbTabBtn, leaderboardTab === "plays" && styles.lbTabBtnActivePlays]}
              onPress={() => setLeaderboardTab("plays")}
              activeOpacity={0.8}
            >
              <Ionicons
                name="flame"
                size={14}
                color={leaderboardTab === "plays" ? "#fff" : "#f59e0b"}
              />
              <Text style={[styles.lbTabText, leaderboardTab === "plays" && styles.lbTabTextActive]}>
                BXH Lượt Nghe 🔥
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.lbTabBtn, leaderboardTab === "gifts" && styles.lbTabBtnActiveGifts]}
              onPress={() => setLeaderboardTab("gifts")}
              activeOpacity={0.8}
            >
              <Ionicons
                name="gift"
                size={14}
                color={leaderboardTab === "gifts" ? "#fff" : "#ec4899"}
              />
              <Text style={[styles.lbTabText, leaderboardTab === "gifts" && styles.lbTabTextActive]}>
                BXH Quà Tặng 🎁
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── RENDER DANH SÁCH BÀI HÁT THEO TAB ──────────────────────── */}
        {leaderboardTab === "gifts" ? (
          /* Danh Sách BXH Quà Tặng */
          giftLeaderboard.map((song, index) => {
            const isCurrent = currentSong?.id === song.id;
            const artistName = song.artists?.map((a: any) => a.name).join(", ") || "Unknown Artist";
            const rankInfo = getRankBadge(index);

            return (
              <TouchableOpacity
                key={song.id}
                style={[styles.songCard, isCurrent && styles.songCardActive, styles.songCardGiftRank]}
                onPress={() => handlePlaySong(song, index)}
                activeOpacity={0.82}
              >
                {/* Rank Badge */}
                <View style={[styles.rankBox, { backgroundColor: rankInfo.bg }]}>
                  <Text style={[styles.rankIndex, { color: rankInfo.color }]}>
                    {rankInfo.label}
                  </Text>
                </View>

                {/* Song Cover */}
                <Image
                  source={{
                    uri: song.coverUrl ?? "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80",
                  }}
                  style={styles.songThumb}
                />

                {/* Song Information */}
                <View style={styles.songInfo}>
                  <View style={styles.songTitleRow}>
                    <Text
                      style={[styles.songTitle, isCurrent && { color: Colors.dark.primaryLight }]}
                      numberOfLines={1}
                    >
                      {song.title}
                    </Text>
                    {isCurrent && isPlaying && (
                      <View style={styles.nowPlayingTag}>
                        <Ionicons name="musical-notes" size={11} color={Colors.dark.accent} />
                      </View>
                    )}
                  </View>

                  {/* Gift Stats & Artist */}
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 3 }}>
                    <View style={styles.giftBadgeMini}>
                      <GoldCoin size={12} />
                      <Text style={styles.giftBadgeMiniText}>+{song.totalCoins || 0} Xu</Text>
                    </View>
                    <View style={styles.giftCountMini}>
                      <Text style={styles.giftCountMiniText}>🎁 {song.giftCount || 0} quà</Text>
                    </View>
                    <Text style={styles.songArtist} numberOfLines={1}>
                      • {artistName}
                    </Text>
                  </View>
                </View>

                {/* Right Action Buttons */}
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  {/* Button Tặng Quà Nhanh */}
                  <TouchableOpacity
                    style={styles.giftSendQuickBtn}
                    onPress={(e) => {
                      e.stopPropagation();
                      setSelectedGiftSong(song);
                      setShowGiftModal(true);
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="gift" size={14} color="#ec4899" />
                    <Text style={styles.giftSendQuickBtnText}>Tặng</Text>
                  </TouchableOpacity>

                  {/* Play Button */}
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
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          /* Danh Sách BXH Lượt Nghe (Thông thường) */
          filteredSongs.map((song, index) => {
            const isCurrent = currentSong?.id === song.id;
            const artistName = song.artists?.map((a) => a.name).join(", ") || "Unknown Artist";
            const rankInfo = getRankBadge(index);
            const hasLyrics = !!song.lyrics && song.lyrics.trim().length > 0;

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
                  source={{
                    uri:
                      song.coverUrl ??
                      "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80",
                  }}
                  style={styles.songThumb}
                />

                <View style={styles.songInfo}>
                  <View style={styles.songTitleRow}>
                    <Text
                      style={[styles.songTitle, isCurrent && { color: Colors.dark.primaryLight }]}
                      numberOfLines={1}
                    >
                      {song.title}
                    </Text>
                    {isCurrent && isPlaying && (
                      <View style={styles.nowPlayingTag}>
                        <Ionicons name="musical-notes" size={11} color={Colors.dark.accent} />
                      </View>
                    )}
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 3 }}>
                    {hasLyrics ? (
                      <View style={styles.lyricsTagMini}>
                        <Ionicons name="mic" size={9} color={Colors.dark.primaryLight} />
                        <Text style={styles.lyricsTagMiniText}>Có Lời</Text>
                      </View>
                    ) : (
                      <View style={[styles.lyricsTagMini, styles.instrumentalTagMini]}>
                        <Ionicons name="musical-notes" size={9} color="#22d3ee" />
                        <Text style={[styles.lyricsTagMiniText, { color: "#22d3ee" }]}>Không Lời</Text>
                      </View>
                    )}
                    <Text style={styles.songArtist} numberOfLines={1}>
                      {artistName} • {formatDuration(song.duration)}
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  {/* Quick Gift Button */}
                  <TouchableOpacity
                    style={styles.quickGiftBtnMiniCircle}
                    onPress={(e) => {
                      e.stopPropagation();
                      setSelectedGiftSong(song);
                      setShowGiftModal(true);
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="gift-outline" size={18} color="#ec4899" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionQueueBtn}
                    onPress={(e) => handleAddToPlayLater(song, e)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityLabel="Thêm vào danh sách phát sau"
                  >
                    <Ionicons name="time-outline" size={22} color={Colors.dark.textMuted} />
                  </TouchableOpacity>

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
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <NotificationModal
        visible={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
      />

      <GiftModal
        visible={showGiftModal}
        song={selectedGiftSong}
        onClose={() => setShowGiftModal(false)}
        onGiftSuccess={() => {
          loadGiftLeaderboardData();
        }}
      />
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
    position: "relative",
  },
  unreadBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#ef4444",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: Colors.dark.background,
  },
  unreadBadgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "800",
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
  vietSongCard: {
    width: 140,
    marginRight: 14,
  },
  vietCoverWrapper: {
    position: "relative",
    width: 140,
    height: 140,
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 8,
    backgroundColor: Colors.dark.card,
  },
  vietSongCover: {
    width: "100%",
    height: "100%",
  },
  vietBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(233, 30, 99, 0.85)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  vietBadgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  vietPlayOverlay: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  vietPlayOverlayActive: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primaryLight,
  },
  vietSongTitle: {
    color: Colors.dark.text,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 2,
  },
  vietSongArtist: {
    color: Colors.dark.textMuted,
    fontSize: 11,
    fontWeight: "500",
  },
  lyricsTagMini: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(233, 30, 140, 0.15)",
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: "rgba(233, 30, 140, 0.4)",
  },
  lyricsTagMiniText: {
    color: Colors.dark.primaryLight,
    fontSize: 9,
    fontWeight: "700",
  },
  instrumentalTagMini: {
    backgroundColor: "rgba(6, 182, 212, 0.15)",
    borderColor: "rgba(6, 182, 212, 0.4)",
  },
  vietAddLaterBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    alignItems: "center",
    justifyContent: "center",
  },
  actionQueueBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  floatingQueueToast: {
    position: "absolute",
    bottom: 95,
    left: 20,
    right: 20,
    backgroundColor: "rgba(18, 18, 28, 0.95)",
    borderWidth: 1,
    borderColor: "#10b981",
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 8,
  },
  floatingQueueToastText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },

  // Gift Category & Leaderboard Styles
  giftCategoryChip: {
    borderColor: "rgba(236, 72, 153, 0.4)",
    backgroundColor: "rgba(236, 72, 153, 0.08)",
  },
  giftCategoryChipActive: {
    backgroundColor: "#ec4899",
    borderColor: "#ec4899",
  },
  leaderboardSectionHeader: {
    marginBottom: 10,
  },
  leaderboardTabSwitcher: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: 4,
    gap: 6,
    marginTop: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  lbTabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 9,
    gap: 6,
  },
  lbTabBtnActivePlays: {
    backgroundColor: "#d97706",
  },
  lbTabBtnActiveGifts: {
    backgroundColor: "#ec4899",
  },
  lbTabText: {
    color: Colors.dark.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  lbTabTextActive: {
    color: "#fff",
    fontWeight: "800",
  },

  // Podium Showcase Styles
  podiumContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 20,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.25)",
  },
  podiumHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  podiumHeaderTitle: {
    color: "#f59e0b",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  podiumHeaderSub: {
    color: Colors.dark.textMuted,
    fontSize: 11,
  },
  podiumCardsRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  podiumCard: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 14,
    padding: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    position: "relative",
  },
  podiumCardRank1: {
    borderColor: "rgba(245, 158, 11, 0.6)",
    backgroundColor: "rgba(245, 158, 11, 0.08)",
    paddingTop: 14,
    paddingBottom: 12,
  },
  podiumCardRank2: {
    borderColor: "rgba(203, 213, 225, 0.3)",
  },
  podiumCardRank3: {
    borderColor: "rgba(217, 119, 6, 0.3)",
  },
  podiumCrownBadge: {
    position: "absolute",
    top: -10,
    backgroundColor: "#d97706",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 3,
  },
  podiumCrownText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "900",
  },
  podiumRankBadgeSilver: {
    position: "absolute",
    top: -9,
    backgroundColor: "#64748b",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  podiumRankBadgeBronze: {
    position: "absolute",
    top: -9,
    backgroundColor: "#78350f",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  podiumRankText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "800",
  },
  podiumImg: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginTop: 6,
    marginBottom: 6,
  },
  podiumImgRank1: {
    width: 72,
    height: 72,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#f59e0b",
  },
  podiumSongTitle: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 2,
  },
  podiumArtist: {
    color: Colors.dark.textMuted,
    fontSize: 10,
    textAlign: "center",
    marginBottom: 6,
  },
  podiumCoinBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  podiumCoinText: {
    color: "#f59e0b",
    fontSize: 10,
    fontWeight: "700",
  },
  podiumGiftBtnMini: {
    backgroundColor: Colors.dark.primary,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  podiumGiftBtnMiniText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
  },

  // Song Row Gift Badges Styles
  songCardGiftRank: {
    borderColor: "rgba(236, 72, 153, 0.2)",
  },
  giftBadgeMini: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: "rgba(245, 158, 11, 0.35)",
  },
  giftBadgeMiniText: {
    color: "#f59e0b",
    fontSize: 9,
    fontWeight: "800",
  },
  giftCountMini: {
    backgroundColor: "rgba(236, 72, 153, 0.15)",
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: "rgba(236, 72, 153, 0.35)",
  },
  giftCountMiniText: {
    color: "#ec4899",
    fontSize: 9,
    fontWeight: "800",
  },
  giftSendQuickBtn: {
    backgroundColor: "rgba(236, 72, 153, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(236, 72, 153, 0.4)",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  giftSendQuickBtnText: {
    color: "#ec4899",
    fontSize: 11,
    fontWeight: "800",
  },
  quickGiftBtnMiniCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(236, 72, 153, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(236, 72, 153, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
});
