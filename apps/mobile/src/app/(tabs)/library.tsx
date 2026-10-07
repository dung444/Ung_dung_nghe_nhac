import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { api } from "../../services/api";
import { ENDPOINTS } from "../../constants/api";
import { useAuthStore } from "../../store/authStore";
import { usePlayerStore } from "../../store/playerStore";
import { useToastStore } from "../../store/toastStore";
import { SongRow } from "../../features/songs/components/SongRow";
import { GiftModal } from "../../features/gifts/GiftModal";
import type { Playlist, Song, Artist, Album } from "@waifu-player/types";

const LIBRARY_TABS = ["Bài hát", "Album", "Nghệ sĩ", "Playlist", "BXH Quà Tặng"] as const;
type LibraryTab = (typeof LIBRARY_TABS)[number];

export default function LibraryScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { showSuccess, showWarning } = useToastStore();
  const { currentSong, isPlaying, setQueue, setCurrentSong, setPlaying } = usePlayerStore();

  const [activeTab, setActiveTab] = useState<LibraryTab>("Bài hát");
  const [loading, setLoading] = useState(false);

  // Data states
  const [likedSongs, setLikedSongs] = useState<Song[]>([]);
  const [historySongs, setHistorySongs] = useState<Song[]>([]);
  const [albums, setAlbums] = useState<any[]>([]);
  const [artists, setArtists] = useState<any[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  // Modals
  const [showCreatePlaylistModal, setShowCreatePlaylistModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistDesc, setNewPlaylistDesc] = useState("");
  const [creatingPlaylist, setCreatingPlaylist] = useState(false);

  // Gift Modal
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [giftTargetSong, setGiftTargetSong] = useState<Song | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Playlists
      api.get("/api/v1/playlists").then((res) => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          setPlaylists(res.data.data);
        }
      }).catch(() => {});

      // 2. Liked songs
      api.get("/api/v1/users/me/liked").then((res) => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          const mapped = res.data.data.map((item: any) => item.song || item);
          setLikedSongs(mapped);
        }
      }).catch(() => {});

      // 3. History songs
      api.get("/api/v1/users/me/history").then((res) => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          const mapped = res.data.data.map((item: any) => item.song || item);
          setHistorySongs(mapped);
        }
      }).catch(() => {});

      // 4. Albums
      api.get("/api/v1/albums").then((res) => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          setAlbums(res.data.data);
        }
      }).catch(() => {});

      // 5. Artists
      api.get("/api/v1/artists").then((res) => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          setArtists(res.data.data);
        }
      }).catch(() => {});

      // 6. Gift Leaderboard
      api.get(ENDPOINTS.giftLeaderboard).then((res) => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          setLeaderboard(res.data.data);
        }
      }).catch(() => {});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isAuthenticated]);

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) {
      showWarning("Thiếu thông tin", "Vui lòng nhập tên danh sách phát!");
      return;
    }
    const plName = newPlaylistName.trim();
    setCreatingPlaylist(true);
    try {
      const res = await api.post("/api/v1/playlists", {
        name: plName,
        description: newPlaylistDesc.trim(),
        isPublic: true,
      });
      if (res.data?.success) {
        setPlaylists((prev) => [res.data.data, ...prev]);
        setShowCreatePlaylistModal(false);
        setNewPlaylistName("");
        setNewPlaylistDesc("");
        showSuccess("Tạo danh sách phát 🎵", `Đã tạo playlist "${plName}" thành công!`);
      }
    } catch {
      const mockPlaylist: Playlist = {
        id: `pl-${Date.now()}`,
        name: plName,
        description: newPlaylistDesc.trim(),
        coverUrl: null,
        isPublic: true,
        userId: "me",
        songCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setPlaylists((prev) => [mockPlaylist, ...prev]);
      setShowCreatePlaylistModal(false);
      setNewPlaylistName("");
      setNewPlaylistDesc("");
      showSuccess("Tạo danh sách phát 🎵", `Đã tạo playlist "${plName}" thành công!`);
    } finally {
      setCreatingPlaylist(false);
    }
  };

  const handlePlaySong = (song: Song, index: number, songList: Song[]) => {
    // Nếu bấm vào bài đang phát: không reset về đầu
    if (currentSong?.id === song.id) {
      if (!isPlaying) {
        setPlaying(true);
      }
    } else {
      setQueue(songList, index);
      setCurrentSong(song);
    }
  };

  const handleOpenGiftForSong = (song: Song) => {
    setGiftTargetSong(song);
    setShowGiftModal(true);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Thư viện Anime 📚✨</Text>
          <Text style={styles.subTitle}>Bộ sưu tập âm nhạc & thế giới thần tượng của bạn</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => setShowCreatePlaylistModal(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle" size={28} color={Colors.dark.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 5 Filter Tabs with Anime Aesthetic */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabContent}>
        {LIBRARY_TABS.map((tab) => {
          const isSelected = activeTab === tab;
          let iconName: any = "musical-note";
          if (tab === "Album") iconName = "disc";
          else if (tab === "Nghệ sĩ") iconName = "people";
          else if (tab === "Playlist") iconName = "list";
          else if (tab === "BXH Quà Tặng") iconName = "trophy";

          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tabChip, isSelected && styles.tabChipActive]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={iconName}
                size={14}
                color={isSelected ? "#fff" : Colors.dark.textMuted}
                style={{ marginRight: 5 }}
              />
              <Text style={[styles.tabChipText, isSelected && styles.tabChipTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading && likedSongs.length === 0 && playlists.length === 0 ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={Colors.dark.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ═════════════════ TAB 1: BÀI HÁT ═════════════════ */}
          {activeTab === "Bài hát" && (
            <View>
              {/* Liked Songs Hero Banner */}
              <TouchableOpacity
                style={styles.heroCard}
                onPress={() => {
                  if (likedSongs.length > 0) {
                    setQueue(likedSongs, 0);
                    showSuccess("Phát bài hát yêu thích 💖", `Bắt đầu phát ${likedSongs.length} bài hát anime.`);
                  } else {
                    showWarning("Chưa có bài hát", "Bạn chưa bấm thích bài hát nào.");
                  }
                }}
                activeOpacity={0.85}
              >
                <View style={styles.heroIconBox}>
                  <Ionicons name="heart" size={32} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.heroTitle}>Bài Hát Đã Thích 💖</Text>
                  <Text style={styles.heroSub}>
                    {likedSongs.length > 0
                      ? `${likedSongs.length} bài hát trong danh sách yêu thích`
                      : "Nhấn tim trên các bài hát để lưu vào đây"}
                  </Text>
                </View>
                <Ionicons name="play-circle" size={42} color={Colors.dark.secondary} />
              </TouchableOpacity>

              {/* Liked Songs List */}
              {likedSongs.length > 0 && (
                <View style={styles.sectionWrap}>
                  <Text style={styles.sectionTitle}>YÊU THÍCH GẦN ĐÂY 🌸 ({likedSongs.length})</Text>
                  {likedSongs.map((song, idx) => (
                    <SongRow
                      key={`liked-${song.id}-${idx}`}
                      song={song}
                      isPlaying={currentSong?.id === song.id && isPlaying}
                      onPress={() => handlePlaySong(song, idx, likedSongs)}
                    />
                  ))}
                </View>
              )}

              {/* Listening History List */}
              {historySongs.length > 0 && (
                <View style={styles.sectionWrap}>
                  <Text style={styles.sectionTitle}>LỊCH SỬ NGHE GẦN ĐÂY 🎧 ({historySongs.length})</Text>
                  {historySongs.slice(0, 15).map((song, idx) => (
                    <SongRow
                      key={`history-${song.id}-${idx}`}
                      song={song}
                      isPlaying={currentSong?.id === song.id && isPlaying}
                      onPress={() => handlePlaySong(song, idx, historySongs)}
                    />
                  ))}
                </View>
              )}

              {likedSongs.length === 0 && historySongs.length === 0 && (
                <View style={styles.emptyCard}>
                  <Ionicons name="musical-notes-outline" size={48} color={Colors.dark.textMuted} />
                  <Text style={styles.emptyTitle}>Thư viện bài hát đang trống</Text>
                  <Text style={styles.emptySub}>Hãy khám phá trang chủ và bấm thích các giai điệu bạn yêu thích!</Text>
                </View>
              )}
            </View>
          )}

          {/* ═════════════════ TAB 2: ALBUM ═════════════════ */}
          {activeTab === "Album" && (
            <View>
              <Text style={styles.sectionTitle}>ALBUM ANIME & VOCALOID TUYỂN CHỌN 💿</Text>
              {albums.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Ionicons name="disc-outline" size={48} color={Colors.dark.textMuted} />
                  <Text style={styles.emptyTitle}>Chưa có Album nào</Text>
                  <Text style={styles.emptySub}>Các album anime mới sẽ được cập nhật sớm nhất.</Text>
                </View>
              ) : (
                <View style={styles.albumGrid}>
                  {albums.map((album) => (
                    <TouchableOpacity
                      key={album.id}
                      style={styles.albumCard}
                      onPress={() => router.push(`/album/${album.id}` as any)}
                      activeOpacity={0.8}
                    >
                      <Image
                        source={{ uri: album.coverUrl || "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80" }}
                        style={styles.albumCover}
                      />
                      <Text style={styles.albumTitle} numberOfLines={1}>
                        {album.title}
                      </Text>
                      <Text style={styles.albumArtist} numberOfLines={1}>
                        {album.artist?.name || "Nhiều nghệ sĩ"}
                      </Text>
                      {album._count?.songs !== undefined && (
                        <Text style={styles.albumSongCount}>
                          💿 {album._count.songs} bài hát
                        </Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* ═════════════════ TAB 3: NGHỆ SĨ ═════════════════ */}
          {activeTab === "Nghệ sĩ" && (
            <View>
              <Text style={styles.sectionTitle}>NGHỆ SĨ & CA SĨ THẦN TƯỢNG ANIME 🎤✨</Text>
              {artists.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Ionicons name="people-outline" size={48} color={Colors.dark.textMuted} />
                  <Text style={styles.emptyTitle}>Chưa có nghệ sĩ nào</Text>
                  <Text style={styles.emptySub}>Theo dõi thêm nghệ sĩ anime để hiển thị tại đây.</Text>
                </View>
              ) : (
                <View style={styles.artistList}>
                  {artists.map((artist) => (
                    <TouchableOpacity
                      key={artist.id}
                      style={styles.artistRow}
                      onPress={() => router.push(`/artist/${artist.id}` as any)}
                      activeOpacity={0.7}
                    >
                      <Image
                        source={{ uri: artist.avatarUrl || "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&q=80" }}
                        style={styles.artistAvatar}
                      />
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                          <Text style={styles.artistName} numberOfLines={1}>
                            {artist.name}
                          </Text>
                          {artist.verified && (
                            <Ionicons name="checkmark-circle" size={14} color={Colors.dark.primaryLight} />
                          )}
                        </View>
                        <Text style={styles.artistBio} numberOfLines={1}>
                          {artist.bio || "Nghệ sĩ sáng tác anime & Vocaloid"}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={Colors.dark.textMuted} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* ═════════════════ TAB 4: PLAYLIST ═════════════════ */}
          {activeTab === "Playlist" && (
            <View>
              <TouchableOpacity
                style={styles.createPlBanner}
                onPress={() => setShowCreatePlaylistModal(true)}
                activeOpacity={0.8}
              >
                <View style={styles.createPlIcon}>
                  <Ionicons name="add" size={28} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.createPlTitle}>Tạo Danh Sách Phát Mới ➕</Text>
                  <Text style={styles.createPlSub}>Sưu tập danh sách bài hát anime theo gu riêng của bạn</Text>
                </View>
              </TouchableOpacity>

              <Text style={styles.sectionTitle}>PLAYLIST CỦA BẠN ({playlists.length})</Text>

              {playlists.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Ionicons name="folder-open-outline" size={48} color={Colors.dark.textMuted} />
                  <Text style={styles.emptyTitle}>Chưa có playlist nào</Text>
                  <Text style={styles.emptySub}>Bấm vào nút trên để tạo danh sách phát đầu tiên!</Text>
                </View>
              ) : (
                <View style={styles.plList}>
                  {playlists.map((pl) => (
                    <TouchableOpacity
                      key={pl.id}
                      style={styles.plCard}
                      onPress={() => router.push(`/playlist/${pl.id}` as any)}
                      activeOpacity={0.7}
                    >
                      {pl.coverUrl ? (
                        <Image source={{ uri: pl.coverUrl }} style={styles.plThumb} />
                      ) : (
                        <View style={[styles.plThumb, styles.plThumbFallback]}>
                          <Ionicons name="musical-notes" size={24} color={Colors.dark.primary} />
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={styles.plName} numberOfLines={1}>
                          {pl.name}
                        </Text>
                        <Text style={styles.plDesc} numberOfLines={1}>
                          {pl.description || "Danh sách phát cá nhân"}
                        </Text>
                        <Text style={styles.plMeta}>
                          {pl.songCount !== undefined ? `${pl.songCount} bài hát` : "Playlist"} · {pl.isPublic ? "Công khai 🌐" : "Riêng tư 🔒"}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={Colors.dark.textMuted} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* ═════════════════ TAB 5: BẢNG XẾP HẠNG QUÀ TẶNG ═════════════════ */}
          {activeTab === "BXH Quà Tặng" && (
            <View>
              <View style={styles.leaderboardHeaderCard}>
                <Text style={styles.lbHeaderTitle}>BẢNG VÀNG QUÀ TẶNG ANIME 🏆👑</Text>
                <Text style={styles.lbHeaderSub}>
                  Top các bài hát nhận được nhiều yêu thương & xu quà tặng nhất từ cộng đồng Waifu Player!
                </Text>
              </View>

              {leaderboard.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Ionicons name="gift-outline" size={48} color="#f59e0b" />
                  <Text style={styles.emptyTitle}>Chưa có dữ liệu bảng xếp hạng</Text>
                  <Text style={styles.emptySub}>Hãy là người đầu tiên tặng quà cho bài hát bạn yêu thích!</Text>
                </View>
              ) : (
                <View style={{ gap: 10, marginTop: 12 }}>
                  {leaderboard.map((item, idx) => {
                    const rank = idx + 1;
                    let rankBadge = `${rank}`;
                    let rankColor: string = Colors.dark.textMuted;
                    if (rank === 1) { rankBadge = "🥇 1"; rankColor = "#f59e0b"; }
                    else if (rank === 2) { rankBadge = "🥈 2"; rankColor = "#94a3b8"; }
                    else if (rank === 3) { rankBadge = "🥉 3"; rankColor = "#d97706"; }

                    return (
                      <View key={item.id || idx} style={styles.lbRow}>
                        {/* Rank Badge */}
                        <View style={[styles.rankBadgeBox, rank <= 3 && styles.rankBadgeTop]}>
                          <Text style={[styles.rankBadgeText, { color: rankColor }]}>{rankBadge}</Text>
                        </View>

                        {/* Song Cover */}
                        <TouchableOpacity
                          onPress={() => {
                            if (currentSong?.id === item.id) {
                              if (!isPlaying) setPlaying(true);
                            } else {
                              setCurrentSong(item as Song);
                            }
                          }}
                          style={{ flexDirection: "row", alignItems: "center", flex: 1, gap: 10 }}
                        >
                          <Image
                            source={{ uri: item.coverUrl || "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80" }}
                            style={styles.lbCover}
                          />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.lbSongTitle} numberOfLines={1}>
                              {item.title}
                            </Text>
                            <Text style={styles.lbArtistName} numberOfLines={1}>
                              {item.artists?.map((a: any) => a.name).join(", ") || "Nghệ sĩ Waifu"}
                            </Text>
                            <View style={styles.lbGiftBadgeRow}>
                              <Text style={styles.lbGiftText}>🪙 {item.totalCoins ?? 0} Xu</Text>
                              <Text style={styles.lbGiftSub}>· {item.giftCount ?? 0} phần quà</Text>
                            </View>
                          </View>
                        </TouchableOpacity>

                        {/* Gift Button */}
                        <TouchableOpacity
                          style={styles.lbGiftBtn}
                          onPress={() => handleOpenGiftForSong(item as Song)}
                          activeOpacity={0.8}
                        >
                          <Text style={{ fontSize: 16 }}>🎁</Text>
                          <Text style={styles.lbGiftBtnText}>Tặng</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          )}
        </ScrollView>
      )}

      {/* Modal Tạo Playlist */}
      <Modal
        visible={showCreatePlaylistModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCreatePlaylistModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tạo Danh Sách Phát Mới 🎵</Text>
              <TouchableOpacity onPress={() => setShowCreatePlaylistModal(false)}>
                <Ionicons name="close" size={22} color={Colors.dark.textMuted} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.inputField}
              placeholder="Tên playlist (VD: Anime Chill Beats)..."
              placeholderTextColor={Colors.dark.textMuted}
              value={newPlaylistName}
              onChangeText={setNewPlaylistName}
            />
            <TextInput
              style={[styles.inputField, { height: 80 }]}
              placeholder="Mô tả danh sách phát..."
              placeholderTextColor={Colors.dark.textMuted}
              value={newPlaylistDesc}
              onChangeText={setNewPlaylistDesc}
              multiline
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowCreatePlaylistModal(false)}
              >
                <Text style={styles.cancelBtnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.createBtn}
                onPress={handleCreatePlaylist}
                disabled={creatingPlaylist}
              >
                {creatingPlaylist ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.createBtnText}>Tạo Playlist ✨</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Anime Gift Modal for Songs */}
      <GiftModal
        visible={showGiftModal}
        song={giftTargetSong}
        onClose={() => setShowGiftModal(false)}
        onGiftSuccess={() => {
          loadData();
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.dark.text,
  },
  subTitle: {
    fontSize: 11,
    color: Colors.dark.textMuted,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerBtn: {
    padding: 6,
  },
  tabScroll: {
    paddingVertical: 10,
    maxHeight: 52,
  },
  tabContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tabChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  tabChipActive: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
  },
  tabChipText: {
    color: Colors.dark.textMuted,
    fontSize: 13,
    fontWeight: "700",
  },
  tabChipTextActive: {
    color: "#fff",
  },
  loadingBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
  },
  heroCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(236, 72, 153, 0.15)",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(236, 72, 153, 0.35)",
    marginBottom: 20,
    gap: 14,
  },
  heroIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.dark.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
  },
  heroSub: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    marginTop: 3,
  },
  sectionWrap: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: Colors.dark.primaryLight,
    letterSpacing: 1,
    marginBottom: 12,
  },
  emptyCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginVertical: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.dark.text,
    marginTop: 12,
  },
  emptySub: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    textAlign: "center",
    marginTop: 4,
    lineHeight: 18,
  },
  // Album Grid
  albumGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  albumCard: {
    width: "48%",
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  albumCover: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 12,
    marginBottom: 8,
  },
  albumTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.dark.text,
  },
  albumArtist: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    marginTop: 2,
  },
  albumSongCount: {
    fontSize: 11,
    color: Colors.dark.primaryLight,
    fontWeight: "700",
    marginTop: 4,
  },
  // Artist List
  artistList: {
    gap: 10,
  },
  artistRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    gap: 12,
  },
  artistAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.dark.primary,
  },
  artistName: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.dark.text,
  },
  artistBio: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    marginTop: 2,
  },
  // Playlist
  createPlBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(168, 85, 247, 0.15)",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(168, 85, 247, 0.35)",
    gap: 12,
    marginBottom: 16,
  },
  createPlIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#a855f7",
    alignItems: "center",
    justifyContent: "center",
  },
  createPlTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
  createPlSub: {
    fontSize: 11,
    color: Colors.dark.textMuted,
    marginTop: 2,
  },
  plList: {
    gap: 10,
  },
  plCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    gap: 12,
  },
  plThumb: {
    width: 50,
    height: 50,
    borderRadius: 10,
  },
  plThumbFallback: {
    backgroundColor: Colors.dark.card,
    alignItems: "center",
    justifyContent: "center",
  },
  plName: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.dark.text,
  },
  plDesc: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    marginTop: 2,
  },
  plMeta: {
    fontSize: 11,
    color: Colors.dark.primaryLight,
    marginTop: 4,
  },
  // Leaderboard
  leaderboardHeaderCard: {
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
    marginBottom: 12,
  },
  lbHeaderTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#f59e0b",
    letterSpacing: 0.5,
  },
  lbHeaderSub: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    marginTop: 4,
    lineHeight: 18,
  },
  lbRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    gap: 10,
  },
  rankBadgeBox: {
    width: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  rankBadgeTop: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    paddingVertical: 4,
    borderRadius: 8,
  },
  rankBadgeText: {
    fontSize: 15,
    fontWeight: "800",
  },
  lbCover: {
    width: 46,
    height: 46,
    borderRadius: 10,
  },
  lbSongTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.dark.text,
  },
  lbArtistName: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    marginTop: 2,
  },
  lbGiftBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },
  lbGiftText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#f59e0b",
  },
  lbGiftSub: {
    fontSize: 11,
    color: Colors.dark.textMuted,
  },
  lbGiftBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.4)",
    gap: 4,
  },
  lbGiftBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#f59e0b",
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.dark.text,
  },
  inputField: {
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.dark.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 8,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.dark.card,
  },
  cancelBtnText: {
    color: Colors.dark.textMuted,
    fontWeight: "600",
  },
  createBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.dark.primary,
  },
  createBtnText: {
    color: "#fff",
    fontWeight: "700",
  },
});
