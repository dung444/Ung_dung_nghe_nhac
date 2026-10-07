import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/colors";
import { api } from "../../services/api";
import { usePlayerStore } from "../../store/playerStore";
import { SongRow } from "../../features/songs/components/SongRow";
import type { Album, Song } from "@waifu-player/types";

export default function AlbumDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);

  const { currentSong, isPlaying, setQueue, setCurrentSong, setPlaying } = usePlayerStore();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .get(`/api/v1/albums/${id}`)
      .then((res) => {
        if (res.data?.success && res.data?.data) {
          setAlbum(res.data.data);
        }
      })
      .catch(() => {
        // Mock fallback
        setAlbum({
          id: id,
          title: "Supercell feat. Hatsune Miku",
          coverUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80",
          releaseDate: "2023-03-09",
          artistId: "art1",
          artist: {
            id: "art1",
            name: "Hatsune Miku",
            bio: null,
            avatarUrl: null,
            verified: true,
            userId: null,
            createdAt: "",
            updatedAt: "",
          },
          createdAt: "",
          songs: [
            {
              id: "s1",
              title: "World is Mine",
              duration: 225,
              fileUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
              coverUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80",
              plays: 420000,
              isPublic: true,
              releaseDate: "2023-03-09",
              albumId: id,
              artists: [{ id: "art1", name: "Hatsune Miku", bio: null, avatarUrl: null, verified: true, userId: null, createdAt: "", updatedAt: "" }],
              genres: [{ id: "g1", name: "Vocaloid", slug: "vocaloid" }],
              createdAt: "",
              updatedAt: "",
            },
          ],
        });
      })
      .finally(() => setLoading(false));
  }, [id]);

  const albumSongs = album?.songs || [];

  const handlePlayAll = () => {
    if (albumSongs.length === 0) return;
    setQueue(albumSongs, 0);
  };

  const handleShuffle = () => {
    if (albumSongs.length === 0) return;
    const shuffled = [...albumSongs].sort(() => Math.random() - 0.5);
    setQueue(shuffled, 0);
  };

  const handlePlaySong = (song: Song, index: number) => {
    if (currentSong?.id === song.id) {
      setPlaying(!isPlaying);
    } else {
      setQueue(albumSongs, index);
      setCurrentSong(song);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerBox]}>
        <ActivityIndicator size="large" color={Colors.dark.primary} />
      </View>
    );
  }

  if (!album) {
    return (
      <View style={[styles.container, styles.centerBox]}>
        <Text style={{ color: Colors.dark.text }}>Không tìm thấy Album.</Text>
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
          {album.title}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Album Header */}
        <View style={styles.albumHeader}>
          {album.coverUrl ? (
            <Image source={{ uri: album.coverUrl }} style={styles.albumCover} />
          ) : (
            <View style={[styles.albumCover, styles.coverFallback]}>
              <Ionicons name="disc" size={60} color={Colors.dark.primary} />
            </View>
          )}

          <Text style={styles.albumTitle}>{album.title}</Text>

          {album.artist && (
            <TouchableOpacity
              onPress={() => router.push(`/artist/${album.artist!.id}` as any)}
              style={styles.artistLink}
            >
              <Text style={styles.artistName}>{album.artist.name}</Text>
              <Ionicons name="chevron-forward" size={14} color={Colors.dark.primaryLight} />
            </TouchableOpacity>
          )}

          <Text style={styles.albumMeta}>
            Album • {album.releaseDate ? new Date(album.releaseDate).getFullYear() : "2026"} • {albumSongs.length} bài hát
          </Text>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.playAllBtn} onPress={handlePlayAll} activeOpacity={0.8}>
              <Ionicons name="play" size={18} color="#fff" />
              <Text style={styles.playAllText}>Phát Album</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.shuffleBtn} onPress={handleShuffle} activeOpacity={0.8}>
              <Ionicons name="shuffle" size={20} color={Colors.dark.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tracks List */}
        <View style={styles.trackSection}>
          <Text style={styles.trackSectionTitle}>Danh sách bài hát</Text>
          {albumSongs.length === 0 ? (
            <Text style={styles.emptyText}>Chưa có bài hát trong album này.</Text>
          ) : (
            albumSongs.map((song, index) => (
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
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 110,
  },
  albumHeader: {
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
    marginBottom: 20,
  },
  albumCover: {
    width: 190,
    height: 190,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: Colors.dark.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
  },
  coverFallback: {
    backgroundColor: Colors.dark.card,
    alignItems: "center",
    justifyContent: "center",
  },
  albumTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.dark.text,
    textAlign: "center",
    marginBottom: 6,
  },
  artistLink: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 4,
  },
  artistName: {
    fontSize: 15,
    color: Colors.dark.primaryLight,
    fontWeight: "600",
  },
  albumMeta: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    marginBottom: 18,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  playAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 26,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  playAllText: {
    color: "#fff",
    fontSize: 14,
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
  trackSection: {
    marginBottom: 20,
  },
  trackSectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.dark.text,
    marginBottom: 12,
  },
  emptyText: {
    color: Colors.dark.textMuted,
    fontSize: 13,
  },
});
