import React, { useEffect, useState, useRef } from "react";
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
  TextInput,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/colors";
import { usePlayerStore } from "../../store/playerStore";
import { useAuthStore } from "../../store/authStore";
import { SafeAreaView } from "react-native-safe-area-context";
import { ProgressBar } from "../../features/player/components/ProgressBar";
import { WaveformVisualizer } from "../../features/player/components/WaveformVisualizer";
import { api } from "../../services/api";
import Slider from "@react-native-community/slider";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  withRepeat,
  cancelAnimation,
} from "react-native-reanimated";
import type { Song, SongCopyright } from "@waifu-player/types";
import { formatDuration } from "@waifu-player/utils";
import { GiftModal } from "../../features/gifts/GiftModal";

interface LyricLine {
  time: number; // seconds
  text: string;
}

function parseLyrics(lyricsText: string | null | undefined, songDuration: number): LyricLine[] {
  if (!lyricsText || lyricsText.trim().length === 0) {
    return [];
  }

  const lines = lyricsText.split("\n").filter((l) => l.trim().length > 0);
  const result: LyricLine[] = [];
  const lrcRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;

  let hasLrcTiming = false;
  lines.forEach((line) => {
    const match = line.match(lrcRegex);
    if (match) {
      hasLrcTiming = true;
      const min = parseInt(match[1], 10);
      const sec = parseInt(match[2], 10);
      const timeInSec = min * 60 + sec;
      result.push({ time: timeInSec, text: match[4].trim() });
    }
  });

  if (hasLrcTiming && result.length > 0) {
    return result.sort((a, b) => a.time - b.time);
  }

  const step = Math.max(3, (songDuration || 180) / lines.length);
  return lines.map((line, idx) => ({
    time: Math.floor(idx * step),
    text: line.trim(),
  }));
}

export default function SongDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isAuthenticated, user } = useAuthStore();
  const [showQueue, setShowQueue] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [showWaveform, setShowWaveform] = useState(true);
  const [showSpeedModal, setShowSpeedModal] = useState(false);
  const [showSleepTimerModal, setShowSleepTimerModal] = useState(false);
  const [showVolumeBar, setShowVolumeBar] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [queueAdded, setQueueAdded] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);

  // Synced Lyrics from Online API / Database
  const [lrcText, setLrcText] = useState<string | null>(null);
  const [loadingLrc, setLoadingLrc] = useState<boolean>(false);

  // Copyright and Claim States
  const [showCopyrightModal, setShowCopyrightModal] = useState(false);
  const [copyrightData, setCopyrightData] = useState<SongCopyright | null>(null);
  const [loadingCopyright, setLoadingCopyright] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimReason, setClaimReason] = useState("");
  const [claimDescription, setClaimDescription] = useState("");
  const [claimEvidence, setClaimEvidence] = useState("");
  const [claimType, setClaimType] = useState<string>("UNAUTHORIZED_REPOST");
  const [submittingClaim, setSubmittingClaim] = useState(false);

  // Edit Audio Modal States
  const [showEditAudioModal, setShowEditAudioModal] = useState(false);
  const [editAudioUrl, setEditAudioUrl] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editLyricsText, setEditLyricsText] = useState("");
  const [submittingEditAudio, setSubmittingEditAudio] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

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
    volume,
    isMuted,
    setVolume,
    toggleMute,
    playbackRate,
    setRate,
    sleepTimerMinutes,
    sleepTimerEndTime,
    setSleepTimer,
    addToQueue,
  } = usePlayerStore();

  const rotation = useSharedValue(0);
  const lyricsScrollViewRef = useRef<ScrollView>(null);

  // Fetch online LRC Synced Lyrics automatically if not present in DB
  useEffect(() => {
    if (!currentSong) return;
    if (currentSong.lyrics) {
      setLrcText(currentSong.lyrics);
      setLoadingLrc(false);
      return;
    }
    setLrcText(null);
    setLoadingLrc(false);
  }, [currentSong?.id, currentSong?.lyrics]);

  useEffect(() => {
    if (id && id !== "current" && currentSong?.id !== id) {
      const found = queue.find((s) => s.id === id);
      if (found) {
        setCurrentSong(found);
      } else {
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
    if (!currentSong) return;
    setIsLiked(!!currentSong.isLiked);

    const { useAuthStore } = require("../../store/authStore");
    const { isAuthenticated } = useAuthStore.getState();
    if (isAuthenticated) {
      api
        .get("/api/v1/users/me/liked")
        .then((res) => {
          if (res.data?.success && Array.isArray(res.data.data)) {
            const isSongLiked = res.data.data.some(
              (item: any) => item.id === currentSong.id || item.songId === currentSong.id || item.song?.id === currentSong.id
            );
            setIsLiked(isSongLiked);
            setCurrentSong({ ...currentSong, isLiked: isSongLiked });
          }
        })
        .catch(() => {});
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

  const parsedLyrics = parseLyrics(lrcText, duration || currentSong?.duration || 180);

  let activeLyricIndex = 0;
  for (let i = 0; i < parsedLyrics.length; i++) {
    if (position >= parsedLyrics[i].time) {
      activeLyricIndex = i;
    } else {
      break;
    }
  }

  const toggleLike = async () => {
    if (!currentSong) return;

    const { useAuthStore } = require("../../store/authStore");
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      const msg = "Vui lòng đăng nhập để lưu bài hát vào danh sách Yêu thích!";
      try {
        const { useToastStore } = require("../../store/toastStore");
        useToastStore.getState().showWarning("Yêu cầu đăng nhập 🔒", msg);
      } catch {}
      router.push("/(auth)/login" as any);
      return;
    }

    const newLiked = !isLiked;
    setIsLiked(newLiked);
    setCurrentSong({ ...currentSong, isLiked: newLiked });

    try {
      const res = await api.post(`/api/v1/songs/${currentSong.id}/like`);
      if (res.data?.success && typeof res.data?.data?.liked === "boolean") {
        const actualLiked = res.data.data.liked;
        setIsLiked(actualLiked);
        setCurrentSong({ ...currentSong, isLiked: actualLiked });
        const { useToastStore } = require("../../store/toastStore");
        if (actualLiked) {
          useToastStore.getState().showSuccess("Yêu thích 💖", `Đã thêm "${currentSong.title}" vào danh sách yêu thích.`);
        } else {
          useToastStore.getState().showInfo("Đã hủy thích 💔", `Đã gỡ "${currentSong.title}" khỏi danh sách yêu thích.`);
        }
      }
    } catch (err: any) {
      setIsLiked(!newLiked);
      setCurrentSong({ ...currentSong, isLiked: !newLiked });
      const msg = err.response?.data?.error || err.response?.data?.message || "Không thể cập nhật bài hát yêu thích";
      try {
        const { useToastStore } = require("../../store/toastStore");
        useToastStore.getState().showError("Lỗi yêu thích", msg);
      } catch {}
    }
  };

  const handleShare = async () => {
    if (!currentSong) return;
    const message = `🎵 Đang nghe "${currentSong.title}" bởi ${
      currentSong.artists?.map((a) => a.name).join(", ") || "Unknown"
    } trên Waifu Player!`;
    try {
      if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(message);
        const { useToastStore } = require("../../store/toastStore");
        useToastStore.getState().showSuccess("Chia sẻ bài hát 🔗", "Đã sao chép liên kết vào bộ nhớ tạm!");
      } else {
        const { useToastStore } = require("../../store/toastStore");
        useToastStore.getState().showSuccess("Chia sẻ bài hát 🔗", message);
      }
    } catch {
      const { useToastStore } = require("../../store/toastStore");
      useToastStore.getState().showInfo("Chia sẻ bài hát", message);
    }
  };

  const handleOpenCopyrightModal = async () => {
    if (!currentSong) return;
    setShowCopyrightModal(true);
    setLoadingCopyright(true);
    try {
      const res = await api.get(`/api/v1/copyright/songs/${currentSong.id}`);
      if (res.data?.success && res.data?.data) {
        setCopyrightData(res.data.data);
      }
    } catch {
      setCopyrightData({
        id: "default",
        songId: currentSong.id,
        ownerName: currentSong.artists?.map((a) => a.name).join(", ") || "Waifu Music Studio",
        licenseType: "ALL_RIGHTS_RESERVED",
        isrc: `VN-WFP-2026-${currentSong.id.slice(0, 5).toUpperCase()}`,
        copyrightYear: new Date().getFullYear(),
        distributionRights: "GLOBAL",
        commercialUse: false,
        allowRemix: false,
        status: "ACTIVE",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } finally {
      setLoadingCopyright(false);
    }
  };

  const handleSubmitClaim = async () => {
    if (!currentSong) return;

    if (!isAuthenticated) {
      Alert.alert(
        "Yêu cầu đăng nhập 🔒",
        "Bạn cần đăng nhập tài khoản để gửi đơn khiếu nại bản quyền và theo dõi tiến độ xử lý của Ban quản trị.",
        [
          {
            text: "Đăng nhập ngay",
            onPress: () => {
              setShowClaimModal(false);
              router.push("/(auth)/login");
            },
          },
          { text: "Để sau", style: "cancel" },
        ]
      );
      try {
        const { useToastStore } = require("../../store/toastStore");
        useToastStore.getState().showWarning("Cần đăng nhập", "Vui lòng đăng nhập để gửi khiếu nại bản quyền.");
      } catch {}
      return;
    }

    const reasonText = claimReason.trim() || `Khiếu nại bản quyền: ${claimType}`;
    if (reasonText.length < 2) {
      Alert.alert("Lỗi", "Vui lòng nhập lý do khiếu nại.");
      return;
    }
    const descText = claimDescription.trim();
    if (descText.length < 3) {
      Alert.alert("Lỗi", "Vui lòng mô tả chi tiết vi phạm (tối thiểu 3 ký tự).");
      return;
    }

    setSubmittingClaim(true);
    try {
      let proof = claimEvidence.trim();
      if (proof && !proof.startsWith("http://") && !proof.startsWith("https://")) {
        proof = "https://" + proof;
      }

      const payload: { songId: string; reason: string; description: string; proofUrl?: string } = {
        songId: currentSong.id,
        reason: reasonText,
        description: descText,
      };
      if (proof) {
        payload.proofUrl = proof;
      }

      const res = await api.post("/api/v1/copyright/claims", payload);

      if (res.data?.success) {
        try {
          const { useToastStore } = require("../../store/toastStore");
          useToastStore.getState().showSuccess("Gửi khiếu nại thành công! ⚖️", "Ban quản trị Waifu Player sẽ thẩm định đơn trong vòng 24h.");
        } catch {}
        Alert.alert(
          "Gửi khiếu nại thành công! ⚖️",
          "Đơn khiếu nại bản quyền của bạn đã được ghi nhận. Ban quản trị sẽ thẩm định trong vòng 24h."
        );
        setShowClaimModal(false);
        setClaimReason("");
        setClaimDescription("");
        setClaimEvidence("");
      } else {
        const errorMsg = res.data?.message || res.data?.error || "Không thể gửi khiếu nại.";
        Alert.alert("Thông báo", errorMsg);
        try {
          const { useToastStore } = require("../../store/toastStore");
          useToastStore.getState().showError("Gửi khiếu nại thất bại", errorMsg);
        } catch {}
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Đã xảy ra lỗi khi gửi khiếu nại bản quyền.";
      Alert.alert("Lỗi gửi khiếu nại", msg);
      try {
        const { useToastStore } = require("../../store/toastStore");
        useToastStore.getState().showError("Lỗi gửi khiếu nại ⚠️", msg);
      } catch {}
    } finally {
      setSubmittingClaim(false);
    }
  };

  const handleOpenEditAudioModal = () => {
    if (!currentSong) return;
    setEditAudioUrl(currentSong.fileUrl || "");
    setEditTitle(currentSong.title || "");
    setEditLyricsText(currentSong.lyrics || lrcText || "");
    setShowEditAudioModal(true);
  };

  const handleSaveEditAudio = async () => {
    if (!currentSong) return;
    if (!editAudioUrl.trim()) {
      try {
        const { useToastStore } = require("../../store/toastStore");
        useToastStore.getState().showWarning("Thiếu thông tin", "Vui lòng nhập đường dẫn URL âm thanh MP3 hoặc chọn preset.");
      } catch {}
      return;
    }
    setSubmittingEditAudio(true);
    try {
      const res = await api.patch(`/api/v1/songs/${currentSong.id}`, {
        title: editTitle.trim() || currentSong.title,
        fileUrl: editAudioUrl.trim(),
        lyrics: editLyricsText.trim() || undefined,
      });
      if (res.data?.success && res.data?.data) {
        const updated = res.data.data;
        setCurrentSong(updated);
        setLrcText(updated.lyrics || null);
        setShowEditAudioModal(false);
        try {
          const { useToastStore } = require("../../store/toastStore");
          useToastStore.getState().showSuccess("Cập nhật thành công 🎉", "Đã cập nhật bài hát và chuyển đổi file âm thanh!");
        } catch {}
        if (isPlaying) {
          setPlaying(false);
          setTimeout(() => setPlaying(true), 400);
        }
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.error || err.response?.data?.message || "Không thể cập nhật bài hát.";
      try {
        const { useToastStore } = require("../../store/toastStore");
        useToastStore.getState().showError("Lỗi cập nhật", msg);
      } catch {}
    } finally {
      setSubmittingEditAudio(false);
    }
  };

  const handlePickAndUploadAudio = () => {
    if (Platform.OS === "web") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "audio/*";
      input.onchange = async (e: any) => {
        const file = e.target?.files?.[0];
        if (!file) return;
        setUploadingFile(true);
        try {
          const formData = new FormData();
          formData.append("file", file);
          const res = await api.post("/api/v1/creator/upload/audio", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          if (res.data?.success && res.data?.data?.fileUrl) {
            setEditAudioUrl(res.data.data.fileUrl);
            try {
              const { useToastStore } = require("../../store/toastStore");
              useToastStore.getState().showSuccess("Tải lên thành công 🎧", "File âm thanh đã được tải lên máy chủ!");
            } catch {}
          }
        } catch {
          try {
            const { useToastStore } = require("../../store/toastStore");
            useToastStore.getState().showError("Lỗi tải tệp", "Không thể tải lên file âm thanh. Vui lòng kiểm tra định dạng.");
          } catch {}
        } finally {
          setUploadingFile(false);
        }
      };
      input.click();
    } else {
      try {
        const { useToastStore } = require("../../store/toastStore");
        useToastStore.getState().showInfo("Hướng dẫn", "Vui lòng dán trực tiếp link file audio MP3.");
      } catch {}
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

  const handleAddToPlayLater = () => {
    if (!currentSong) return;
    addToQueue(currentSong);
    setQueueAdded(true);
    setTimeout(() => setQueueAdded(false), 2500);
  };

  const handleRepeatToggle = () => {
    if (repeatMode === "off") setRepeatMode("queue");
    else if (repeatMode === "queue") setRepeatMode("track");
    else setRepeatMode("off");
  };

  const getRepeatIcon = () => {
    if (repeatMode === "track") return "repeat-outline";
    return "repeat";
  };

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) return "volume-mute";
    if (volume < 0.4) return "volume-low";
    if (volume < 0.8) return "volume-medium";
    return "volume-high";
  };

  const artistNames = currentSong.artists?.map((a) => a.name).join(", ") || "Unknown Artist";
  const hasLyrics = !!currentSong.lyrics && currentSong.lyrics.trim().length > 0;

  let sleepTimerRemainingText = "";
  if (sleepTimerEndTime) {
    const diffSec = Math.max(0, Math.floor((sleepTimerEndTime - Date.now()) / 1000));
    const mins = Math.floor(diffSec / 60);
    const secs = diffSec % 60;
    sleepTimerRemainingText = `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  }

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

      {/* Main Content: Vinyl Artwork or Synced Karaoke Lyrics */}
      <View style={styles.centerContainer}>
        {showLyrics ? (
          <View style={styles.lyricsContainer}>
            {hasLyrics ? (
              <>
                <View style={styles.lyricsHeaderRow}>
                  <Ionicons name="sparkles" size={16} color={Colors.dark.primaryLight} />
                  <Text style={styles.lyricsBadge}>LỜI BÀI HÁT KARAOKE ĐỒNG BỘ</Text>
                  <Ionicons name="sparkles" size={16} color={Colors.dark.primaryLight} />
                </View>

                {loadingLrc ? (
                  <View style={{ paddingVertical: 30, alignItems: "center" }}>
                    <ActivityIndicator color={Colors.dark.primary} size="small" />
                    <Text style={{ color: Colors.dark.textMuted, fontSize: 12, marginTop: 8 }}>
                      Tự động tra cứu lời bài hát chuẩn...
                    </Text>
                  </View>
                ) : (
                  <ScrollView
                    ref={lyricsScrollViewRef}
                    style={{ width: "100%", maxHeight: 260 }}
                    contentContainerStyle={{ alignItems: "center", paddingVertical: 12 }}
                    showsVerticalScrollIndicator={false}
                  >
                    {parsedLyrics.map((line, idx) => {
                      const isActive = idx === activeLyricIndex;
                      return (
                        <TouchableOpacity
                          key={idx}
                          onPress={() => seekTo(line.time)}
                          activeOpacity={0.8}
                          style={[styles.lyricLineBox, isActive && styles.lyricLineBoxActive]}
                        >
                          <Text style={[styles.lyricsLine, isActive && styles.lyricsLineActive]}>
                            {line.text}
                          </Text>
                          {isActive && <View style={styles.lyricActiveDot} />}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}
              </>
            ) : (
              <View style={styles.instrumentalContainer}>
                <View style={styles.instrumentalIconCircle}>
                  <Ionicons name="musical-notes" size={32} color="#22d3ee" />
                </View>
                <Text style={styles.instrumentalTitle}>BẢN NHẠC KHÔNG LỜI (INSTRUMENTAL)</Text>
                <Text style={styles.instrumentalSub}>
                  Giai điệu thuần nhạc cụ / EDM Beat. Tác phẩm không có lời hát.
                </Text>
                <View style={{ width: "90%", marginVertical: 10, alignItems: "center" }}>
                  <WaveformVisualizer isPlaying={isPlaying} progress={duration > 0 ? position / duration : 0} />
                </View>
                <Text style={styles.instrumentalQuote}>
                  "Thả lỏng tâm trí và tận hưởng từng nốt nhạc thuần khiết ✨"
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.vinylWrapper}>
            <Animated.View style={[styles.vinylDisc, animatedVinylStyle]}>
              <View style={styles.vinylRing1} />
              <View style={styles.vinylRing2} />
              {currentSong.coverUrl ? (
                <Image source={{ uri: currentSong.coverUrl }} style={styles.vinylCenterImg} />
              ) : (
                <View style={[styles.vinylCenterImg, styles.artworkFallback]}>
                  <Ionicons name="musical-note" size={50} color={Colors.dark.primary} />
                </View>
              )}
              <View style={styles.spindleHole} />
            </Animated.View>

            {/* WV Âm Nhạc – Dynamic Waveform Visualizer */}
            <WaveformVisualizer
              isPlaying={isPlaying}
              progress={duration > 0 ? position / duration : 0}
              style={{ marginTop: 16 }}
            />
          </View>
        )}
      </View>

      {/* Song Info & Controls */}
      <View style={styles.infoContainer}>
        {/* Draggable Compact Volume Slider Bar */}
        {showVolumeBar && (
          <View style={styles.compactVolumeBar}>
            <TouchableOpacity onPress={toggleMute} style={{ padding: 4 }}>
              <Ionicons name={getVolumeIcon()} size={20} color={Colors.dark.primaryLight} />
            </TouchableOpacity>
            <Slider
              style={styles.volumeSlider}
              value={isMuted ? 0 : volume}
              minimumValue={0}
              maximumValue={1}
              step={0.01}
              onValueChange={(val) => setVolume(val)}
              minimumTrackTintColor={Colors.dark.primary}
              maximumTrackTintColor={Colors.dark.border}
              thumbTintColor={Colors.dark.primaryLight}
            />
            <Text style={styles.miniVolText}>
              {isMuted ? "0%" : `${Math.round(volume * 100)}%`}
            </Text>
          </View>
        )}

        {/* Title, Artist & Controls */}
        <View style={styles.titleRow}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={styles.title} numberOfLines={1}>
                {currentSong.title}
              </Text>
              {hasLyrics ? (
                <View style={styles.vocalBadgeDetail}>
                  <Ionicons name="mic" size={10} color={Colors.dark.primaryLight} />
                  <Text style={styles.vocalBadgeDetailText}>Có Lời</Text>
                </View>
              ) : (
                <View style={styles.instrumentalBadgeDetail}>
                  <Ionicons name="musical-notes" size={10} color="#22d3ee" />
                  <Text style={styles.instrumentalBadgeDetailText}>Không Lời</Text>
                </View>
              )}
            </View>
            <Text style={styles.artist} numberOfLines={1}>
              {artistNames}
            </Text>
          </View>

          {/* Compact Speaker Icon Toggle */}
          <TouchableOpacity
            onPress={() => setShowVolumeBar(!showVolumeBar)}
            style={styles.speakerIconBtn}
          >
            <Ionicons
              name={getVolumeIcon()}
              size={22}
              color={showVolumeBar ? Colors.dark.primary : Colors.dark.primaryLight}
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setShowGiftModal(true)} style={styles.giftIconBtn} activeOpacity={0.7}>
            <Text style={{ fontSize: 24 }}>🎁</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={toggleLike} style={styles.heartBtn} activeOpacity={0.7}>
            <Ionicons
              name={isLiked ? "heart" : "heart-outline"}
              size={28}
              color={isLiked ? Colors.dark.secondary : Colors.dark.text}
            />
          </TouchableOpacity>
        </View>

        {/* WV Mini – waveform nhỏ phía trên progress bar khi ở dưới */}
        {showWaveform && !showLyrics && (
          <View style={styles.waveformMiniContainer}>
            <WaveformVisualizer
              isPlaying={isPlaying}
              progress={duration > 0 ? position / duration : 0}
            />
          </View>
        )}

        <ProgressBar
          position={position}
          duration={duration || currentSong.duration}
          onSeek={(val) => seekTo(val)}
        />

        {/* Main Playback Controls */}
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

        {/* Bottom Utility Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.bottomUtilsRow}
        >
          {/* Nút Tặng quà Anime */}
          <TouchableOpacity
            style={[styles.utilPill, { borderColor: "#f59e0b", backgroundColor: "rgba(245, 158, 11, 0.15)" }]}
            onPress={() => setShowGiftModal(true)}
          >
            <Text style={{ fontSize: 16 }}>🎁</Text>
            <Text style={[styles.utilPillText, { color: "#f59e0b", fontWeight: "800" }]}>
              Tặng quà
            </Text>
          </TouchableOpacity>

          {/* WV Âm nhạc toggle pill */}
          <TouchableOpacity
            style={[styles.utilPill, showWaveform && styles.utilPillWave]}
            onPress={() => setShowWaveform(!showWaveform)}
          >
            <Ionicons
              name="pulse-outline"
              size={18}
              color={showWaveform ? "#fff" : Colors.dark.textMuted}
            />
            <Text style={[styles.utilPillText, showWaveform && styles.utilPillTextActive]}>
              WV Âm nhạc
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.utilPill, showLyrics && styles.utilPillActive]}
            onPress={() => setShowLyrics(!showLyrics)}
          >
            <Ionicons
              name={hasLyrics ? "document-text-outline" : "musical-notes-outline"}
              size={18}
              color={showLyrics ? "#fff" : hasLyrics ? Colors.dark.textMuted : "#22d3ee"}
            />
            <Text style={[styles.utilPillText, showLyrics && styles.utilPillTextActive]}>
              {hasLyrics ? "Lời bài hát" : "Không lời 🎵"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.utilPill, playbackRate !== 1.0 && styles.utilPillActive]}
            onPress={() => setShowSpeedModal(true)}
          >
            <Ionicons
              name="flash-outline"
              size={18}
              color={playbackRate !== 1.0 ? "#fff" : Colors.dark.textMuted}
            />
            <Text style={[styles.utilPillText, playbackRate !== 1.0 && styles.utilPillTextActive]}>
              {playbackRate === 1.25 ? "⚡ Nightcore 1.25x" : `${playbackRate}x`}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.utilPill, sleepTimerMinutes !== null && styles.utilPillActive]}
            onPress={() => setShowSleepTimerModal(true)}
          >
            <Ionicons
              name="moon-outline"
              size={18}
              color={sleepTimerMinutes !== null ? "#fff" : Colors.dark.textMuted}
            />
            <Text style={[styles.utilPillText, sleepTimerMinutes !== null && styles.utilPillTextActive]}>
              {sleepTimerMinutes !== null ? `🌙 ${sleepTimerRemainingText || `${sleepTimerMinutes}m`}` : "Hẹn giờ"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.utilPill} onPress={() => setShowQueue(true)}>
            <Ionicons name="list" size={18} color={Colors.dark.textMuted} />
            <Text style={styles.utilPillText}>Danh sách ({queue.length})</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.utilPill, queueAdded && styles.utilPillActive]}
            onPress={handleAddToPlayLater}
            activeOpacity={0.7}
          >
            <Ionicons
              name={queueAdded ? "checkmark-circle" : "time-outline"}
              size={18}
              color={queueAdded ? "#10b981" : Colors.dark.textMuted}
            />
            <Text style={[styles.utilPillText, queueAdded && { color: "#10b981", fontWeight: "700" }]}>
              {queueAdded ? "Đã thêm phát sau" : "Phát sau"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.utilPill} onPress={handleOpenCopyrightModal}>
            <Ionicons name="shield-checkmark" size={18} color={Colors.dark.primaryLight} />
            <Text style={styles.utilPillText}>Bản quyền</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.utilPill, { borderColor: Colors.dark.primary }]} onPress={handleOpenEditAudioModal}>
            <Ionicons name="musical-notes" size={18} color={Colors.dark.primary} />
            <Text style={[styles.utilPillText, { color: Colors.dark.primaryLight, fontWeight: "700" }]}>Đổi Nhạc</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Playback Speed Modal */}
      <Modal
        visible={showSpeedModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSpeedModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons name="flash" size={22} color={Colors.dark.primary} />
                <Text style={styles.modalTitle}>Tốc Độ Phát Nhạc ⚡</Text>
              </View>
              <TouchableOpacity onPress={() => setShowSpeedModal(false)}>
                <Ionicons name="close-circle" size={26} color={Colors.dark.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 10, paddingVertical: 10 }}>
              {[
                { rate: 0.75, label: "Slowed & Reverb (0.75x)", icon: "turtle" },
                { rate: 1.0, label: "Bình thường (1.0x)", icon: "play" },
                { rate: 1.25, label: "Nightcore Anime (1.25x)", icon: "flash" },
                { rate: 1.5, label: "Nhanh (1.5x)", icon: "rocket" },
                { rate: 2.0, label: "Siêu nhanh (2.0x)", icon: "sparkles" },
              ].map((item) => (
                <TouchableOpacity
                  key={item.rate}
                  style={[
                    styles.speedOptionRow,
                    playbackRate === item.rate && styles.speedOptionRowActive,
                  ]}
                  onPress={() => {
                    setRate(item.rate);
                    setShowSpeedModal(false);
                  }}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={20}
                    color={playbackRate === item.rate ? Colors.dark.primary : Colors.dark.textMuted}
                  />
                  <Text
                    style={[
                      styles.speedOptionText,
                      playbackRate === item.rate && styles.speedOptionTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {playbackRate === item.rate && (
                    <Ionicons name="checkmark-circle" size={20} color={Colors.dark.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Sleep Timer Modal */}
      <Modal
        visible={showSleepTimerModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSleepTimerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons name="moon" size={22} color={Colors.dark.secondary} />
                <Text style={styles.modalTitle}>Hẹn Giờ Tắt Nhạc 🌙</Text>
              </View>
              <TouchableOpacity onPress={() => setShowSleepTimerModal(false)}>
                <Ionicons name="close-circle" size={26} color={Colors.dark.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 10, paddingVertical: 10 }}>
              {[
                { minutes: null, label: "Tắt hẹn giờ" },
                { minutes: 15, label: "Sau 15 phút" },
                { minutes: 30, label: "Sau 30 phút" },
                { minutes: 45, label: "Sau 45 phút" },
                { minutes: 60, label: "Sau 1 giờ (60 phút)" },
              ].map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.speedOptionRow,
                    sleepTimerMinutes === item.minutes && styles.speedOptionRowActive,
                  ]}
                  onPress={() => {
                    setSleepTimer(item.minutes);
                    setShowSleepTimerModal(false);
                  }}
                >
                  <Ionicons
                    name="timer-outline"
                    size={20}
                    color={
                      sleepTimerMinutes === item.minutes
                        ? Colors.dark.secondary
                        : Colors.dark.textMuted
                    }
                  />
                  <Text
                    style={[
                      styles.speedOptionText,
                      sleepTimerMinutes === item.minutes && styles.speedOptionTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {sleepTimerMinutes === item.minutes && (
                    <Ionicons name="checkmark-circle" size={20} color={Colors.dark.secondary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

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

      {/* Copyright Certificate Modal */}
      <Modal
        visible={showCopyrightModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCopyrightModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: "85%" }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons name="shield-checkmark" size={22} color={Colors.dark.primaryLight} />
                <Text style={styles.modalTitle}>Bản Quyền & Giấy Phép</Text>
              </View>
              <TouchableOpacity onPress={() => setShowCopyrightModal(false)}>
                <Ionicons name="close-circle" size={26} color={Colors.dark.textMuted} />
              </TouchableOpacity>
            </View>

            {loadingCopyright ? (
              <View style={{ paddingVertical: 40, alignItems: "center" }}>
                <ActivityIndicator size="large" color={Colors.dark.primary} />
                <Text style={{ color: Colors.dark.textMuted, marginTop: 12 }}>
                  Đang tra cứu dữ liệu bản quyền...
                </Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                <View style={styles.copyrightBadgeWrap}>
                  <Ionicons name="ribbon-outline" size={18} color="#fff" />
                  <Text style={styles.copyrightBadgeText}>
                    {copyrightData?.status === "ACTIVE"
                      ? "ĐÃ XÁC THỰC BẢN QUYỀN HỢP PHÁP"
                      : "CHỨNG CHỈ BẢN QUYỀN TIÊU CHUẨN"}
                  </Text>
                </View>

                <View style={styles.copyrightCard}>
                  <Text style={styles.copyrightSongTitle}>{currentSong.title}</Text>
                  <Text style={styles.copyrightOwnerText}>
                    Chủ sở hữu: <Text style={{ color: Colors.dark.text, fontWeight: "700" }}>{copyrightData?.ownerName || artistNames}</Text>
                  </Text>
                  <Text style={styles.copyrightOwnerText}>
                    Mã chuẩn quốc tế (ISRC): <Text style={{ color: Colors.dark.primaryLight, fontWeight: "600" }}>{copyrightData?.isrc || "N/A"}</Text>
                  </Text>
                  <Text style={styles.copyrightOwnerText}>
                    Loại giấy phép: <Text style={{ color: Colors.dark.text, fontWeight: "700" }}>{copyrightData?.licenseType || "ALL_RIGHTS_RESERVED"}</Text>
                  </Text>
                  <Text style={styles.copyrightOwnerText}>
                    Năm phát hành tác quyền: <Text style={{ color: Colors.dark.text }}>{copyrightData?.copyrightYear || new Date().getFullYear()}</Text>
                  </Text>
                </View>

                <View style={styles.rightsGrid}>
                  <View style={styles.rightItem}>
                    <Ionicons
                      name={copyrightData?.distributionRights ? "checkmark-circle" : "close-circle"}
                      size={20}
                      color={copyrightData?.distributionRights ? "#10b981" : "#ef4444"}
                    />
                    <Text style={styles.rightLabel}>Quyền phát sóng</Text>
                    <Text style={styles.rightValue}>{copyrightData?.distributionRights || "GLOBAL"}</Text>
                  </View>

                  <View style={styles.rightItem}>
                    <Ionicons
                      name={copyrightData?.commercialUse ? "checkmark-circle" : "close-circle"}
                      size={20}
                      color={copyrightData?.commercialUse ? "#10b981" : "#ef4444"}
                    />
                    <Text style={styles.rightLabel}>Thương mại hóa</Text>
                    <Text style={styles.rightValue}>{copyrightData?.commercialUse ? "Cho phép" : "Cấm dùng"}</Text>
                  </View>

                  <View style={styles.rightItem}>
                    <Ionicons
                      name={copyrightData?.allowRemix ? "checkmark-circle" : "close-circle"}
                      size={20}
                      color={copyrightData?.allowRemix ? "#10b981" : "#ef4444"}
                    />
                    <Text style={styles.rightLabel}>Remix / Phái sinh</Text>
                    <Text style={styles.rightValue}>{copyrightData?.allowRemix ? "Cho phép" : "Cấm remix"}</Text>
                  </View>
                </View>

                <View style={styles.protectionNotice}>
                  <Ionicons name="information-circle" size={18} color={Colors.dark.textMuted} style={{ marginTop: 2 }} />
                  <Text style={styles.protectionNoticeText}>
                    Âm thanh được bảo hộ theo Luật Sở hữu Trí tuệ và Tiêu chuẩn Âm nhạc Số Toàn cầu. Mọi hành vi sao chép không xin phép đều bị xử lý theo chính sách DMCA của Waifu Player.
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.claimButton}
                  onPress={() => {
                    setShowCopyrightModal(false);
                    setShowClaimModal(true);
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="flag-outline" size={18} color="#ef4444" />
                  <Text style={styles.claimButtonText}>Báo cáo / Khiếu nại vi phạm bản quyền</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Copyright Dispute & Claim Modal */}
      <Modal
        visible={showClaimModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowClaimModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: "90%" }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons name="flag" size={22} color="#ef4444" />
                <Text style={styles.modalTitle}>Khiếu Nại Bản Quyền</Text>
              </View>
              <TouchableOpacity onPress={() => setShowClaimModal(false)}>
                <Ionicons name="close-circle" size={26} color={Colors.dark.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
              {!isAuthenticated && (
                <View style={styles.authWarningBox}>
                  <Ionicons name="warning-outline" size={18} color="#f59e0b" />
                  <Text style={styles.authWarningText}>
                    Bạn đang ở chế độ Khách. Vui lòng đăng nhập để gửi đơn khiếu nại chính thức.
                  </Text>
                  <TouchableOpacity
                    style={styles.authWarningBtn}
                    onPress={() => {
                      setShowClaimModal(false);
                      router.push("/(auth)/login");
                    }}
                  >
                    <Text style={styles.authWarningBtnText}>Đăng nhập</Text>
                  </TouchableOpacity>
                </View>
              )}
              <Text style={styles.claimInstruction}>
                Nếu bạn là chủ sở hữu tác phẩm hoặc đại diện pháp lý nhận thấy bài hát <Text style={{ color: Colors.dark.primary, fontWeight: "700" }}>"{currentSong.title}"</Text> vi phạm bản quyền, hãy cung cấp thông tin bên dưới:
              </Text>

              <Text style={styles.inputLabel}>Loại vi phạm</Text>
              <View style={styles.claimTypeRow}>
                {[
                  { id: "UNAUTHORIZED_REPOST", label: "Đăng tải trái phép" },
                  { id: "COPYRIGHT_INFRINGE", label: "Xâm phạm tác quyền" },
                  { id: "INCORRECT_METADATA", label: "Sai thông tin tác giả" },
                  { id: "OTHER", label: "Lý do khác" },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.claimTypeChip,
                      claimType === item.id && styles.claimTypeChipActive,
                    ]}
                    onPress={() => setClaimType(item.id)}
                  >
                    <Text
                      style={[
                        styles.claimTypeChipText,
                        claimType === item.id && styles.claimTypeChipTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Lý do khiếu nại (tóm tắt) *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ví dụ: Tác phẩm chưa được cấp quyền tác giả..."
                placeholderTextColor={Colors.dark.textMuted}
                value={claimReason}
                onChangeText={setClaimReason}
              />

              <Text style={styles.inputLabel}>Mô tả chi tiết vi phạm (tối thiểu 10 ký tự) *</Text>
              <TextInput
                style={styles.textAreaInput}
                placeholder="Mô tả cụ thể căn cứ vi phạm bản quyền, ngày phát hành bản quyền gốc của bạn..."
                placeholderTextColor={Colors.dark.textMuted}
                multiline
                numberOfLines={4}
                value={claimDescription}
                onChangeText={setClaimDescription}
              />

              <Text style={styles.inputLabel}>Đường dẫn bằng chứng (URL chứng thực quyền sở hữu)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="https://drive.google.com/... hoặc link tác phẩm gốc"
                placeholderTextColor={Colors.dark.textMuted}
                value={claimEvidence}
                onChangeText={setClaimEvidence}
                autoCapitalize="none"
              />

              <TouchableOpacity
                style={[styles.submitClaimBtn, submittingClaim && { opacity: 0.7 }]}
                onPress={handleSubmitClaim}
                disabled={submittingClaim}
              >
                {submittingClaim ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="send" size={18} color="#fff" />
                    <Text style={styles.submitClaimBtnText}>Gửi Đơn Khiếu Nại Bản Quyền</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Audio / Change Music Modal */}
      <Modal
        visible={showEditAudioModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditAudioModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: "88%" }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons name="musical-notes" size={22} color={Colors.dark.primary} />
                <Text style={styles.modalTitle}>Đổi File Nhạc & Âm Thanh 🎵</Text>
              </View>
              <TouchableOpacity onPress={() => setShowEditAudioModal(false)}>
                <Ionicons name="close-circle" size={26} color={Colors.dark.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
              <Text style={{ color: Colors.dark.textMuted, fontSize: 13, marginBottom: 16 }}>
                Thay đổi nguồn phát âm thanh của bài hát bằng cách chọn bản nhạc mẫu chất lượng cao có sẵn, dán link MP3 hoặc tải file từ thiết bị của bạn.
              </Text>

              <Text style={styles.inputLabel}>Tên bài hát</Text>
              <TextInput
                style={styles.textInput}
                value={editTitle}
                onChangeText={setEditTitle}
                placeholder="Nhập tên bài hát..."
                placeholderTextColor={Colors.dark.textMuted}
              />

              <Text style={styles.inputLabel}>Chọn nhanh nguồn nhạc mẫu có sẵn:</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                {[
                  { label: "☕ Lofi Anime Chill", url: "/uploads/audio/lofi_anime_chill.mp3" },
                  { label: "🎹 Piano Ballad Việt", url: "/uploads/audio/piano_ballad_viet.mp3" },
                  { label: "🎸 Guitar Acoustic Việt", url: "/uploads/audio/guitar_acoustic_viet.mp3" },
                  { label: "⚡ Vocaloid Synth Beat", url: "/uploads/audio/vocaloid_synth_beat.mp3" },
                  { label: "🔥 Anime Rock Energy", url: "/uploads/audio/anime_rock_energy.mp3" },
                  { label: "💃 V-Pop Dance Beat", url: "/uploads/audio/vpop_dance_beat.mp3" },
                  { label: "✨ Makoto Shinkai OST", url: "/uploads/audio/makoto_shinkai_melody.mp3" },
                  { label: "🗡️ Demon Slayer Flame", url: "/uploads/audio/demon_slayer_flame.mp3" },
                ].map((preset, pIdx) => {
                  const isSelected = editAudioUrl === preset.url;
                  return (
                    <TouchableOpacity
                      key={pIdx}
                      style={[
                        {
                          paddingHorizontal: 12,
                          paddingVertical: 7,
                          borderRadius: 16,
                          backgroundColor: isSelected ? Colors.dark.primary : Colors.dark.card,
                          borderWidth: 1,
                          borderColor: isSelected ? Colors.dark.primaryLight : Colors.dark.border,
                        },
                      ]}
                      onPress={() => setEditAudioUrl(preset.url)}
                    >
                      <Text style={{ color: isSelected ? "#fff" : Colors.dark.text, fontSize: 12, fontWeight: "600" }}>
                        {preset.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.inputLabel}>Đường dẫn âm thanh (Audio URL / Path) *</Text>
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
                <TextInput
                  style={[styles.textInput, { flex: 1, marginBottom: 0 }]}
                  value={editAudioUrl}
                  onChangeText={setEditAudioUrl}
                  placeholder="https://... hoặc /uploads/audio/..."
                  placeholderTextColor={Colors.dark.textMuted}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={{
                    backgroundColor: Colors.dark.surface,
                    borderWidth: 1,
                    borderColor: Colors.dark.primary,
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                  onPress={handlePickAndUploadAudio}
                  disabled={uploadingFile}
                >
                  {uploadingFile ? (
                    <ActivityIndicator size="small" color={Colors.dark.primary} />
                  ) : (
                    <Ionicons name="cloud-upload" size={20} color={Colors.dark.primary} />
                  )}
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Lời bài hát / Synced Lyrics (LRC)</Text>
              <TextInput
                style={styles.textAreaInput}
                value={editLyricsText}
                onChangeText={setEditLyricsText}
                placeholder="[00:01.00] Dòng lời bài hát 1&#10;[00:05.00] Dòng lời bài hát 2..."
                placeholderTextColor={Colors.dark.textMuted}
                multiline
                numberOfLines={5}
              />

              <TouchableOpacity
                style={[styles.submitClaimBtn, submittingEditAudio && { opacity: 0.7 }]}
                onPress={handleSaveEditAudio}
                disabled={submittingEditAudio}
              >
                {submittingEditAudio ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={styles.submitClaimBtnText}>Lưu & Phát Bản Nhạc Mới Ngay</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Anime Gift Modal */}
      <GiftModal
        visible={showGiftModal}
        song={currentSong}
        onClose={() => setShowGiftModal(false)}
      />
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
    width: 270,
    height: 270,
    borderRadius: 135,
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
    width: 230,
    height: 230,
    borderRadius: 115,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  vinylRing2: {
    position: "absolute",
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  vinylCenterImg: {
    width: 135,
    height: 135,
    borderRadius: 67.5,
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
  waveBarContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
    marginTop: 18,
    height: 30,
  },
  waveBar: {
    width: 4,
    borderRadius: 2,
  },
  lyricsContainer: {
    backgroundColor: "rgba(22, 22, 34, 0.85)",
    padding: 20,
    borderRadius: 20,
    width: "100%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  lyricsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  lyricsBadge: {
    fontSize: 10,
    fontWeight: "bold",
    color: Colors.dark.primaryLight,
    letterSpacing: 1.5,
  },
  lyricLineBox: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginVertical: 4,
    alignItems: "center",
  },
  lyricLineBoxActive: {
    backgroundColor: "rgba(139, 92, 246, 0.15)",
    borderColor: "rgba(139, 92, 246, 0.3)",
    borderWidth: 1,
  },
  lyricsLineActive: {
    fontSize: 17,
    fontWeight: "800",
    color: Colors.dark.secondary,
    textAlign: "center",
  },
  lyricsLine: {
    fontSize: 14,
    color: Colors.dark.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
  lyricActiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.dark.secondary,
    marginTop: 4,
  },
  infoContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: Colors.dark.text,
    marginBottom: 4,
  },
  artist: {
    fontSize: 14,
    color: Colors.dark.textMuted,
  },
  speakerIconBtn: {
    padding: 8,
    marginRight: 4,
  },
  giftIconBtn: {
    padding: 6,
    marginRight: 4,
  },
  heartBtn: {
    padding: 8,
  },
  compactVolumeBar: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    backgroundColor: "rgba(30, 30, 46, 0.95)",
    borderRadius: 18,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    width: 165,
    height: 34,
  },
  volumeSlider: {
    flex: 1,
    height: 28,
  },
  miniVolText: {
    fontSize: 11,
    color: Colors.dark.primaryLight,
    fontWeight: "700",
    width: 34,
    textAlign: "right",
  },
  controlsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
    marginBottom: 14,
    paddingHorizontal: 6,
  },
  ctrlSubBtn: {
    padding: 10,
    position: "relative",
  },
  playBtn: {
    width: 66,
    height: 66,
    borderRadius: 33,
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
    gap: 10,
    paddingVertical: 4,
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
  speedOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: Colors.dark.card,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  speedOptionRowActive: {
    borderColor: Colors.dark.primary,
    backgroundColor: "rgba(139, 92, 246, 0.1)",
  },
  speedOptionText: {
    flex: 1,
    fontSize: 14,
    color: Colors.dark.textMuted,
    fontWeight: "600",
  },
  speedOptionTextActive: {
    color: Colors.dark.text,
    fontWeight: "700",
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
  copyrightBadgeWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#059669",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  copyrightBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  copyrightCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: 16,
  },
  copyrightSongTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.dark.text,
    marginBottom: 8,
  },
  copyrightOwnerText: {
    fontSize: 13,
    color: Colors.dark.textMuted,
    marginBottom: 6,
  },
  rightsGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  rightItem: {
    flex: 1,
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  rightLabel: {
    fontSize: 11,
    color: Colors.dark.textMuted,
    marginTop: 6,
    marginBottom: 2,
    textAlign: "center",
  },
  rightValue: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.dark.text,
    textAlign: "center",
  },
  protectionNotice: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.04)",
    padding: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  protectionNoticeText: {
    flex: 1,
    fontSize: 11,
    color: Colors.dark.textMuted,
    lineHeight: 16,
  },
  claimButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  claimButtonText: {
    color: "#ef4444",
    fontSize: 13,
    fontWeight: "700",
  },
  claimInstruction: {
    fontSize: 13,
    color: Colors.dark.textMuted,
    lineHeight: 18,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.dark.text,
    marginBottom: 8,
    marginTop: 10,
  },
  claimTypeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  claimTypeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: Colors.dark.card,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  claimTypeChipActive: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
  },
  claimTypeChipText: {
    fontSize: 12,
    color: Colors.dark.textMuted,
  },
  claimTypeChipTextActive: {
    color: "#fff",
    fontWeight: "700",
  },
  textAreaInput: {
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    color: Colors.dark.text,
    padding: 12,
    minHeight: 80,
    textAlignVertical: "top",
    fontSize: 13,
  },
  textInput: {
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    color: Colors.dark.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
  },
  submitClaimBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#ef4444",
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 20,
    marginBottom: 8,
  },
  submitClaimBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  waveformMiniContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    marginBottom: 4,
    backgroundColor: "rgba(168, 85, 247, 0.06)",
    borderRadius: 16,
    marginHorizontal: 0,
    overflow: "hidden",
  },
  utilPillWave: {
    backgroundColor: "rgba(168, 85, 247, 0.85)",
    borderColor: "#a855f7",
  },
  vocalBadgeDetail: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(233, 30, 99, 0.2)",
    borderColor: "rgba(233, 30, 99, 0.5)",
    borderWidth: 0.8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  vocalBadgeDetailText: {
    color: Colors.dark.primaryLight,
    fontSize: 10,
    fontWeight: "700",
  },
  instrumentalBadgeDetail: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(6, 182, 212, 0.2)",
    borderColor: "rgba(6, 182, 212, 0.5)",
    borderWidth: 0.8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  instrumentalBadgeDetailText: {
    color: "#22d3ee",
    fontSize: 10,
    fontWeight: "700",
  },
  instrumentalContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  instrumentalIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(6, 182, 212, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(6, 182, 212, 0.35)",
  },
  instrumentalTitle: {
    color: "#22d3ee",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginBottom: 6,
    textAlign: "center",
  },
  instrumentalSub: {
    color: Colors.dark.textMuted,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 12,
  },
  instrumentalQuote: {
    color: Colors.dark.text,
    fontSize: 12,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 8,
    opacity: 0.85,
  },
  authWarningBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.35)",
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
    gap: 8,
    flexWrap: "wrap",
  },
  authWarningText: {
    color: "#f59e0b",
    fontSize: 12,
    flex: 1,
    fontWeight: "500",
  },
  authWarningBtn: {
    backgroundColor: "#f59e0b",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  authWarningBtnText: {
    color: "#000",
    fontSize: 11,
    fontWeight: "700",
  },
});

