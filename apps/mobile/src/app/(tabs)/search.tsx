import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors } from "../../constants/colors";
import { useDebounce } from "../../hooks/useDebounce";
import { api } from "../../services/api";
import { usePlayerStore } from "../../store/playerStore";
import { SongRow } from "../../features/songs/components/SongRow";
import type { Song, Artist, Album } from "@waifu-player/types";

const TRENDING_TAGS = [
  "Tuyển Chọn 🇻🇳",
  "NCS Release",
  "NEFFEX",
  "Bèo Dạt Mây Trôi",
  "Trống Cơm",
  "Mortals",
  "On & On",
  "Fade",
  "Fight Back",
  "Grateful",
  "Soldier",
  "Dân Ca Quan Họ",
  "Anime & EDM",
  "Future Bass",
];

const SEARCH_TABS = ["Tất cả", "Bài hát", "Nghệ sĩ", "Album"] as const;
type SearchTab = (typeof SEARCH_TABS)[number];

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 350);
  const [activeTab, setActiveTab] = useState<SearchTab>("Tất cả");
  const [loading, setLoading] = useState(false);

  const [songs, setSongs] = useState<Song[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([
    "Hatsune Miku",
    "Gurenge",
    "YOASOBI",
  ]);

  const { currentSong, isPlaying, setCurrentSong, setQueue, setPlaying } = usePlayerStore();

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setSongs([]);
      setArtists([]);
      setAlbums([]);
      return;
    }

    setLoading(true);
    api
      .get("/api/v1/search", { params: { q: debouncedQuery.trim() } })
      .then((res) => {
        if (res.data?.success && res.data?.data) {
          const data = res.data.data;
          setSongs(data.songs || []);
          setArtists(data.artists || []);
          setAlbums(data.albums || []);

          // Add to recent searches if not already there
          if (!recentSearches.includes(debouncedQuery.trim())) {
            setRecentSearches((prev) => [debouncedQuery.trim(), ...prev.slice(0, 4)]);
          }
        }
      })
      .catch(() => {
        // Fallback or empty
      })
      .finally(() => setLoading(false));
  }, [debouncedQuery]);

  const handleSelectTag = (tag: string) => {
    setQuery(tag);
  };

  const handlePlaySong = (song: Song, index: number) => {
    if (currentSong?.id === song.id) {
      setPlaying(!isPlaying);
    } else {
      setQueue(songs, index);
      setCurrentSong(song);
    }
  };

  const hasResults = songs.length > 0 || artists.length > 0 || albums.length > 0;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header & Search Bar */}
      <View style={styles.header}>
        <Text style={styles.title}>Tìm kiếm 🔍</Text>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={Colors.dark.primary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm bài hát, nghệ sĩ, album..."
            placeholderTextColor={Colors.dark.textMuted}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")} style={styles.clearBtn}>
              <Ionicons name="close-circle" size={18} color={Colors.dark.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tabs Filter (when query is active) */}
      {query.trim().length > 0 && (
        <View style={styles.tabBar}>
          {SEARCH_TABS.map((tab) => {
            const isSelected = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tabItem, isSelected && styles.tabItemActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, isSelected && styles.tabTextActive]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Colors.dark.primary} />
            <Text style={styles.loadingText}>Đang tìm kiếm cho "{debouncedQuery}"...</Text>
          </View>
        ) : query.trim().length === 0 ? (
          /* Empty Search Query: Show Trending Tags & Recent Searches */
          <View>
            {/* Trending Tags */}
            <Text style={styles.sectionTitle}>Từ khóa thịnh hành 🔥</Text>
            <View style={styles.tagsContainer}>
              {TRENDING_TAGS.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={styles.tag}
                  onPress={() => handleSelectTag(tag)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="sparkles" size={14} color={Colors.dark.primary} style={{ marginRight: 4 }} />
                  <Text style={styles.tagText}>{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <View style={{ marginTop: 28 }}>
                <View style={styles.recentHeader}>
                  <Text style={styles.sectionTitle}>Tìm kiếm gần đây</Text>
                  <TouchableOpacity onPress={() => setRecentSearches([])}>
                    <Text style={styles.clearHistoryText}>Xóa tất cả</Text>
                  </TouchableOpacity>
                </View>
                {recentSearches.map((item, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.recentItem}
                    onPress={() => setQuery(item)}
                  >
                    <Ionicons name="time-outline" size={18} color={Colors.dark.textMuted} />
                    <Text style={styles.recentItemText}>{item}</Text>
                    <Ionicons name="arrow-forward" size={16} color={Colors.dark.textMuted} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ) : !hasResults ? (
          /* No Results Found */
          <View style={styles.emptyBox}>
            <Ionicons name="sad-outline" size={60} color={Colors.dark.textMuted} />
            <Text style={styles.emptyTitle}>Không tìm thấy kết quả</Text>
            <Text style={styles.emptySub}>
              Không có bài hát hoặc nghệ sĩ nào khớp với "{query}". Hãy thử tìm kiếm với từ khóa khác nhé!
            </Text>
          </View>
        ) : (
          /* Results Found */
          <View>
            {/* Artists Section */}
            {(activeTab === "Tất cả" || activeTab === "Nghệ sĩ") && artists.length > 0 && (
              <View style={styles.resultSection}>
                <Text style={styles.resultSectionTitle}>Nghệ sĩ</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16, paddingHorizontal: 16 }}>
                  {artists.map((artist) => (
                    <TouchableOpacity
                      key={artist.id}
                      style={styles.artistCard}
                      onPress={() => router.push(`/artist/${artist.id}` as any)}
                    >
                      {artist.avatarUrl ? (
                        <Image source={{ uri: artist.avatarUrl }} style={styles.artistAvatar} />
                      ) : (
                        <View style={[styles.artistAvatar, styles.avatarFallback]}>
                          <Ionicons name="person" size={28} color="#fff" />
                        </View>
                      )}
                      <Text style={styles.artistName} numberOfLines={1}>
                        {artist.name}
                      </Text>
                      <Text style={styles.artistRole}>Nghệ sĩ</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Albums Section */}
            {(activeTab === "Tất cả" || activeTab === "Album") && albums.length > 0 && (
              <View style={styles.resultSection}>
                <Text style={styles.resultSectionTitle}>Album & Tuyển tập</Text>
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
                          <Ionicons name="disc" size={32} color={Colors.dark.primary} />
                        </View>
                      )}
                      <Text style={styles.albumTitle} numberOfLines={1}>
                        {album.title}
                      </Text>
                      <Text style={styles.albumArtist} numberOfLines={1}>
                        {album.artist?.name || "Anime Album"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Songs Section */}
            {(activeTab === "Tất cả" || activeTab === "Bài hát") && songs.length > 0 && (
              <View style={styles.resultSection}>
                <Text style={styles.resultSectionTitle}>Bài hát ({songs.length})</Text>
                {songs.map((song, index) => (
                  <SongRow
                    key={song.id}
                    song={song}
                    isPlaying={currentSong?.id === song.id && isPlaying}
                    onPress={() => handlePlaySong(song, index)}
                    showPlays={true}
                  />
                ))}
              </View>
            )}
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
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: Colors.dark.text,
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: Colors.dark.text,
    fontSize: 15,
  },
  clearBtn: {
    padding: 4,
  },
  tabBar: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  tabItem: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: Colors.dark.surface,
  },
  tabItemActive: {
    backgroundColor: Colors.dark.primary,
  },
  tabText: {
    color: Colors.dark.textMuted,
    fontSize: 13,
    fontWeight: "600",
  },
  tabTextActive: {
    color: "#fff",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 110,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.dark.text,
    marginBottom: 14,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  tagText: {
    color: Colors.dark.text,
    fontSize: 13,
    fontWeight: "500",
  },
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  clearHistoryText: {
    color: Colors.dark.primaryLight,
    fontSize: 13,
    fontWeight: "600",
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.surface,
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  recentItemText: {
    flex: 1,
    color: Colors.dark.text,
    fontSize: 14,
    marginLeft: 12,
  },
  loadingBox: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 60,
  },
  loadingText: {
    color: Colors.dark.textMuted,
    marginTop: 14,
    fontSize: 14,
  },
  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.dark.text,
    marginTop: 16,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: Colors.dark.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
  resultSection: {
    marginBottom: 24,
  },
  resultSectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.dark.text,
    marginBottom: 12,
  },
  artistCard: {
    alignItems: "center",
    width: 100,
    marginRight: 14,
  },
  artistAvatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    marginBottom: 8,
  },
  avatarFallback: {
    backgroundColor: Colors.dark.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  artistName: {
    color: Colors.dark.text,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  artistRole: {
    color: Colors.dark.textMuted,
    fontSize: 11,
    marginTop: 2,
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
  albumArtist: {
    color: Colors.dark.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
});
