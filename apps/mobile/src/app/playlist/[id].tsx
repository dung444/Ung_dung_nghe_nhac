import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/colors";
import { api } from "../../services/api";
import { usePlayerStore } from "../../store/playerStore";
import { getPlaylistSocket } from "../../services/socket";
import { SongRow } from "../../features/songs/components/SongRow";
import type { Playlist, Song } from "@waifu-player/types";

export default function PlaylistDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const playlistId = Array.isArray(id) ? id[0] : id;

  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);

  // Add Song Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [availableSongs, setAvailableSongs] = useState<Song[]>([]);
  const [songSearchQuery, setSongSearchQuery] = useState("");
  const [addingSongId, setAddingSongId] = useState<string | null>(null);

  const { currentSong, isPlaying, setQueue, setCurrentSong, setPlaying } = usePlayerStore();

  const loadPlaylist = () => {
    if (!playlistId) return;
    setLoading(true);
    api
      .get(`/api/v1/playlists/${playlistId}`)
      .then((res) => {
        if (res.data?.success && res.data?.data) {
          setPlaylist(res.data.data);
        }
      })
      .catch(() => {
        // Fallback demo playlist if offline
        setPlaylist({
          id: playlistId,
          name: "Vocaloid Tuyển Chọn",
          description: "Những ca khúc Anime & Vocaloid đỉnh cao của Hatsune Miku và các Diva ảo",
          coverUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80",
          isPublic: true,
          userId: "admin",
          user: { id: "admin", username: "WaifuMaster", avatarUrl: null },
          songCount: 2,
          createdAt: "",
          updatedAt: "",
          songs: [
            {
              playlistId,
              songId: "s1",
              position: 0,
              addedAt: "",
              song: {
                id: "s1",
                title: "World is Mine",
                duration: 225,
                fileUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
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
            },
            {
              playlistId,
              songId: "s2",
              position: 1,
              addedAt: "",
              song: {
                id: "s2",
                title: "Gurenge (紅蓮華)",
                duration: 258,
                fileUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
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
            },
          ],
        });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPlaylist();

    // Setup socket collaboration
    const s = getPlaylistSocket();
    s.emit("playlist:join", { playlistId });

    s.on("playlist:song:added", (data: any) => {
      if (data?.song) {
        setPlaylist((prev) => {
          if (!prev) return prev;
          const newSongs = [...(prev.songs || []), { playlistId, songId: data.song.id, position: prev.songs?.length || 0, addedAt: new Date().toISOString(), song: data.song }];
          return { ...prev, songs: newSongs, songCount: newSongs.length };
        });
      }
    });

    s.on("playlist:song:removed", (data: any) => {
      if (data?.songId) {
        setPlaylist((prev) => {
          if (!prev) return prev;
          const newSongs = (prev.songs || []).filter((ps) => ps.songId !== data.songId);
          return { ...prev, songs: newSongs, songCount: newSongs.length };
        });
      }
    });

    return () => {
      s.emit("playlist:leave", { playlistId });
      s.off("playlist:song:added");
      s.off("playlist:song:removed");
    };
  }, [playlistId]);

  const playlistSongs: Song[] = playlist?.songs?.map((ps) => ps.song) || [];

  const handlePlayAll = () => {
    if (playlistSongs.length === 0) return;
    setQueue(playlistSongs, 0);
  };

  const handleShufflePlay = () => {
    if (playlistSongs.length === 0) return;
    const shuffled = [...playlistSongs].sort(() => Math.random() - 0.5);
    setQueue(shuffled, 0);
  };

  const handlePlaySong = (song: Song, index: number) => {
    if (currentSong?.id === song.id) {
      setPlaying(!isPlaying);
    } else {
      setQueue(playlistSongs, index);
      setCurrentSong(song);
    }
  };

  const handleOpenAddModal = () => {
    setShowAddModal(true);
    api.get("/api/v1/songs").then((res) => {
      if (res.data?.success && Array.isArray(res.data.data)) {
        setAvailableSongs(res.data.data);
      }
    }).catch(() => {});
  };

  const handleAddSongToPlaylist = async (song: Song) => {
    setAddingSongId(song.id);
    try {
      await api.post(`/api/v1/playlists/${playlistId}/songs`, { songId: song.id });
      getPlaylistSocket().emit("playlist:song:add", { playlistId, songId: song.id });
      setPlaylist((prev) => {
        if (!prev) return prev;
        const exists = prev.songs?.some((ps) => ps.songId === song.id);
        if (exists) return prev;
        const newSongs = [...(prev.songs || []), { playlistId, songId: song.id, position: prev.songs?.length || 0, addedAt: new Date().toISOString(), song }];
        return { ...prev, songs: newSongs, songCount: newSongs.length };
      });
      setShowAddModal(false);
    } catch (err: any) {
      Alert.alert("Lỗi", err.response?.data?.error || "Không thể thêm bài hát vào danh sách phát.");
    } finally {
      setAddingSongId(null);
    }
  };

  const handleRemoveSong = (songId: string) => {
    Alert.alert("Xác nhận", "Xóa bài hát này khỏi danh sách phát?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/api/v1/playlists/${playlistId}/songs/${songId}`);
            getPlaylistSocket().emit("playlist:song:remove", { playlistId, songId });
            setPlaylist((prev) => {
              if (!prev) return prev;
              const newSongs = (prev.songs || []).filter((ps) => ps.songId !== songId);
              return { ...prev, songs: newSongs, songCount: newSongs.length };
            });
          } catch {
            setPlaylist((prev) => {
              if (!prev) return prev;
              const newSongs = (prev.songs || []).filter((ps) => ps.songId !== songId);
              return { ...prev, songs: newSongs, songCount: newSongs.length };
            });
          }
        },
      },
    ]);
  };

  const handleDeletePlaylist = () => {
    Alert.alert("Xác nhận", "Bạn có chắc chắn muốn xóa danh sách phát này không?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/api/v1/playlists/${playlistId}`);
            router.back();
          } catch {
            router.back();
          }
        },
      },
    ]);
  };

  const filteredAvailableSongs = availableSongs.filter(
    (s) =>
      s.title.toLowerCase().includes(songSearchQuery.toLowerCase()) ||
      s.artists?.some((a) => a.name.toLowerCase().includes(songSearchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centerBox]}>
        <ActivityIndicator size="large" color={Colors.dark.primary} />
      </View>
    );
  }

  if (!playlist) {
    return (
      <View style={[styles.container, styles.centerBox]}>
        <Text style={{ color: Colors.dark.text }}>Không tìm thấy danh sách phát.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: Colors.dark.primary }}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark.text} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle} numberOfLines={1}>
          {playlist.name}
        </Text>
        <TouchableOpacity onPress={handleDeletePlaylist} style={styles.backBtn}>
          <Ionicons name="trash-outline" size={20} color={Colors.dark.secondary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Playlist Header */}
        <View style={styles.headerHero}>
          {playlist.coverUrl ? (
            <Image source={{ uri: playlist.coverUrl }} style={styles.coverImage} />
          ) : (
            <View style={[styles.coverImage, styles.coverFallback]}>
              <Ionicons name="musical-notes" size={60} color={Colors.dark.primary} />
            </View>
          )}
          <Text style={styles.playlistTitle}>{playlist.name}</Text>
          {playlist.description && (
            <Text style={styles.playlistDesc}>{playlist.description}</Text>
          )}
          <Text style={styles.playlistMeta}>
            Tạo bởi {playlist.user?.username || "Bạn"} • {playlistSongs.length} bài hát
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.playAllBtn} onPress={handlePlayAll} activeOpacity={0.8}>
            <Ionicons name="play" size={20} color="#fff" />
            <Text style={styles.playAllText}>Phát tất cả</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.shuffleBtn} onPress={handleShufflePlay} activeOpacity={0.8}>
            <Ionicons name="shuffle" size={20} color={Colors.dark.text} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.addBtn} onPress={handleOpenAddModal} activeOpacity={0.8}>
            <Ionicons name="add" size={22} color={Colors.dark.primaryLight} />
            <Text style={styles.addBtnText}>Thêm bài</Text>
          </TouchableOpacity>
        </View>

        {/* Songs List */}
        <View style={styles.songsContainer}>
          {playlistSongs.length === 0 ? (
            <View style={styles.emptySongsBox}>
              <Ionicons name="musical-notes-outline" size={48} color={Colors.dark.textMuted} />
              <Text style={styles.emptySongsText}>Chưa có bài hát nào trong playlist này.</Text>
              <TouchableOpacity style={styles.emptyAddBtn} onPress={handleOpenAddModal}>
                <Text style={styles.emptyAddBtnText}>+ Thêm bài hát ngay</Text>
              </TouchableOpacity>
            </View>
          ) : (
            playlistSongs.map((song, index) => (
              <View key={`pl-song-${song.id}-${index}`} style={styles.songRowWrapper}>
                <View style={{ flex: 1 }}>
                  <SongRow
                    song={song}
                    isPlaying={currentSong?.id === song.id && isPlaying}
                    onPress={() => handlePlaySong(song, index)}
                    showPlays={true}
                  />
                </View>
                <TouchableOpacity
                  style={styles.removeSongBtn}
                  onPress={() => handleRemoveSong(song.id)}
                >
                  <Ionicons name="remove-circle-outline" size={22} color={Colors.dark.textMuted} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Modal: Add Song to Playlist */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Thêm bài hát vào danh sách 🎶</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={Colors.dark.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSearchBar}>
              <Ionicons name="search" size={18} color={Colors.dark.textMuted} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Tìm bài hát..."
                placeholderTextColor={Colors.dark.textMuted}
                value={songSearchQuery}
                onChangeText={setSongSearchQuery}
              />
            </View>

            <ScrollView style={{ maxHeight: 380 }}>
              {filteredAvailableSongs.length === 0 ? (
                <Text style={styles.modalEmptyText}>Không tìm thấy bài hát phù hợp.</Text>
              ) : (
                filteredAvailableSongs.map((song) => {
                  const alreadyInPlaylist = playlistSongs.some((s) => s.id === song.id);
                  return (
                    <View key={song.id} style={styles.modalSongRow}>
                      <Image
                        source={{ uri: song.coverUrl ?? "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80" }}
                        style={styles.modalSongThumb}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.modalSongTitle} numberOfLines={1}>
                          {song.title}
                        </Text>
                        <Text style={styles.modalSongArtist} numberOfLines={1}>
                          {song.artists?.map((a) => a.name).join(", ") || "Unknown"}
                        </Text>
                      </View>
                      {alreadyInPlaylist ? (
                        <View style={styles.addedBadge}>
                          <Text style={styles.addedBadgeText}>Đã thêm</Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.addSongBtn}
                          onPress={() => handleAddSongToPlaylist(song)}
                          disabled={addingSongId === song.id}
                        >
                          {addingSongId === song.id ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <Text style={styles.addSongBtnText}>+ Thêm</Text>
                          )}
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })
              )}
            </ScrollView>
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
  centerBox: {
    justifyContent: "center",
    alignItems: "center",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  backBtn: {
    padding: 6,
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.dark.text,
    maxWidth: "70%",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 110,
  },
  headerHero: {
    alignItems: "center",
    marginVertical: 16,
  },
  coverImage: {
    width: 180,
    height: 180,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: Colors.dark.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  coverFallback: {
    backgroundColor: Colors.dark.card,
    alignItems: "center",
    justifyContent: "center",
  },
  playlistTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.dark.text,
    textAlign: "center",
    marginBottom: 6,
  },
  playlistDesc: {
    fontSize: 13,
    color: Colors.dark.textMuted,
    textAlign: "center",
    paddingHorizontal: 20,
    marginBottom: 8,
    lineHeight: 18,
  },
  playlistMeta: {
    fontSize: 12,
    color: Colors.dark.primaryLight,
    fontWeight: "500",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginVertical: 18,
  },
  playAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 24,
    gap: 6,
  },
  playAllText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  shuffleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.dark.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.surface,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    gap: 4,
  },
  addBtnText: {
    color: Colors.dark.primaryLight,
    fontSize: 13,
    fontWeight: "600",
  },
  songsContainer: {
    marginTop: 8,
  },
  songRowWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  removeSongBtn: {
    padding: 10,
  },
  emptySongsBox: {
    padding: 30,
    alignItems: "center",
  },
  emptySongsText: {
    color: Colors.dark.textMuted,
    fontSize: 14,
    marginTop: 10,
    marginBottom: 14,
  },
  emptyAddBtn: {
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  emptyAddBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.dark.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.dark.text,
  },
  modalSearchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  modalSearchInput: {
    flex: 1,
    color: Colors.dark.text,
    fontSize: 14,
  },
  modalEmptyText: {
    color: Colors.dark.textMuted,
    textAlign: "center",
    marginVertical: 20,
  },
  modalSongRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  modalSongThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    marginRight: 10,
  },
  modalSongTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.dark.text,
    marginBottom: 2,
  },
  modalSongArtist: {
    fontSize: 12,
    color: Colors.dark.textMuted,
  },
  addedBadge: {
    backgroundColor: Colors.dark.card,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  addedBadgeText: {
    color: Colors.dark.textMuted,
    fontSize: 11,
    fontWeight: "600",
  },
  addSongBtn: {
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addSongBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
});
