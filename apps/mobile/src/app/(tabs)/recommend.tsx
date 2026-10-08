import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors } from "../../constants/colors";
import { api } from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { usePlayerStore } from "../../store/playerStore";
import { formatDuration } from "@waifu-player/utils";
import { GiftModal } from "../../features/gifts/GiftModal";
import type { Song, Album, Artist } from "@waifu-player/types";

export default function RecommendScreen() {
  const router = useRouter();
  const { user, preferredGenres, preferredArtists } = useAuthStore();
  const { currentSong, isPlaying, setCurrentSong, setQueue, setPlaying, addToQueue } = usePlayerStore();

  const [loading, setLoading] = useState(true);
  const [songs, setSongs] = useState<Song[]>([]);
  const [historySongs, setHistorySongs] = useState<Song[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);

  // Gift Modal
  const [selectedGiftSong, setSelectedGiftSong] = useState<Song | null>(null);
  const [showGiftModal, setShowGiftModal] = useState(false);

  useEffect(() => {
    loadRecommendationData();
  }, []);

  const loadRecommendationData = async () => {
    setLoading(true);
    try {
      const [songsRes, historyRes, albumsRes, artistsRes] = await Promise.all([
        api.get("/api/v1/songs?limit=100").catch(() => ({ data: null })),
        api.get("/api/v1/users/me/history").catch(() => ({ data: null })),
        api.get("/api/v1/albums").catch(() => ({ data: null })),
        api.get("/api/v1/artists").catch(() => ({ data: null })),
      ]);

      if (songsRes?.data?.success && Array.isArray(songsRes.data.data)) {
        setSongs(songsRes.data.data);
      }
      if (historyRes?.data?.success && Array.isArray(historyRes.data.data)) {
        const mapped = historyRes.data.data.map((item: any) => item.song || item);
        setHistorySongs(mapped);
      }
      if (albumsRes?.data?.success && Array.isArray(albumsRes.data.data)) {
        setAlbums(albumsRes.data.data);
      }
      if (artistsRes?.data?.success && Array.isArray(artistsRes.data.data)) {
        setArtists(artistsRes.data.data);
      }
    } finally {
      setLoading(false);
    }
  };

  // 1. Phân tích thể loại người dùng nghe nhiều nhất từ lịch sử nghe nhạc
  const topListenedGenres = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of historySongs) {
      if (Array.isArray(s.genres)) {
        for (const g of s.genres) {
          const name = g.name || g.slug;
          if (name) {
            counts[name] = (counts[name] || 0) + 1;
          }
        }
      }
    }
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted.map(([genre, count]) => ({ genre, count }));
  }, [historySongs]);

  // 2. Bài hát đề xuất dựa trên thể loại nghe nhiều nhất
  const recommendedByMostListened = useMemo(() => {
    if (topListenedGenres.length === 0) {
      // Fallback nếu chưa nghe nhiều: dùng các bài có lượt nghe cao
      return songs.slice(0, 10);
    }
    const topGenreNames = topListenedGenres.slice(0, 3).map((g) => g.genre.toLowerCase());
    const matched = songs.filter((s) =>
      (s.genres || []).some((g) =>
        topGenreNames.some((top) => (g.name || "").toLowerCase().includes(top) || top.includes((g.name || "").toLowerCase()))
      )
    );
    return matched.length > 0 ? matched : songs.slice(0, 10);
  }, [songs, topListenedGenres]);

  // 3. Bài hát đề xuất dựa trên Thể loại đã chọn lúc tạo tài khoản
  const recommendedByPreferredGenres = useMemo(() => {
    const prefs = (preferredGenres && preferredGenres.length > 0 ? preferredGenres : ["J-Pop", "Vocaloid", "Anisong"]).map((g) =>
      g.toLowerCase()
    );
    const matched = songs.filter((s) =>
      (s.genres || []).some((g) =>
        prefs.some((p) => (g.name || "").toLowerCase().includes(p) || p.includes((g.name || "").toLowerCase()))
      )
    );
    return matched.length > 0 ? matched : songs.slice(5, 15);
  }, [songs, preferredGenres]);

  // 4. Bài hát đề xuất dựa trên Ca sĩ đã chọn lúc tạo tài khoản
  const recommendedByPreferredArtists = useMemo(() => {
    const artistPrefs = (preferredArtists && preferredArtists.length > 0 ? preferredArtists : ["Hatsune Miku", "LiSA", "YOASOBI"]).map(
      (a) => a.toLowerCase()
    );
    const matched = songs.filter((s) =>
      (s.artists || []).some((art) =>
        artistPrefs.some((p) => (art.name || "").toLowerCase().includes(p) || p.includes((art.name || "").toLowerCase()))
      )
    );
    return matched.length > 0 ? matched : songs.slice(10, 20);
  }, [songs, preferredArtists]);

  const handlePlaySong = (song: Song, list: Song[], index: number) => {
    if (currentSong?.id === song.id) {
      setPlaying(!isPlaying);
    } else {
      setQueue(list, index);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <View style={styles.headerBadge}>
              <Ionicons name="sparkles" size={12} color={Colors.dark.primaryLight} />
              <Text style={styles.headerBadgeText}>SMART AI MUSIC ENGINE</Text>
            </View>
            <Text style={styles.headerTitle}>Đề Xuất Cho Bạn ✨</Text>
            <Text style={styles.headerSub}>
              Cá nhân hóa theo gu nghe thực tế & hồ sơ sở thích của bạn
            </Text>
          </View>
          <TouchableOpacity style={styles.refreshBtn} onPress={loadRecommendationData} activeOpacity={0.8}>
            <Ionicons name="reload" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Colors.dark.primary} />
            <Text style={styles.loadingText}>Đang phân tích gu âm nhạc của bạn...</Text>
          </View>
        ) : (
          <>
            {/* ─── TASTE PROFILE CARD ────────────────────────────────────── */}
            <View style={styles.tasteCard}>
              <View style={styles.tasteCardHeader}>
                <Ionicons name="finger-print-outline" size={20} color={Colors.dark.accent} />
                <Text style={styles.tasteCardTitle}>Hồ Sơ Gu Âm Nhạc Của Bạn</Text>
              </View>

              {/* 1. Thể loại nghe nhiều nhất */}
              <View style={styles.tasteRow}>
                <Text style={styles.tasteLabel}>🎧 Nghe nhiều nhất:</Text>
                <View style={styles.tasteChipsWrap}>
                  {topListenedGenres.length > 0 ? (
                    topListenedGenres.slice(0, 3).map((g) => (
                      <View key={g.genre} style={styles.tasteChipHighlight}>
                        <Text style={styles.tasteChipHighlightText}>
                          {g.genre} ({g.count} lượt)
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.tasteMutedText}>Chưa có lịch sử, đang gợi ý bài hát hot nhất</Text>
                  )}
                </View>
              </View>

              {/* 2. Thể loại đã chọn lúc tạo tài khoản */}
              <View style={styles.tasteRow}>
                <Text style={styles.tasteLabel}>💖 Thể loại đã chọn:</Text>
                <View style={styles.tasteChipsWrap}>
                  {(preferredGenres && preferredGenres.length > 0 ? preferredGenres : ["Vocaloid", "Anisong", "J-Pop"]).map((g) => (
                    <View key={g} style={styles.tasteChip}>
                      <Text style={styles.tasteChipText}>{g}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* 3. Ca sĩ đã chọn lúc tạo tài khoản */}
              <View style={styles.tasteRow}>
                <Text style={styles.tasteLabel}>⭐ Ca sĩ yêu thích:</Text>
                <View style={styles.tasteChipsWrap}>
                  {(preferredArtists && preferredArtists.length > 0 ? preferredArtists : ["Hatsune Miku", "LiSA", "YOASOBI"]).map((a) => (
                    <View key={a} style={[styles.tasteChip, { borderColor: "rgba(245, 158, 11, 0.4)" }]}>
                      <Text style={[styles.tasteChipText, { color: "#f59e0b" }]}>{a}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* ─── SECTION 1: THEO THỂ LOẠI NGHE NHIỀU NHẤT ─────────────── */}
            <View style={styles.sectionWrap}>
              <View style={styles.sectionHeaderRow}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Ionicons name="flame" size={18} color="#f59e0b" />
                  <Text style={styles.sectionTitle}>
                    Dựa Trên Thể Loại Bạn Nghe Nhiều Nhất 🔥
                  </Text>
                </View>
                <Text style={styles.sectionCountText}>
                  {recommendedByMostListened.length} bài hát
                </Text>
              </View>
              <Text style={styles.sectionSubDesc}>
                Phân tích tự động từ tần suất bài hát bạn đã thưởng thức trong thời gian qua
              </Text>

              {/* Horizontal Cards Showcase */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
                {recommendedByMostListened.map((song, idx) => {
                  const isCurrent = currentSong?.id === song.id;
                  return (
                    <TouchableOpacity
                      key={song.id}
                      style={styles.hCard}
                      onPress={() => handlePlaySong(song, recommendedByMostListened, idx)}
                      activeOpacity={0.85}
                    >
                      <View style={styles.hCoverWrap}>
                        <Image source={{ uri: song.coverUrl ?? "" }} style={styles.hCover} />
                        <TouchableOpacity
                          style={[styles.hPlayBtn, isCurrent && isPlaying && styles.hPlayBtnActive]}
                          onPress={() => handlePlaySong(song, recommendedByMostListened, idx)}
                        >
                          <Ionicons
                            name={isCurrent && isPlaying ? "pause" : "play"}
                            size={16}
                            color="#fff"
                          />
                        </TouchableOpacity>
                      </View>
                      <Text style={[styles.hTitle, isCurrent && { color: Colors.dark.primaryLight }]} numberOfLines={1}>
                        {song.title}
                      </Text>
                      <Text style={styles.hArtist} numberOfLines={1}>
                        {song.artists?.map((a) => a.name).join(", ") || "Artist"}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* ─── SECTION 2: THEO THỂ LOẠI ĐÃ CHỌN LÚC TẠO TÀI KHOẢN ─────── */}
            <View style={styles.sectionWrap}>
              <View style={styles.sectionHeaderRow}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Ionicons name="heart" size={18} color="#ec4899" />
                  <Text style={styles.sectionTitle}>
                    Thể Loại Bạn Đã Chọn Lúc Tạo Tài Khoản 💖
                  </Text>
                </View>
                <Text style={styles.sectionCountText}>
                  {recommendedByPreferredGenres.length} bài hát
                </Text>
              </View>
              <Text style={styles.sectionSubDesc}>
                Khớp với các thể loại bạn đã đánh dấu quan tâm trong hồ sơ người dùng
              </Text>

              {/* Song List Rows */}
              {recommendedByPreferredGenres.map((song, idx) => {
                const isCurrent = currentSong?.id === song.id;
                return (
                  <TouchableOpacity
                    key={song.id}
                    style={[styles.songRowCard, isCurrent && styles.songRowCardActive]}
                    onPress={() => handlePlaySong(song, recommendedByPreferredGenres, idx)}
                    activeOpacity={0.82}
                  >
                    <Image source={{ uri: song.coverUrl ?? "" }} style={styles.songRowThumb} />
                    <View style={{ flex: 1, marginRight: 10 }}>
                      <Text style={[styles.songRowTitle, isCurrent && { color: Colors.dark.primaryLight }]} numberOfLines={1}>
                        {song.title}
                      </Text>
                      <Text style={styles.songRowArtist} numberOfLines={1}>
                        {song.artists?.map((a) => a.name).join(", ") || "Artist"} • {formatDuration(song.duration)}
                      </Text>
                    </View>

                    {/* Quick Action Buttons */}
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      {/* Tặng quà */}
                      <TouchableOpacity
                        style={styles.miniGiftBtn}
                        onPress={(e) => {
                          e.stopPropagation();
                          setSelectedGiftSong(song);
                          setShowGiftModal(true);
                        }}
                      >
                        <Ionicons name="gift" size={14} color="#ec4899" />
                      </TouchableOpacity>

                      {/* Thêm vào phát sau */}
                      <TouchableOpacity
                        style={styles.miniQueueBtn}
                        onPress={(e) => {
                          e.stopPropagation();
                          addToQueue(song);
                        }}
                      >
                        <Ionicons name="time-outline" size={16} color={Colors.dark.textMuted} />
                      </TouchableOpacity>

                      {/* Play */}
                      <TouchableOpacity
                        onPress={() => handlePlaySong(song, recommendedByPreferredGenres, idx)}
                      >
                        <Ionicons
                          name={isCurrent && isPlaying ? "pause-circle" : "play-circle"}
                          size={32}
                          color={isCurrent ? Colors.dark.primaryLight : Colors.dark.accent}
                        />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* ─── SECTION 3: THEO CA SĨ BẠN ĐÃ CHỌN LÚC TẠO TÀI KHOẢN ─────── */}
            <View style={styles.sectionWrap}>
              <View style={styles.sectionHeaderRow}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Ionicons name="mic" size={18} color="#06b6d4" />
                  <Text style={styles.sectionTitle}>
                    Ca Sĩ & Giọng Ca Bạn Đã Chọn ⭐
                  </Text>
                </View>
              </View>
              <Text style={styles.sectionSubDesc}>
                Những bài hát tuyệt đỉnh từ các nghệ sĩ mà bạn yêu thích hàng đầu
              </Text>

              {recommendedByPreferredArtists.map((song, idx) => {
                const isCurrent = currentSong?.id === song.id;
                return (
                  <TouchableOpacity
                    key={song.id}
                    style={[styles.songRowCard, isCurrent && styles.songRowCardActive]}
                    onPress={() => handlePlaySong(song, recommendedByPreferredArtists, idx)}
                    activeOpacity={0.82}
                  >
                    <Image source={{ uri: song.coverUrl ?? "" }} style={styles.songRowThumb} />
                    <View style={{ flex: 1, marginRight: 10 }}>
                      <Text style={[styles.songRowTitle, isCurrent && { color: Colors.dark.primaryLight }]} numberOfLines={1}>
                        {song.title}
                      </Text>
                      <Text style={styles.songRowArtist} numberOfLines={1}>
                        {song.artists?.map((a) => a.name).join(", ") || "Artist"} • {formatDuration(song.duration)}
                      </Text>
                    </View>

                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <TouchableOpacity
                        style={styles.miniGiftBtn}
                        onPress={(e) => {
                          e.stopPropagation();
                          setSelectedGiftSong(song);
                          setShowGiftModal(true);
                        }}
                      >
                        <Ionicons name="gift" size={14} color="#ec4899" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handlePlaySong(song, recommendedByPreferredArtists, idx)}
                      >
                        <Ionicons
                          name={isCurrent && isPlaying ? "pause-circle" : "play-circle"}
                          size={32}
                          color={isCurrent ? Colors.dark.primaryLight : Colors.dark.accent}
                        />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* ─── SECTION 4: ALBUM ĐỀ XUẤT CHO BẠN ────────────────────────── */}
            {albums.length > 0 && (
              <View style={styles.sectionWrap}>
                <View style={styles.sectionHeaderRow}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Ionicons name="disc" size={18} color="#8b5cf6" />
                    <Text style={styles.sectionTitle}>Album Đề Xuất Cho Bạn 💿</Text>
                  </View>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
                  {albums.map((album) => (
                    <TouchableOpacity
                      key={album.id}
                      style={styles.albumCard}
                      onPress={() => router.push(`/album/${album.id}` as any)}
                      activeOpacity={0.85}
                    >
                      <Image source={{ uri: album.coverUrl ?? "" }} style={styles.albumCover} />
                      <Text style={styles.albumTitle} numberOfLines={1}>{album.title}</Text>
                      <Text style={styles.albumArtist} numberOfLines={1}>{album.artist?.name || "Various Artists"}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Gift Modal */}
      <GiftModal
        visible={showGiftModal}
        song={selectedGiftSong}
        onClose={() => setShowGiftModal(false)}
        onGiftSuccess={() => {}}
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  headerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(233, 30, 140, 0.12)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
    alignSelf: "flex-start",
  },
  headerBadgeText: {
    color: Colors.dark.primaryLight,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  headerSub: {
    color: Colors.dark.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  refreshBtn: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    padding: 10,
    borderRadius: 12,
    marginTop: 4,
  },
  loadingBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  loadingText: {
    color: Colors.dark.textMuted,
    fontSize: 13,
    marginTop: 12,
  },

  // Taste Card
  tasteCard: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    marginBottom: 20,
    gap: 12,
  },
  tasteCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
    paddingBottom: 8,
  },
  tasteCardTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
  tasteRow: {
    gap: 6,
  },
  tasteLabel: {
    color: Colors.dark.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  tasteChipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tasteChip: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  tasteChipText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  tasteChipHighlight: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.35)",
  },
  tasteChipHighlightText: {
    color: "#f59e0b",
    fontSize: 11,
    fontWeight: "700",
  },
  tasteMutedText: {
    color: Colors.dark.textMuted,
    fontSize: 11,
    fontStyle: "italic",
  },

  // Section Styles
  sectionWrap: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
  sectionCountText: {
    color: Colors.dark.textMuted,
    fontSize: 11,
    fontWeight: "600",
  },
  sectionSubDesc: {
    color: Colors.dark.textMuted,
    fontSize: 11,
    marginBottom: 12,
  },
  hScroll: {
    gap: 12,
    paddingRight: 10,
  },
  hCard: {
    width: 130,
  },
  hCoverWrap: {
    position: "relative",
    width: 130,
    height: 130,
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 6,
    backgroundColor: Colors.dark.surface,
  },
  hCover: {
    width: "100%",
    height: "100%",
  },
  hPlayBtn: {
    position: "absolute",
    bottom: 6,
    right: 6,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  hPlayBtnActive: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primaryLight,
  },
  hTitle: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 2,
  },
  hArtist: {
    color: Colors.dark.textMuted,
    fontSize: 11,
  },

  // Song Rows
  songRowCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    padding: 10,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  songRowCardActive: {
    borderColor: "rgba(233, 30, 140, 0.4)",
    backgroundColor: "rgba(233, 30, 140, 0.06)",
  },
  songRowThumb: {
    width: 46,
    height: 46,
    borderRadius: 10,
    marginRight: 12,
    backgroundColor: Colors.dark.surface,
  },
  songRowTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
  },
  songRowArtist: {
    color: Colors.dark.textMuted,
    fontSize: 11,
  },
  miniGiftBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(236, 72, 153, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(236, 72, 153, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  miniQueueBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Album Cards
  albumCard: {
    width: 120,
  },
  albumCover: {
    width: 120,
    height: 120,
    borderRadius: 14,
    marginBottom: 6,
    backgroundColor: Colors.dark.surface,
  },
  albumTitle: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 2,
  },
  albumArtist: {
    color: Colors.dark.textMuted,
    fontSize: 11,
  },
});
