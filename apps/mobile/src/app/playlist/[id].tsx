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
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/colors";
import { api } from "../../services/api";
import { usePlayerStore } from "../../store/playerStore";
import { SongRow } from "../../features/songs/components/SongRow";
import type { Playlist, Song } from "@waifu-player/types";

export default function PlaylistDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);

  const { currentSong, isPlaying, setQueue, setCurrentSong, setPlaying } = usePlayerStore();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .get(`/api/v1/playlists/${id}`)
      .then((res) => {
        if (res.data?.success && res.data?.data) {
          setPlaylist(res.data.data);
        }
      })
      .catch(() => {
        // Fallback demo playlist if offline
        setPlaylist({
          id: id,
          name: "Vocaloid Tuyển Chọn",
          description: "Những ca khúc Anime & Vocaloid đỉnh cao của Hatsune Miku và các Diva ảo",
          coverUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80",
          isPublic: true,
          userId: "admin",
          user: { id: "admin", username: "WaifuMaster", avatarUrl: null },
          songCount: 3,
          createdAt: "",
          updatedAt: "",
          songs: [
            {
              playlistId: id,
              songId: "s1",
              position: 0,
              addedAt: "",
              song: {
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
            },
            {
              playlistId: id,
              songId: "s2",
              position: 1,
              addedAt: "",
              song: {
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
            },
          ],
        });
      })
      .finally(() => setLoading(false));
  }, [id]);

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

  const handleDeletePlaylist = () => {
    Alert.alert("Xác nhận", "Bạn có chắc chắn muốn xóa danh sách phát này không?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/api/v1/playlists/${id}`);
            router.back();
          } catch {
            router.back();
          }
        },
      },
    ]);
  };

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
        </View>

        {/* Songs List */}
        <View style={styles.songsContainer}>
          {playlistSongs.length === 0 ? (
            <View style={styles.emptySongsBox}>
              <Text style={styles.emptySongsText}>Chưa có bài hát nào trong playlist này.</Text>
            </View>
          ) : (
            playlistSongs.map((song, index) => (
              <SongRow
                key={song.id}
                song={song}
                isPlaying={currentSong?.id === song.id && isPlaying}
                onPress={() => handlePlaySong(song, index)}
                showPlays={true}
              />
            ))
          )}
        </View>
      </ScrollView>
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
    gap: 12,
    marginVertical: 20,
  },
  playAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  playAllText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  shuffleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.dark.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  songsContainer: {
    marginTop: 8,
  },
  emptySongsBox: {
    padding: 40,
    alignItems: "center",
  },
  emptySongsText: {
    color: Colors.dark.textMuted,
    fontSize: 14,
  },
});
