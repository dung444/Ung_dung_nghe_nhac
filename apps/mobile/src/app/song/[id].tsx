import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Image,
  Alert,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/colors";
import { usePlayerStore } from "../../store/playerStore";
import { SafeAreaView } from "react-native-safe-area-context";
import { ProgressBar } from "../../features/player/components/ProgressBar";
import { api } from "../../services/api";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  withRepeat,
  cancelAnimation,
} from "react-native-reanimated";
import type { Song } from "@waifu-player/types";
import { formatDuration } from "@waifu-player/utils";

export default function SongDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [showQueue, setShowQueue] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const {
    currentSong,
    queue,
    isPlaying,
    setPlaying,
    playNext,
    playPrev,
    shuffleEnabled,
    toggleShuffle,
    repeatMode,
    setRepeatMode,
    position,
    duration,
    seekTo,
    setCurrentSong,
    setQueue,
  } = usePlayerStore();

  const rotation = useSharedValue(0);

  // If navigated with a specific song id that is not 'current'
  useEffect(() => {
    if (id && id !== "current" && currentSong?.id !== id) {
      // Find in existing queue first
      const found = queue.find((s) => s.id === id);
      if (found) {
        setCurrentSong(found);
      } else {
        // Fetch from API
        api
          .get(`/api/v1/songs/${id}`)
          .then((res) => {
            if (res.data?.success && res.data?.data) {
              setCurrentSong(res.data.data);
            }
          })
          .catch(() => {});
      }
    }
  }, [id]);

  useEffect(() => {
    if (currentSong) {
      setIsLiked(!!currentSong.isLiked);
    }
  }, [currentSong?.id]);

  useEffect(() => {
    if (isPlaying) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 12000, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      cancelAnimation(rotation);
    }
  }, [isPlaying]);

  const animatedVinylStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotateZ: `${rotation.value}deg` }],
    };
  });

  const toggleLike = async () => {
    if (!currentSong) return;
    const newLiked = !isLiked;
    setIsLiked(newLiked);
    try {
      await api.post(`/api/v1/songs/${currentSong.id}/like`);
    } catch {
      // Revert if request fails
      setIsLiked(!newLiked);
    }
  };

  const handleShare = async () => {
    if (!currentSong) return;
    const message = `🎵 Đang nghe "${currentSong.title}" bởi ${
      currentSong.artists?.map((a) => a.name).join(", ") || "Unknown"
    } trên Waifu Player!`;
    try {
      const Sharing = await import("expo-sharing");
      if (await Sharing.isAvailableAsync()) {
        // Share via web or device share
        if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.share) {
          await navigator.share({ title: currentSong.title, text: message });
        } else {
          Alert.alert("Chia sẻ bài hát", message);
        }
      } else {
        Alert.alert("Chia sẻ bài hát", message);
      }
    } catch {
      Alert.alert("Chia sẻ", message);
    }
  };

  if (!currentSong) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Ionicons name="musical-notes-outline" size={64} color={Colors.dark.textMuted} />
        <Text style={{ color: Colors.dark.text, marginTop: 16, fontSize: 16 }}>
          Chưa có bài hát nào đang phát.
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginTop: 24, paddingVertical: 10, paddingHorizontal: 24, backgroundColor: Colors.dark.primary, borderRadius: 20 }}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleRepeatToggle = () => {
    if (repeatMode === "off") setRepeatMode("queue");
    else if (repeatMode === "queue") setRepeatMode("track");
    else setRepeatMode("off");
  };

  const getRepeatIcon = () => {
    if (repeatMode === "track") return "repeat-outline";
    return "repeat";
  };

  const artistNames = currentSong.artists?.map((a) => a.name).join(", ") || "Unknown Artist";

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="chevron-down" size={30} color={Colors.dark.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerSubtitle}>Đang phát từ danh sách</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {currentSong.album?.title || "Waifu Anime Mix"}
          </Text>
        </View>
        <TouchableOpacity style={styles.headerBtn} onPress={handleShare}>
          <Ionicons name="share-social-outline" size={22} color={Colors.dark.text} />
        </TouchableOpacity>
      </View>

      {/* Main Content: Vinyl Artwork or Lyrics */}
      <View style={styles.centerContainer}>
        {showLyrics ? (
          <View style={styles.lyricsContainer}>
            <Text style={styles.lyricsBadge}>LỜI BÀI HÁT (KARAOKE)</Text>
            <Text style={styles.lyricsLineActive}>♪ {currentSong.title} ♪</Text>
            <Text style={styles.lyricsLine}>Anime vibes and melodious beats...</Text>
            <Text style={styles.lyricsLineActive}>Giai điệu waifu du dương ngân vang trong tâm trí</Text>
            <Text style={styles.lyricsLine}>Từng nốt nhạc hòa cùng đam mê vô tận ✨</Text>
            <Text style={styles.lyricsLine}>Feel the anime energy together!</Text>
          </View>
        ) : (
          <View style={styles.vinylWrapper}>
            {/* Spinning Vinyl Record Disc */}
            <Animated.View style={[styles.vinylDisc, animatedVinylStyle]}>
              {/* Disc Grooves */}
              <View style={styles.vinylRing1} />
              <View style={styles.vinylRing2} />
              {/* Center Artwork */}
              {currentSong.coverUrl ? (
                <Image source={{ uri: currentSong.coverUrl }} style={styles.vinylCenterImg} />
              ) : (
                <View style={[styles.vinylCenterImg, styles.artworkFallback]}>
                  <Ionicons name="musical-note" size={50} color={Colors.dark.primary} />
                </View>
              )}
              {/* Center Spindle Hole */}
              <View style={styles.spindleHole} />
            </Animated.View>
          </View>
        )}
      </View>

      {/* Song Info & Controls */}
      <View style={styles.infoContainer}>
        <View style={styles.titleRow}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={styles.title} numberOfLines={1}>
              {currentSong.title}
            </Text>
            <Text style={styles.artist} numberOfLines={1}>
              {artistNames}
            </Text>
          </View>
          <TouchableOpacity onPress={toggleLike} style={styles.heartBtn} activeOpacity={0.7}>
            <Ionicons
              name={isLiked ? "heart" : "heart-outline"}
              size={28}
              color={isLiked ? Colors.dark.secondary : Colors.dark.text}
            />
          </TouchableOpacity>
        </View>

        {/* Progress Bar with times */}
        <ProgressBar
          position={position}
          duration={duration || currentSong.duration}
          onSeek={(val) => seekTo(val)}
        />

        {/* Playback Controls */}
        <View style={styles.controlsRow}>
          <TouchableOpacity onPress={toggleShuffle} style={styles.ctrlSubBtn}>
            <Ionicons
              name="shuffle"
              size={24}
              color={shuffleEnabled ? Colors.dark.primary : Colors.dark.textMuted}
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={playPrev} style={styles.ctrlSubBtn}>
            <Ionicons name="play-skip-back" size={32} color={Colors.dark.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.playBtn}
            onPress={() => setPlaying(!isPlaying)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isPlaying ? "pause" : "play"}
              size={36}
              color="#fff"
              style={{ marginLeft: isPlaying ? 0 : 3 }}
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={playNext} style={styles.ctrlSubBtn}>
            <Ionicons name="play-skip-forward" size={32} color={Colors.dark.text} />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleRepeatToggle} style={styles.ctrlSubBtn}>
            <Ionicons
              name={getRepeatIcon()}
              size={24}
              color={repeatMode !== "off" ? Colors.dark.primary : Colors.dark.textMuted}
            />
            {repeatMode === "track" && (
              <View style={styles.repeatBadge}>
                <Text style={styles.repeatBadgeText}>1</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Bottom Utility Row: Lyrics toggle & Queue button */}
        <View style={styles.bottomUtilsRow}>
          <TouchableOpacity
            style={[styles.utilPill, showLyrics && styles.utilPillActive]}
            onPress={() => setShowLyrics(!showLyrics)}
          >
            <Ionicons
              name="document-text-outline"
              size={18}
              color={showLyrics ? "#fff" : Colors.dark.textMuted}
            />
            <Text style={[styles.utilPillText, showLyrics && styles.utilPillTextActive]}>
              Lời bài hát
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.utilPill}
            onPress={() => setShowQueue(true)}
          >
            <Ionicons name="list" size={18} color={Colors.dark.textMuted} />
            <Text style={styles.utilPillText}>
              Danh sách chờ ({queue.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Queue Modal Sheet */}
      <Modal
        visible={showQueue}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowQueue(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Danh Sách Chờ Phát 📑</Text>
              <TouchableOpacity onPress={() => setShowQueue(false)}>
                <Ionicons name="close-circle" size={26} color={Colors.dark.textMuted} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={queue}
              keyExtractor={(item, idx) => `${item.id}-${idx}`}
              contentContainerStyle={{ paddingBottom: 24 }}
              renderItem={({ item, index }) => {
                const isCurrent = currentSong?.id === item.id;
                return (
                  <TouchableOpacity
                    style={[styles.queueItem, isCurrent && styles.queueItemActive]}
                    onPress={() => {
                      setCurrentSong(item);
                      setShowQueue(false);
                    }}
                  >
                    <Text style={[styles.queueIndex, isCurrent && { color: Colors.dark.primary }]}>
                      {index + 1}
                    </Text>
                    {item.coverUrl ? (
                      <Image source={{ uri: item.coverUrl }} style={styles.queueCover} />
                    ) : (
                      <View style={[styles.queueCover, styles.artworkFallback]}>
                        <Ionicons name="musical-note" size={14} color={Colors.dark.primary} />
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[styles.queueTitle, isCurrent && { color: Colors.dark.primary }]}
                        numberOfLines={1}
                      >
                        {item.title}
                      </Text>
                      <Text style={styles.queueArtist} numberOfLines={1}>
                        {item.artists?.map((a) => a.name).join(", ") || "Unknown"}
                      </Text>
                    </View>
                    <Text style={styles.queueDuration}>{formatDuration(item.duration)}</Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.playerBg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerBtn: {
    padding: 8,
    width: 44,
    alignItems: "center",
  },
  headerCenter: {
    alignItems: "center",
    flex: 1,
  },
  headerSubtitle: {
    fontSize: 11,
    color: Colors.dark.primaryLight,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.dark.text,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  vinylWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  vinylDisc: {
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "#111116",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.dark.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 3,
    borderColor: "#2a2a35",
  },
  vinylRing1: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  vinylRing2: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  vinylCenterImg: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: "#181820",
  },
  artworkFallback: {
    backgroundColor: Colors.dark.card,
    alignItems: "center",
    justifyContent: "center",
  },
  spindleHole: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.dark.playerBg,
    borderWidth: 2,
    borderColor: "#333",
  },
  lyricsContainer: {
    backgroundColor: "rgba(22, 22, 34, 0.75)",
    padding: 24,
    borderRadius: 20,
    width: "100%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  lyricsBadge: {
    fontSize: 10,
    fontWeight: "bold",
    color: Colors.dark.primaryLight,
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  lyricsLineActive: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.dark.primary,
    textAlign: "center",
    marginVertical: 8,
  },
  lyricsLine: {
    fontSize: 14,
    color: Colors.dark.textMuted,
    textAlign: "center",
    marginVertical: 6,
  },
  infoContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: Colors.dark.text,
    marginBottom: 4,
  },
  artist: {
    fontSize: 15,
    color: Colors.dark.textMuted,
  },
  heartBtn: {
    padding: 8,
  },
  controlsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 16,
    paddingHorizontal: 6,
  },
  ctrlSubBtn: {
    padding: 10,
    position: "relative",
  },
  playBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.dark.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.dark.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  repeatBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: Colors.dark.primary,
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: "center",
    alignItems: "center",
  },
  repeatBadgeText: {
    color: "#fff",
    fontSize: 8,
    fontWeight: "bold",
  },
  bottomUtilsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginTop: 4,
  },
  utilPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  utilPillActive: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
  },
  utilPillText: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    fontWeight: "600",
  },
  utilPillTextActive: {
    color: "#fff",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.dark.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "75%",
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.dark.text,
  },
  queueItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 10,
  },
  queueItemActive: {
    backgroundColor: Colors.dark.card,
  },
  queueIndex: {
    width: 24,
    fontSize: 13,
    fontWeight: "600",
    color: Colors.dark.textMuted,
    textAlign: "center",
    marginRight: 8,
  },
  queueCover: {
    width: 38,
    height: 38,
    borderRadius: 6,
    marginRight: 10,
  },
  queueTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.dark.text,
    marginBottom: 2,
  },
  queueArtist: {
    fontSize: 12,
    color: Colors.dark.textMuted,
  },
  queueDuration: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    marginLeft: 8,
  },
});
