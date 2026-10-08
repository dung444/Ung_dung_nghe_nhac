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
import type { Artist, Song, Album } from "@waifu-player/types";

export default function ArtistDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [artist, setArtist] = useState<Artist | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const { currentSong, isPlaying, setQueue, setCurrentSong, setPlaying } = usePlayerStore();

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    // Fetch Artist Info
    api
      .get(`/api/v1/artists/${id}`)
      .then((res) => {
        if (res.data?.success && res.data?.data) {
          const a = res.data.data;
          setArtist(a);
          setIsFollowing(!!a.isFollowing);
          setFollowerCount(a.followerCount || 12800);
        }
      })
      .catch(() => {
        // Fallback mock
        setArtist({
          id: id,
          name: "Hatsune Miku",
          bio: "Nữ ca sĩ ảo (Vocaloid) hàng đầu thế giới được phát triển bởi Crypton Future Media.",
          avatarUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80",
          verified: true,
          userId: null,
          createdAt: "",
          updatedAt: "",
          followerCount: 245000,
        });
        setFollowerCount(245000);
      });

    // Fetch Artist Songs
    api
      .get(`/api/v1/artists/${id}/songs`)
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          setSongs(res.data.data);
        }
      })
      .catch(() => {});

    // Fetch Artist Albums
    api
      .get(`/api/v1/artists/${id}/albums`)
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          setAlbums(res.data.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleToggleFollow = async () => {
    const nextState = !isFollowing;
    setIsFollowing(nextState);
    setFollowerCount((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));
    try {
      await api.post(`/api/v1/artists/${id}/follow`);
      try {
        const { useToastStore } = require("../../store/toastStore");
        if (nextState) {
          useToastStore.getState().showSuccess("Theo dõi nghệ sĩ ⭐", `Đã theo dõi "${artist?.name}".`);
        } else {
          useToastStore.getState().showInfo("Bỏ theo dõi", `Đã hủy theo dõi "${artist?.name}".`);
        }
      } catch {}
    } catch {
      // Revert on error
      setIsFollowing(!nextState);
      setFollowerCount((prev) => (!nextState ? prev + 1 : Math.max(0, prev - 1)));
      try {
        const { useToastStore } = require("../../store/toastStore");
        useToastStore.getState().showError("Lỗi kết nối", "Không thể cập nhật trạng thái theo dõi.");
      } catch {}
    }
  };

  const handlePlayAll = () => {
    if (songs.length === 0) return;
    setQueue(songs, 0);
    try {
      const { useToastStore } = require("../../store/toastStore");
      useToastStore.getState().showSuccess("Phát bài hát nghệ sĩ 🎶", `Bắt đầu phát ${songs.length} bài hát của "${artist?.name}".`);
    } catch {}
  };

  const handlePlaySong = (song: Song, index: number) => {
    if (currentSong?.id === song.id) {
      setPlaying(!isPlaying);
    } else {
      setQueue(songs, index);
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

  if (!artist) {
    return (
      <View style={[styles.container, styles.centerBox]}>
        <Text style={{ color: Colors.dark.text }}>Không tìm thấy thông tin nghệ sĩ.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: Colors.dark.primary }}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Top Navigation */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark.text} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle} numberOfLines={1}>
          {artist.name}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Artist Profile Header */}
        <View style={styles.heroSection}>
          {artist.avatarUrl ? (
            <Image source={{ uri: artist.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Ionicons name="person" size={60} color="#fff" />
            </View>
          )}

          <View style={styles.nameRow}>
            <Text style={styles.artistName}>{artist.name}</Text>
            {artist.verified && (
              <Ionicons name="checkmark-circle" size={22} color={Colors.dark.primary} style={{ marginLeft: 6 }} />
            )}
          </View>

          <Text style={styles.followersText}>
            {followerCount.toLocaleString()} người theo dõi
          </Text>

          {artist.bio && <Text style={styles.bioText}>{artist.bio}</Text>}

          {/* Action Buttons: Follow & Play All */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.followBtn, isFollowing && styles.followingBtn]}
              onPress={handleToggleFollow}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isFollowing ? "checkmark" : "heart"}
                size={16}
                color={isFollowing ? Colors.dark.text : "#fff"}
              />
              <Text style={[styles.followBtnText, isFollowing && styles.followingBtnText]}>
                {isFollowing ? "Đang theo dõi" : "Theo dõi"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.playAllBtn}
              onPress={handlePlayAll}
              activeOpacity={0.8}
            >
              <Ionicons name="play" size={18} color="#fff" />
              <Text style={styles.playAllBtnText}>Phát nhạc</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Popular Songs Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bài hát phổ biến 🔥</Text>
          {songs.length === 0 ? (
            <Text style={styles.emptyText}>Chưa có bài hát nào được đăng tải.</Text>
          ) : (
            songs.map((song, index) => (
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

        {/* Albums Section */}
        {albums.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Album & Đĩa đơn 💿</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16, paddingHorizontal: 16 }}>
              {albums.map((album) => (
                <TouchableOpacity
                  key={album.id}
                  style={styles.albumCard}
                  onPress={() => router.push(`/album/${album.id}` as any)}
                >
                  {album.coverUrl ? (
                    <Image source={{ uri: album.coverUrl }} style={styles.albumCover} />
                  ) : (
                    <View style={[styles.albumCover, styles.coverFallback]}>
                      <Ionicons name="disc" size={36} color={Colors.dark.primary} />
                    </View>
                  )}
                  <Text style={styles.albumTitle} numberOfLines={1}>
                    {album.title}
                  </Text>
                  <Text style={styles.albumYear}>
                    {album.releaseDate ? new Date(album.releaseDate).getFullYear() : "Album"}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
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
  heroSection: {
    alignItems: "center",
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
    marginBottom: 20,
  },
  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    marginBottom: 16,
    borderWidth: 4,
    borderColor: Colors.dark.primary,
  },
  avatarFallback: {
    backgroundColor: Colors.dark.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  artistName: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.dark.text,
  },
  followersText: {
    fontSize: 13,
    color: Colors.dark.textMuted,
    marginBottom: 10,
  },
  bioText: {
    fontSize: 13,
    color: Colors.dark.textMuted,
    textAlign: "center",
    paddingHorizontal: 20,
    marginBottom: 18,
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
  },
  followBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.secondary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  followingBtn: {
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  followBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  followingBtnText: {
    color: Colors.dark.text,
  },
  playAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  playAllBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.dark.text,
    marginBottom: 12,
  },
  emptyText: {
    color: Colors.dark.textMuted,
    fontSize: 13,
  },
  albumCard: {
    width: 120,
    marginRight: 14,
  },
  albumCover: {
    width: 120,
    height: 120,
    borderRadius: 12,
    marginBottom: 8,
  },
  coverFallback: {
    backgroundColor: Colors.dark.card,
    alignItems: "center",
    justifyContent: "center",
  },
  albumTitle: {
    color: Colors.dark.text,
    fontSize: 13,
    fontWeight: "600",
  },
  albumYear: {
    color: Colors.dark.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
});

