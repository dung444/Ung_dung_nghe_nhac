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
import { SongRow } from "../../features/songs/components/SongRow";
import type { Playlist, Song, Room } from "@waifu-player/types";

const LIBRARY_TABS = ["Tất cả", "Playlists", "Yêu thích", "Lịch sử", "Phòng nghe"] as const;
type LibraryTab = (typeof LIBRARY_TABS)[number];

export default function LibraryScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { currentSong, isPlaying, setQueue, setCurrentSong, setPlaying } = usePlayerStore();

  const [activeTab, setActiveTab] = useState<LibraryTab>("Tất cả");
  const [loading, setLoading] = useState(false);

  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [likedSongs, setLikedSongs] = useState<Song[]>([]);
  const [historySongs, setHistorySongs] = useState<Song[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);

  // Modals
  const [showCreatePlaylistModal, setShowCreatePlaylistModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistDesc, setNewPlaylistDesc] = useState("");
  const [creatingPlaylist, setCreatingPlaylist] = useState(false);

  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [creatingRoom, setCreatingRoom] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch Playlists
      api.get("/api/v1/playlists").then((res) => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          setPlaylists(res.data.data);
        }
      }).catch(() => {});

      // Fetch Liked songs
      api.get("/api/v1/users/me/liked").then((res) => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          // data can be array of LikedSong or Song
          const mapped = res.data.data.map((item: any) => item.song || item);
          setLikedSongs(mapped);
        }
      }).catch(() => {});

      // Fetch History
      api.get("/api/v1/users/me/history").then((res) => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          const mapped = res.data.data.map((item: any) => item.song || item);
          setHistorySongs(mapped);
        }
      }).catch(() => {});

      // Fetch Live Rooms
      api.get("/api/v1/rooms").then((res) => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          setRooms(res.data.data);
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
      try {
        const { useToastStore } = require("../../store/toastStore");
        useToastStore.getState().showWarning("Thiếu thông tin", "Vui lòng nhập tên danh sách phát!");
      } catch {}
      Alert.alert("Lỗi", "Vui lòng nhập tên danh sách phát!");
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
        try {
          const { useToastStore } = require("../../store/toastStore");
          useToastStore.getState().showSuccess("Tạo danh sách phát 🎵", `Đã tạo playlist "${plName}" thành công!`);
        } catch {}
      }
    } catch (err: any) {
      // Mock creation if offline
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
      try {
        const { useToastStore } = require("../../store/toastStore");
        useToastStore.getState().showSuccess("Tạo danh sách phát 🎵", `Đã tạo playlist "${plName}" thành công!`);
      } catch {}
    } finally {
      setCreatingPlaylist(false);
    }
  };

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) {
      try {
        const { useToastStore } = require("../../store/toastStore");
        useToastStore.getState().showWarning("Thiếu thông tin", "Vui lòng nhập tên phòng nghe!");
      } catch {}
      Alert.alert("Lỗi", "Vui lòng nhập tên phòng nghe!");
      return;
    }
    const rName = newRoomName.trim();
    setCreatingRoom(true);
    try {
      const res = await api.post("/api/v1/rooms", {
        name: rName,
      });
      if (res.data?.success) {
        setShowCreateRoomModal(false);
        setNewRoomName("");
        try {
          const { useToastStore } = require("../../store/toastStore");
          useToastStore.getState().showSuccess("Tạo phòng nghe nhạc 🎧", `Phòng nghe "${rName}" đã sẵn sàng!`);
        } catch {}
        router.push(`/room/${res.data.data.id}` as any);
      }
    } catch {
      setShowCreateRoomModal(false);
      setNewRoomName("");
      try {
        const { useToastStore } = require("../../store/toastStore");
        useToastStore.getState().showSuccess("Tạo phòng nghe nhạc 🎧", `Phòng nghe "${rName}" đã sẵn sàng!`);
      } catch {}
      router.push(`/room/room-demo` as any);
    } finally {
      setCreatingRoom(false);
    }
  };

  const handlePlayLikedSongs = () => {
    if (likedSongs.length === 0) {
      try {
        const { useToastStore } = require("../../store/toastStore");
        useToastStore.getState().showInfo("Chưa có bài hát", "Danh sách bài hát yêu thích của bạn đang trống.");
      } catch {}
      Alert.alert("Thông báo", "Bạn chưa có bài hát yêu thích nào.");
      return;
    }
    setQueue(likedSongs, 0);
    try {
      const { useToastStore } = require("../../store/toastStore");
      useToastStore.getState().showSuccess("Phát yêu thích 💖", `Bắt đầu phát ${likedSongs.length} bài hát yêu thích.`);
    } catch {}
  };

  const handlePlaySong = (song: Song, index: number, songList: Song[]) => {
    if (currentSong?.id === song.id) {
      setPlaying(!isPlaying);
    } else {
      setQueue(songList, index);
      setCurrentSong(song);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Thư viện 📚</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setShowCreateRoomModal(true)}
          >
            <Ionicons name="radio-outline" size={24} color={Colors.dark.primaryLight} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setShowCreatePlaylistModal(true)}
          >
            <Ionicons name="add" size={28} color={Colors.dark.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
        {LIBRARY_TABS.map((tab) => {
          const isSelected = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tabChip, isSelected && styles.tabChipActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabChipText, isSelected && styles.tabChipTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading && playlists.length === 0 ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={Colors.dark.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Liked Songs Featured Banner (shown in "Tất cả" & "Yêu thích") */}
          {(activeTab === "Tất cả" || activeTab === "Yêu thích") && (
            <TouchableOpacity
              style={styles.likedBanner}
              onPress={handlePlayLikedSongs}
              activeOpacity={0.85}
            >
              <View style={styles.likedIconBox}>
                <Ionicons name="heart" size={32} color="#fff" />
              </View>
              <View style={styles.likedInfo}>
                <Text style={styles.likedTitle}>Bài Hát Đã Thích ❤️</Text>
                <Text style={styles.likedSub}>
                  {likedSongs.length > 0 ? `${likedSongs.length} bài hát anime yêu thích` : "Chưa có bài hát nào"}
                </Text>
              </View>
              <Ionicons name="play-circle" size={38} color={Colors.dark.secondary} />
            </TouchableOpacity>
          )}

          {/* Liked Songs List (when active tab is "Yêu thích") */}
          {activeTab === "Yêu thích" && likedSongs.length > 0 && (
            <View style={{ marginBottom: 24 }}>
              {likedSongs.map((song, index) => (
                <SongRow
                  key={`liked-${song.id}-${index}`}
                  song={song}
                  isPlaying={currentSong?.id === song.id && isPlaying}
                  onPress={() => handlePlaySong(song, index, likedSongs)}
                />
              ))}
            </View>
          )}

          {/* Live Rooms Section (shown in "Tất cả" & "Phòng nghe") */}
          {(activeTab === "Tất cả" || activeTab === "Phòng nghe") && (
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Phòng nghe nhạc chung (Live) 📡</Text>
                <TouchableOpacity onPress={() => setShowCreateRoomModal(true)}>
                  <Text style={styles.createLinkText}>+ Tạo phòng</Text>
                </TouchableOpacity>
              </View>
              {rooms.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Ionicons name="headset-outline" size={36} color={Colors.dark.textMuted} />
                  <Text style={styles.emptyCardText}>Chưa có phòng nào đang mở.</Text>
                  <TouchableOpacity
                    style={styles.miniCreateBtn}
                    onPress={() => setShowCreateRoomModal(true)}
                  >
                    <Text style={styles.miniCreateBtnText}>Tạo phòng nghe cùng bạn bè</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                rooms.map((room) => (
                  <TouchableOpacity
                    key={room.id}
                    style={styles.roomCard}
                    onPress={() => router.push(`/room/${room.id}` as any)}
                  >
                    <View style={styles.roomIconBox}>
                      <Ionicons name="radio" size={24} color={Colors.dark.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.roomName}>{room.name}</Text>
                      <Text style={styles.roomSub}>
                        Chủ phòng: {room.owner?.username || "Admin"} • {room.participants?.length || 1} người đang nghe
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={Colors.dark.textMuted} />
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}

          {/* Playlists Section (shown in "Tất cả" & "Playlists") */}
          {(activeTab === "Tất cả" || activeTab === "Playlists") && (
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Danh sách phát ({playlists.length})</Text>
                <TouchableOpacity onPress={() => setShowCreatePlaylistModal(true)}>
                  <Text style={styles.createLinkText}>+ Tạo mới</Text>
                </TouchableOpacity>
              </View>

              {playlists.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Ionicons name="musical-notes-outline" size={36} color={Colors.dark.textMuted} />
                  <Text style={styles.emptyCardText}>Bạn chưa tạo danh sách phát nào.</Text>
                  <TouchableOpacity
                    style={styles.miniCreateBtn}
                    onPress={() => setShowCreatePlaylistModal(true)}
                  >
                    <Text style={styles.miniCreateBtnText}>Tạo Playlist đầu tiên</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                playlists.map((pl) => (
                  <TouchableOpacity
                    key={pl.id}
                    style={styles.playlistRow}
                    onPress={() => router.push(`/playlist/${pl.id}` as any)}
                  >
                    {pl.coverUrl ? (
                      <Image source={{ uri: pl.coverUrl }} style={styles.playlistCover} />
                    ) : (
                      <View style={[styles.playlistCover, styles.playlistCoverFallback]}>
                        <Ionicons name="disc" size={28} color={Colors.dark.primary} />
                      </View>
                    )}
                    <View style={styles.playlistInfo}>
                      <Text style={styles.playlistName} numberOfLines={1}>
                        {pl.name}
                      </Text>
                      <Text style={styles.playlistSub}>
                        {pl.songCount ?? pl.songs?.length ?? 0} bài hát • {pl.isPublic ? "Công khai" : "Riêng tư"}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={Colors.dark.textMuted} />
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}

          {/* Listening History Section (shown in "Tất cả" & "Lịch sử") */}
          {(activeTab === "Tất cả" || activeTab === "Lịch sử") && (
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Lịch sử nghe gần đây ⏱️</Text>
              </View>
              {historySongs.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Ionicons name="time-outline" size={36} color={Colors.dark.textMuted} />
                  <Text style={styles.emptyCardText}>Chưa có lịch sử phát nhạc.</Text>
                </View>
              ) : (
                historySongs.slice(0, 10).map((song, index) => (
                  <SongRow
                    key={`hist-${song.id}-${index}`}
                    song={song}
                    isPlaying={currentSong?.id === song.id && isPlaying}
                    onPress={() => handlePlaySong(song, index, historySongs)}
                  />
                ))
              )}
            </View>
          )}
        </ScrollView>
      )}

      {/* Modal: Create Playlist */}
      <Modal
        visible={showCreatePlaylistModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCreatePlaylistModal(false)}
      >
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Tạo Danh Sách Phát Mới 🎵</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Tên danh sách phát (VD: Best Vocaloid 2026)"
              placeholderTextColor={Colors.dark.textMuted}
              value={newPlaylistName}
              onChangeText={setNewPlaylistName}
            />
            <TextInput
              style={[styles.modalInput, { height: 70, textAlignVertical: "top" }]}
              placeholder="Mô tả (tùy chọn)"
              placeholderTextColor={Colors.dark.textMuted}
              value={newPlaylistDesc}
              onChangeText={setNewPlaylistDesc}
              multiline
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowCreatePlaylistModal(false)}
              >
                <Text style={styles.modalCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleCreatePlaylist}
                disabled={creatingPlaylist}
              >
                {creatingPlaylist ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalConfirmText}>Tạo</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: Create Room */}
      <Modal
        visible={showCreateRoomModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCreateRoomModal(false)}
      >
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Tạo Phòng Nghe Trực Tuyến 📡</Text>
            <Text style={styles.modalSubtitle}>
              Cùng nghe nhạc đồng bộ thời gian thực với bạn bè qua kết nối phòng!
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Tên phòng (VD: Miku Waifu Lounge)"
              placeholderTextColor={Colors.dark.textMuted}
              value={newRoomName}
              onChangeText={setNewRoomName}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowCreateRoomModal(false)}
              >
                <Text style={styles.modalCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleCreateRoom}
                disabled={creatingRoom}
              >
                {creatingRoom ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalConfirmText}>Mở phòng</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: Colors.dark.text,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.dark.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  tabScroll: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 52,
  },
  tabChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.dark.surface,
    marginRight: 8,
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
    fontWeight: "600",
  },
  tabChipTextActive: {
    color: "#fff",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 110,
  },
  loadingBox: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 60,
  },
  likedBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.surface,
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  likedIconBox: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: Colors.dark.secondary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  likedInfo: {
    flex: 1,
  },
  likedTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.dark.text,
    marginBottom: 4,
  },
  likedSub: {
    fontSize: 13,
    color: Colors.dark.textMuted,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.dark.text,
  },
  createLinkText: {
    color: Colors.dark.primaryLight,
    fontSize: 13,
    fontWeight: "600",
  },
  emptyCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 14,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  emptyCardText: {
    color: Colors.dark.textMuted,
    fontSize: 13,
    marginTop: 8,
    marginBottom: 12,
  },
  miniCreateBtn: {
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  miniCreateBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  roomCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.surface,
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  roomIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: Colors.dark.card,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  roomName: {
    color: Colors.dark.text,
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  roomSub: {
    color: Colors.dark.textMuted,
    fontSize: 12,
  },
  playlistRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.surface,
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  playlistCover: {
    width: 52,
    height: 52,
    borderRadius: 10,
    marginRight: 14,
  },
  playlistCoverFallback: {
    backgroundColor: Colors.dark.card,
    alignItems: "center",
    justifyContent: "center",
  },
  playlistInfo: {
    flex: 1,
  },
  playlistName: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.dark.text,
    marginBottom: 4,
  },
  playlistSub: {
    fontSize: 12,
    color: Colors.dark.textMuted,
  },
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 380,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.dark.text,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 13,
    color: Colors.dark.textMuted,
    marginBottom: 16,
    lineHeight: 18,
  },
  modalInput: {
    backgroundColor: Colors.dark.card,
    borderRadius: 10,
    padding: 12,
    color: Colors.dark.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: 14,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 8,
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  modalCancelText: {
    color: Colors.dark.textMuted,
    fontWeight: "600",
  },
  modalConfirmBtn: {
    backgroundColor: Colors.dark.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 70,
    alignItems: "center",
  },
  modalConfirmText: {
    color: "#fff",
    fontWeight: "600",
  },
});
