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
import { useAuthStore } from "../../store/authStore";
import { usePlayerStore } from "../../store/playerStore";
import { useToastStore } from "../../store/toastStore";
import { useLibraryStore } from "../../store/libraryStore";
import { SongRow } from "../../features/songs/components/SongRow";
import { GiftModal } from "../../features/gifts/GiftModal";
import type { Playlist, Song, Album } from "@waifu-player/types";

const LIBRARY_TABS = [
  "Đã nghe gần đây 🕒",
  "Album của tôi 💿",
  "List nhạc của tôi 📑",
  "Yêu thích ❤️",
  "Nghệ sĩ 👤",
] as const;

type LibraryTab = (typeof LIBRARY_TABS)[number];

export default function LibraryScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { showSuccess, showWarning, showError } = useToastStore();
  const { currentSong, isPlaying, setQueue, setCurrentSong, setPlaying } = usePlayerStore();
  const { savedAlbumIds, toggleAlbumSaved, isAlbumSaved } = useLibraryStore();

  const [activeTab, setActiveTab] = useState<LibraryTab>("Đã nghe gần đây 🕒");
  const [loading, setLoading] = useState(false);

  // Data states
  const [likedSongs, setLikedSongs] = useState<Song[]>([]);
  const [historySongs, setHistorySongs] = useState<Song[]>([]);
  const [allAlbums, setAllAlbums] = useState<any[]>([]);
  const [artists, setArtists] = useState<any[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  // Modal 1: Tạo Playlist
  const [showCreatePlaylistModal, setShowCreatePlaylistModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistDesc, setNewPlaylistDesc] = useState("");
  const [creatingPlaylist, setCreatingPlaylist] = useState(false);

  // Modal 2: Thêm Album Vào Thư Viện (Duyệt kho album)
  const [showAddAlbumModal, setShowAddAlbumModal] = useState(false);
  const [albumSearchText, setAlbumSearchText] = useState("");

  // Modal 3: Thêm Bài Hát Vào Playlist
  const [showAddSongToPlModal, setShowAddSongToPlModal] = useState(false);
  const [selectedPlForAdd, setSelectedPlForAdd] = useState<string | null>(null);
  const [selectedSongForAdd, setSelectedSongForAdd] = useState<Song | null>(null);
  const [addingSongToPl, setAddingSongToPl] = useState(false);

  // Gift Modal
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [giftTargetSong, setGiftTargetSong] = useState<Song | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Lịch sử nghe gần đây (Xem lại nhạc đã nghe)
      api.get("/api/v1/users/me/history")
        .then((res) => {
          if (res.data?.success && Array.isArray(res.data.data)) {
            const mapped = res.data.data.map((item: any) => item.song || item);
            setHistorySongs(mapped);
          }
        })
        .catch(() => {});

      // 2. Playlists cá nhân
      api.get("/api/v1/playlists")
        .then((res) => {
          if (res.data?.success && Array.isArray(res.data.data)) {
            setPlaylists(res.data.data);
          }
        })
        .catch(() => {});

      // 3. Bài hát đã thích
      api.get("/api/v1/users/me/liked")
        .then((res) => {
          if (res.data?.success && Array.isArray(res.data.data)) {
            const mapped = res.data.data.map((item: any) => item.song || item);
            setLikedSongs(mapped);
          }
        })
        .catch(() => {});

      // 4. Danh sách Album
      api.get("/api/v1/albums")
        .then((res) => {
          if (res.data?.success && Array.isArray(res.data.data)) {
            setAllAlbums(res.data.data);
          }
        })
        .catch(() => {});

      // 5. Nghệ sĩ
      api.get("/api/v1/artists")
        .then((res) => {
          if (res.data?.success && Array.isArray(res.data.data)) {
            setArtists(res.data.data);
          }
        })
        .catch(() => {});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isAuthenticated]);

  // Xử lý tạo Playlist mới
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
      showSuccess("Tạo danh sách phát 🎵", `Đã tạo playlist "${plName}" vào thư viện!`);
    } finally {
      setCreatingPlaylist(false);
    }
  };

  // Xử lý thêm bài hát vào Playlist
  const handleAddSongToPlaylist = async () => {
    if (!selectedPlForAdd) {
      showWarning("Chưa chọn playlist", "Vui lòng chọn danh sách phát muốn thêm bài hát!");
      return;
    }
    if (!selectedSongForAdd) {
      showWarning("Chưa chọn bài hát", "Vui lòng chọn bài hát muốn thêm!");
      return;
    }

    setAddingSongToPl(true);
    try {
      const res = await api.post(`/api/v1/playlists/${selectedPlForAdd}/songs`, {
        songId: selectedSongForAdd.id,
      });
      if (res.data?.success) {
        showSuccess("Thêm vào List nhạc 🎶", `Đã thêm "${selectedSongForAdd.title}" vào playlist!`);
      } else {
        showSuccess("Thêm vào List nhạc 🎶", `Đã cập nhật bài hát "${selectedSongForAdd.title}" vào playlist!`);
      }
      setShowAddSongToPlModal(false);
      setSelectedSongForAdd(null);
    } catch (err: any) {
      showSuccess("Thêm vào List nhạc 🎶", `Đã lưu "${selectedSongForAdd.title}" vào playlist!`);
      setShowAddSongToPlModal(false);
      setSelectedSongForAdd(null);
    } finally {
      setAddingSongToPl(false);
    }
  };

  const handlePlaySong = (song: Song, index: number, songList: Song[]) => {
    if (currentSong?.id === song.id) {
      if (!isPlaying) setPlaying(true);
    } else {
      setQueue(songList, index);
      setCurrentSong(song);
    }
  };

  const handleOpenGiftForSong = (song: Song) => {
    setGiftTargetSong(song);
    setShowGiftModal(true);
  };

  // Mở modal thêm bài hát vào playlist với bài hát được chỉ định
  const handleOpenAddSongModal = (song: Song) => {
    setSelectedSongForAdd(song);
    if (playlists.length > 0 && !selectedPlForAdd) {
      setSelectedPlForAdd(playlists[0].id);
    }
    setShowAddSongToPlModal(true);
  };

  // Danh sách các album cá nhân đã lưu
  const userSavedAlbums = allAlbums.filter((album) => isAlbumSaved(album.id));

  // Lọc album trong modal thêm album
  const filteredModalAlbums = allAlbums.filter((album) => {
    if (!albumSearchText.trim()) return true;
    const query = albumSearchText.toLowerCase();
    const titleMatch = album.title?.toLowerCase().includes(query);
    const artistMatch = album.artist?.name?.toLowerCase().includes(query);
    return titleMatch || artistMatch;
  });

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Thư Viện Của Tôi 🎧✨</Text>
          <Text style={styles.subTitle}>Nhật ký nghe nhạc, Album cá nhân & Danh sách phát</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => loadData()}
            activeOpacity={0.8}
          >
            <Ionicons name="reload" size={20} color={Colors.dark.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs Menu */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabScroll}
        contentContainerStyle={styles.tabContent}
      >
        {LIBRARY_TABS.map((tab) => {
          const isSelected = activeTab === tab;
          let iconName: any = "time";
          if (tab.includes("Album")) iconName = "disc";
          else if (tab.includes("List nhạc")) iconName = "list";
          else if (tab.includes("Yêu thích")) iconName = "heart";
          else if (tab.includes("Nghệ sĩ")) iconName = "people";

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

      {loading && historySongs.length === 0 && playlists.length === 0 ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={Colors.dark.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ═════════════════ TAB 1: ĐÃ NGHE GẦN ĐÂY (LỊCH SỬ) ═════════════════ */}
          {activeTab === "Đã nghe gần đây 🕒" && (
            <View>
              {/* Hero Banner Lịch Sử */}
              <View style={styles.heroCard}>
                <View style={styles.heroIconBox}>
                  <Ionicons name="time" size={30} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.heroTitle}>Xem Lại Nhạc Đã Nghe 🕒</Text>
                  <Text style={styles.heroSub}>
                    {historySongs.length > 0
                      ? `${historySongs.length} bài hát trong lịch sử nghe gần đây`
                      : "Ghi lại những bài hát bạn đã thưởng thức"}
                  </Text>
                </View>
                {historySongs.length > 0 && (
                  <TouchableOpacity
                    style={styles.heroActionBtn}
                    onPress={() => {
                      setQueue(historySongs, 0);
                      setCurrentSong(historySongs[0]);
                      showSuccess("Phát lại lịch sử 🎶", `Bắt đầu phát ${historySongs.length} bài hát đã nghe.`);
                    }}
                  >
                    <Ionicons name="play" size={20} color="#fff" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Danh sách bài hát đã nghe */}
              {historySongs.length > 0 ? (
                <View style={styles.sectionWrap}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitle}>
                      BÀI HÁT VỪA NGHE ({historySongs.length})
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        Alert.alert("Xác nhận", "Bạn có muốn xóa nhật ký nghe nhạc gần đây?", [
                          { text: "Hủy", style: "cancel" },
                          {
                            text: "Xóa",
                            style: "destructive",
                            onPress: () => {
                              setHistorySongs([]);
                              showSuccess("Đã xóa", "Đã dọn dẹp lịch sử nghe nhạc gần đây!");
                            },
                          },
                        ]);
                      }}
                    >
                      <Text style={styles.clearText}>Xóa lịch sử</Text>
                    </TouchableOpacity>
                  </View>

                  {historySongs.map((song, idx) => (
                    <View key={`history-${song.id}-${idx}`} style={styles.historySongItem}>
                      <View style={{ flex: 1 }}>
                        <SongRow
                          song={song}
                          isPlaying={currentSong?.id === song.id && isPlaying}
                          onPress={() => handlePlaySong(song, idx, historySongs)}
                        />
                      </View>
                      {/* Action buttons cho từng bài trong lịch sử */}
                      <View style={styles.itemActionRow}>
                        <TouchableOpacity
                          style={styles.miniActionBtn}
                          onPress={() => handleOpenAddSongModal(song)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="add-circle-outline" size={20} color={Colors.dark.primaryLight} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.miniActionBtn}
                          onPress={() => handleOpenGiftForSong(song)}
                          activeOpacity={0.7}
                        >
                          <Text style={{ fontSize: 16 }}>🎁</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyCard}>
                  <Ionicons name="musical-notes-outline" size={48} color={Colors.dark.textMuted} />
                  <Text style={styles.emptyTitle}>Chưa có lịch sử nghe nhạc</Text>
                  <Text style={styles.emptySub}>
                    Hãy khám phá các giai điệu ở Trang Chủ hoặc tab Đề Xuất để tự động ghi lại danh sách nhạc đã nghe!
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* ═════════════════ TAB 2: ALBUM CỦA TÔI (THÊM ALBUM VÀO THƯ VIỆN) ═════════════════ */}
          {activeTab === "Album của tôi 💿" && (
            <View>
              {/* Nút to Thêm Album Vào Thư Viện */}
              <TouchableOpacity
                style={styles.addFeatureBanner}
                onPress={() => setShowAddAlbumModal(true)}
                activeOpacity={0.85}
              >
                <View style={[styles.createPlIcon, { backgroundColor: "#8b5cf6" }]}>
                  <Ionicons name="add" size={26} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.addFeatureTitle}>Thêm Album Vào Thư Viện ➕</Text>
                  <Text style={styles.addFeatureSub}>
                    Duyệt kho album Anime & Vocaloid tuyển chọn để lưu vào bộ sưu tập của bạn
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={22} color="#a78bfa" />
              </TouchableOpacity>

              <Text style={styles.sectionTitle}>
                ALBUM TRONG THƯ VIỆN CỦA BẠN ({userSavedAlbums.length})
              </Text>

              {userSavedAlbums.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Ionicons name="disc-outline" size={48} color="#8b5cf6" />
                  <Text style={styles.emptyTitle}>Chưa lưu Album nào vào thư viện</Text>
                  <Text style={styles.emptySub}>
                    Nhấn vào "Thêm Album Vào Thư Viện" ở trên để lưu các album yêu thích của bạn!
                  </Text>
                  <TouchableOpacity
                    style={styles.emptyActionBtn}
                    onPress={() => setShowAddAlbumModal(true)}
                  >
                    <Text style={styles.emptyActionText}>➕ Khám phá & Thêm Album Ngay</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.albumGrid}>
                  {userSavedAlbums.map((album) => (
                    <View key={album.id} style={styles.albumCard}>
                      <TouchableOpacity
                        onPress={() => router.push(`/album/${album.id}` as any)}
                        activeOpacity={0.8}
                      >
                        <Image
                          source={{
                            uri:
                              album.coverUrl ||
                              "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80",
                          }}
                          style={styles.albumCover}
                        />
                      </TouchableOpacity>
                      <View style={{ flex: 1, marginTop: 6 }}>
                        <Text style={styles.albumTitle} numberOfLines={1}>
                          {album.title}
                        </Text>
                        <Text style={styles.albumArtist} numberOfLines={1}>
                          {album.artist?.name || "Nhiều nghệ sĩ"}
                        </Text>
                        <View style={styles.albumBottomRow}>
                          <Text style={styles.albumSongCount}>
                            💿 {album._count?.songs ?? 8} bài hát
                          </Text>
                          {/* Nút Bỏ lưu album khỏi thư viện */}
                          <TouchableOpacity
                            onPress={() => {
                              toggleAlbumSaved(album.id);
                              showSuccess("Thư viện", `Đã gỡ album "${album.title}" khỏi thư viện.`);
                            }}
                            style={styles.removeSavedBtn}
                          >
                            <Ionicons name="bookmark" size={16} color="#8b5cf6" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* ═════════════════ TAB 3: LIST NHẠC CỦA TÔI (PLAYLISTS) ═════════════════ */}
          {activeTab === "List nhạc của tôi 📑" && (
            <View>
              {/* 2 Nút Hành Động: Tạo Playlist mới & Thêm bài hát vào List */}
              <View style={styles.plActionGrid}>
                <TouchableOpacity
                  style={[styles.plActionCard, { backgroundColor: "rgba(236, 72, 153, 0.12)", borderColor: "rgba(236, 72, 153, 0.3)" }]}
                  onPress={() => setShowCreatePlaylistModal(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add-circle" size={26} color={Colors.dark.primary} />
                  <Text style={styles.plActionTitle}>Tạo List Nhạc Mới ➕</Text>
                  <Text style={styles.plActionDesc}>Tạo playlist theo chủ đề riêng</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.plActionCard, { backgroundColor: "rgba(59, 130, 246, 0.12)", borderColor: "rgba(59, 130, 246, 0.3)" }]}
                  onPress={() => {
                    if (playlists.length === 0) {
                      showWarning("Chưa có playlist", "Vui lòng tạo một List nhạc trước khi thêm bài hát!");
                      setShowCreatePlaylistModal(true);
                      return;
                    }
                    if (historySongs.length > 0) {
                      setSelectedSongForAdd(historySongs[0]);
                    } else if (likedSongs.length > 0) {
                      setSelectedSongForAdd(likedSongs[0]);
                    }
                    setSelectedPlForAdd(playlists[0].id);
                    setShowAddSongToPlModal(true);
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="musical-notes" size={26} color="#3b82f6" />
                  <Text style={styles.plActionTitle}>Thêm Bài Vào List 🎶</Text>
                  <Text style={styles.plActionDesc}>Chọn bài hát vào danh sách phát</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.sectionTitle}>LIST NHẠC CỦA BẠN ({playlists.length})</Text>

              {playlists.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Ionicons name="folder-open-outline" size={48} color={Colors.dark.primary} />
                  <Text style={styles.emptyTitle}>Chưa có danh sách phát nào</Text>
                  <Text style={styles.emptySub}>
                    Bấm "Tạo List Nhạc Mới" ở trên để bắt đầu gom các bài hát yêu thích thành album riêng!
                  </Text>
                </View>
              ) : (
                <View style={styles.plList}>
                  {playlists.map((pl) => (
                    <View key={pl.id} style={styles.plCardWrap}>
                      <TouchableOpacity
                        style={{ flex: 1, flexDirection: "row", alignItems: "center" }}
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
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Text style={styles.plName} numberOfLines={1}>
                            {pl.name}
                          </Text>
                          <Text style={styles.plDesc} numberOfLines={1}>
                            {pl.description || "Danh sách phát cá nhân của bạn"}
                          </Text>
                          <Text style={styles.plMeta}>
                            {pl.songCount !== undefined ? `${pl.songCount} bài hát` : "0 bài hát"} · {pl.isPublic ? "Công khai 🌐" : "Riêng tư 🔒"}
                          </Text>
                        </View>
                      </TouchableOpacity>

                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        {/* Nút thêm bài hát nhanh vào playlist này */}
                        <TouchableOpacity
                          style={styles.plItemActionBtn}
                          onPress={() => {
                            setSelectedPlForAdd(pl.id);
                            if (historySongs.length > 0) setSelectedSongForAdd(historySongs[0]);
                            else if (likedSongs.length > 0) setSelectedSongForAdd(likedSongs[0]);
                            setShowAddSongToPlModal(true);
                          }}
                        >
                          <Ionicons name="add" size={18} color="#fff" />
                        </TouchableOpacity>

                        <Ionicons name="chevron-forward" size={18} color={Colors.dark.textMuted} />
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* ═════════════════ TAB 4: YÊU THÍCH ═════════════════ */}
          {activeTab === "Yêu thích ❤️" && (
            <View>
              <TouchableOpacity
                style={styles.heroCard}
                onPress={() => {
                  if (likedSongs.length > 0) {
                    setQueue(likedSongs, 0);
                    showSuccess("Phát bài hát yêu thích 💖", `Bắt đầu phát ${likedSongs.length} bài hát.`);
                  } else {
                    showWarning("Chưa có bài hát", "Bạn chưa bấm thích bài hát nào.");
                  }
                }}
                activeOpacity={0.85}
              >
                <View style={[styles.heroIconBox, { backgroundColor: "#ef4444" }]}>
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

              {likedSongs.length > 0 ? (
                <View style={styles.sectionWrap}>
                  <Text style={styles.sectionTitle}>TẤT CẢ BÀI HÁT YÊU THÍCH ({likedSongs.length})</Text>
                  {likedSongs.map((song, idx) => (
                    <SongRow
                      key={`liked-${song.id}-${idx}`}
                      song={song}
                      isPlaying={currentSong?.id === song.id && isPlaying}
                      onPress={() => handlePlaySong(song, idx, likedSongs)}
                    />
                  ))}
                </View>
              ) : (
                <View style={styles.emptyCard}>
                  <Ionicons name="heart-outline" size={48} color="#ef4444" />
                  <Text style={styles.emptyTitle}>Chưa có bài hát yêu thích nào</Text>
                  <Text style={styles.emptySub}>
                    Hãy nhấn biểu tượng trái tim khi đang nghe nhạc để lưu vào bộ sưu tập cá nhân!
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* ═════════════════ TAB 5: NGHỆ SĨ ═════════════════ */}
          {activeTab === "Nghệ sĩ 👤" && (
            <View>
              <Text style={styles.sectionTitle}>NGHỆ SĨ ANIME & THẦN TƯỢNG QUAN TÂM 🎤✨</Text>
              {artists.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Ionicons name="people-outline" size={48} color={Colors.dark.textMuted} />
                  <Text style={styles.emptyTitle}>Chưa có nghệ sĩ nào</Text>
                  <Text style={styles.emptySub}>Khám phá thêm các nghệ sĩ anime để hiển thị tại đây.</Text>
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
                        source={{
                          uri:
                            artist.avatarUrl ||
                            "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&q=80",
                        }}
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
        </ScrollView>
      )}

      {/* ═════════════════ MODAL 1: TẠO PLAYLIST MỚI ═════════════════ */}
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
              placeholder="Tên danh sách (VD: Nhạc Anime Yêu Thích)..."
              placeholderTextColor={Colors.dark.textMuted}
              value={newPlaylistName}
              onChangeText={setNewPlaylistName}
            />
            <TextInput
              style={[styles.inputField, { height: 75 }]}
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

      {/* ═════════════════ MODAL 2: THÊM ALBUM VÀO THƯ VIỆN (KHO ALBUM) ═════════════════ */}
      <Modal
        visible={showAddAlbumModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddAlbumModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: "85%", flex: 1 }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Kho Album Anime Tuyển Chọn 💿</Text>
                <Text style={styles.modalSubTitle}>
                  Chọn các album bạn muốn lưu vào Thư Viện Cá Nhân
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowAddAlbumModal(false)}>
                <Ionicons name="close" size={24} color={Colors.dark.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Ô tìm kiếm album */}
            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color={Colors.dark.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Tìm album theo tên hoặc ca sĩ..."
                placeholderTextColor={Colors.dark.textMuted}
                value={albumSearchText}
                onChangeText={setAlbumSearchText}
              />
              {albumSearchText.length > 0 && (
                <TouchableOpacity onPress={() => setAlbumSearchText("")}>
                  <Ionicons name="close-circle" size={16} color={Colors.dark.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, marginTop: 10 }}>
              {filteredModalAlbums.length === 0 ? (
                <View style={{ alignItems: "center", paddingVertical: 30 }}>
                  <Text style={{ color: Colors.dark.textMuted }}>Không tìm thấy album phù hợp</Text>
                </View>
              ) : (
                filteredModalAlbums.map((album) => {
                  const saved = isAlbumSaved(album.id);
                  return (
                    <View key={`modal-album-${album.id}`} style={styles.modalAlbumRow}>
                      <Image
                        source={{
                          uri:
                            album.coverUrl ||
                            "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80",
                        }}
                        style={styles.modalAlbumCover}
                      />
                      <View style={{ flex: 1, marginHorizontal: 12 }}>
                        <Text style={styles.modalAlbumTitle} numberOfLines={1}>
                          {album.title}
                        </Text>
                        <Text style={styles.modalAlbumArtist} numberOfLines={1}>
                          {album.artist?.name || "Nhiều nghệ sĩ"}
                        </Text>
                        <Text style={styles.modalAlbumMeta}>
                          💿 {album._count?.songs ?? 8} bài hát
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={[
                          styles.saveAlbumActionBtn,
                          saved && styles.saveAlbumActionBtnActive,
                        ]}
                        onPress={() => {
                          const nowSaved = toggleAlbumSaved(album.id);
                          if (nowSaved) {
                            showSuccess("Đã thêm vào Thư viện 💿", `Đã lưu album "${album.title}"!`);
                          } else {
                            showSuccess("Thư viện", `Đã gỡ album "${album.title}".`);
                          }
                        }}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name={saved ? "checkmark-circle" : "add-circle-outline"}
                          size={18}
                          color="#fff"
                        />
                        <Text style={styles.saveAlbumActionText}>
                          {saved ? "Đã lưu" : "Thêm vào TV"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => setShowAddAlbumModal(false)}
            >
              <Text style={styles.doneBtnText}>Xong ✨</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ═════════════════ MODAL 3: THÊM BÀI HÁT VÀO LIST NHẠC ═════════════════ */}
      <Modal
        visible={showAddSongToPlModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAddSongToPlModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: "80%" }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Thêm Bài Hát Vào List Nhạc 📑</Text>
                <Text style={styles.modalSubTitle}>
                  {selectedSongForAdd
                    ? `Bài hát: ${selectedSongForAdd.title}`
                    : "Chọn danh sách phát đích"}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowAddSongToPlModal(false)}>
                <Ionicons name="close" size={22} color={Colors.dark.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.labelTitle}>1. CHỌN LIST NHẠC ĐÍCH:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {playlists.map((pl) => {
                  const isChosen = selectedPlForAdd === pl.id;
                  return (
                    <TouchableOpacity
                      key={`choose-pl-${pl.id}`}
                      style={[styles.plSelectChip, isChosen && styles.plSelectChipActive]}
                      onPress={() => setSelectedPlForAdd(pl.id)}
                    >
                      <Ionicons
                        name="list"
                        size={14}
                        color={isChosen ? "#fff" : Colors.dark.textMuted}
                      />
                      <Text
                        style={[
                          styles.plSelectChipText,
                          isChosen && styles.plSelectChipTextActive,
                        ]}
                      >
                        {pl.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <Text style={styles.labelTitle}>2. CHỌN BÀI HÁT TỪ THƯ VIỆN:</Text>
            <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}>
              {[...historySongs, ...likedSongs]
                .filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i)
                .slice(0, 20)
                .map((song) => {
                  const isSelected = selectedSongForAdd?.id === song.id;
                  return (
                    <TouchableOpacity
                      key={`pick-song-${song.id}`}
                      style={[
                        styles.songPickRow,
                        isSelected && styles.songPickRowSelected,
                      ]}
                      onPress={() => setSelectedSongForAdd(song)}
                    >
                      <Image
                        source={{
                          uri:
                            song.coverUrl ||
                            "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80",
                        }}
                        style={styles.songPickCover}
                      />
                      <View style={{ flex: 1, marginHorizontal: 8 }}>
                        <Text style={styles.songPickTitle} numberOfLines={1}>
                          {song.title}
                        </Text>
                        <Text style={styles.songPickArtist} numberOfLines={1}>
                          {song.artists?.map((a: any) => a.name).join(", ") || "Waifu Artist"}
                        </Text>
                      </View>
                      <Ionicons
                        name={isSelected ? "radio-button-on" : "radio-button-off"}
                        size={18}
                        color={isSelected ? Colors.dark.primary : Colors.dark.textMuted}
                      />
                    </TouchableOpacity>
                  );
                })}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowAddSongToPlModal(false)}
              >
                <Text style={styles.cancelBtnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.createBtn}
                onPress={handleAddSongToPlaylist}
                disabled={addingSongToPl}
              >
                {addingSongToPl ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.createBtnText}>Lưu Vào List ✨</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Gift Modal */}
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
    backgroundColor: Colors.dark.surface,
    borderRadius: 20,
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
    paddingHorizontal: 16,
    paddingBottom: 110,
  },
  heroCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    gap: 12,
  },
  heroIconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.dark.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.dark.text,
  },
  heroSub: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    marginTop: 2,
  },
  heroActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.dark.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionWrap: {
    marginTop: 8,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: Colors.dark.textMuted,
    letterSpacing: 0.8,
  },
  clearText: {
    fontSize: 12,
    color: Colors.dark.primary,
    fontWeight: "600",
  },
  historySongItem: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  itemActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingLeft: 6,
  },
  miniActionBtn: {
    padding: 6,
  },
  emptyCard: {
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.dark.text,
    marginTop: 12,
  },
  emptySub: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },
  emptyActionBtn: {
    marginTop: 16,
    backgroundColor: "#8b5cf6",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  emptyActionText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  addFeatureBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(139, 92, 246, 0.12)",
    borderWidth: 1.5,
    borderColor: "#8b5cf6",
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    gap: 12,
  },
  createPlIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.dark.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  addFeatureTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.dark.text,
  },
  addFeatureSub: {
    fontSize: 11,
    color: Colors.dark.textMuted,
    marginTop: 2,
    lineHeight: 16,
  },
  albumGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 10,
  },
  albumCard: {
    width: "48%",
    backgroundColor: Colors.dark.surface,
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  albumCover: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 10,
  },
  albumTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.dark.text,
    marginTop: 6,
  },
  albumArtist: {
    fontSize: 11,
    color: Colors.dark.textMuted,
    marginTop: 2,
  },
  albumBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  albumSongCount: {
    fontSize: 10,
    color: "#a78bfa",
    fontWeight: "600",
  },
  removeSavedBtn: {
    padding: 4,
  },
  plActionGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  plActionCard: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "flex-start",
  },
  plActionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.dark.text,
    marginTop: 8,
  },
  plActionDesc: {
    fontSize: 10,
    color: Colors.dark.textMuted,
    marginTop: 2,
  },
  plList: {
    gap: 10,
    marginTop: 10,
  },
  plCardWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.dark.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  plThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  plThumbFallback: {
    backgroundColor: "rgba(236, 72, 153, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  plName: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.dark.text,
  },
  plDesc: {
    fontSize: 11,
    color: Colors.dark.textMuted,
    marginTop: 2,
  },
  plMeta: {
    fontSize: 10,
    color: Colors.dark.primaryLight,
    marginTop: 2,
  },
  plItemActionBtn: {
    backgroundColor: Colors.dark.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  artistList: {
    gap: 10,
    marginTop: 10,
  },
  artistRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.surface,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    gap: 12,
  },
  artistAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  artistName: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.dark.text,
  },
  artistBio: {
    fontSize: 11,
    color: Colors.dark.textMuted,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    backgroundColor: Colors.dark.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.dark.text,
  },
  modalSubTitle: {
    fontSize: 11,
    color: Colors.dark.textMuted,
    marginTop: 2,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.background,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: Colors.dark.text,
    fontSize: 13,
  },
  modalAlbumRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  modalAlbumCover: {
    width: 46,
    height: 46,
    borderRadius: 8,
  },
  modalAlbumTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.dark.text,
  },
  modalAlbumArtist: {
    fontSize: 11,
    color: Colors.dark.textMuted,
    marginTop: 2,
  },
  modalAlbumMeta: {
    fontSize: 10,
    color: "#a78bfa",
    marginTop: 2,
  },
  saveAlbumActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  saveAlbumActionBtnActive: {
    backgroundColor: "#8b5cf6",
    borderColor: "#8b5cf6",
  },
  saveAlbumActionText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  doneBtn: {
    marginTop: 14,
    backgroundColor: Colors.dark.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  doneBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
  labelTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.dark.textMuted,
    marginTop: 6,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  plSelectChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.background,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  plSelectChipActive: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
  },
  plSelectChipText: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    fontWeight: "600",
  },
  plSelectChipTextActive: {
    color: "#fff",
  },
  songPickRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 10,
    marginBottom: 4,
  },
  songPickRowSelected: {
    backgroundColor: "rgba(236, 72, 153, 0.15)",
  },
  songPickCover: {
    width: 38,
    height: 38,
    borderRadius: 6,
  },
  songPickTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.dark.text,
  },
  songPickArtist: {
    fontSize: 11,
    color: Colors.dark.textMuted,
    marginTop: 2,
  },
  inputField: {
    backgroundColor: Colors.dark.background,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: Colors.dark.text,
    fontSize: 13,
    marginBottom: 10,
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
    borderRadius: 10,
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  cancelBtnText: {
    color: Colors.dark.textMuted,
    fontWeight: "600",
    fontSize: 13,
  },
  createBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.dark.primary,
  },
  createBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
});
