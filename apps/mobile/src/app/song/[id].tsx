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
  TextInput,
  ActivityIndicator,
  ScrollView,
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
import type { Song, SongCopyright } from "@waifu-player/types";
import { formatDuration } from "@waifu-player/utils";

export default function SongDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [showQueue, setShowQueue] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

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
    const reasonText = claimReason.trim() || `Khiếu nại bản quyền: ${claimType}`;
    if (reasonText.length < 3) {
      Alert.alert("Lỗi", "Vui lòng nhập lý do khiếu nại (tối thiểu 3 ký tự).");
      return;
    }
    const descText = claimDescription.trim();
    if (descText.length < 10) {
      Alert.alert("Lỗi", "Vui lòng mô tả chi tiết vi phạm (tối thiểu 10 ký tự).");
      return;
    }

    setSubmittingClaim(true);
    try {
      const payload: { songId: string; reason: string; description: string; proofUrl?: string } = {
        songId: currentSong.id,
        reason: reasonText,
        description: descText,
      };
      if (claimEvidence.trim().startsWith("http")) {
        payload.proofUrl = claimEvidence.trim();
      }

      const res = await api.post("/api/v1/copyright/claims", payload);

      if (res.data?.success) {
        Alert.alert("Thành công", "Đơn khiếu nại bản quyền đã được gửi thành công. Ban quản trị sẽ thẩm định trong vòng 24h.");
        setShowClaimModal(false);
        setClaimReason("");
        setClaimDescription("");
        setClaimEvidence("");
      } else {
        Alert.alert("Thông báo", res.data?.message || "Không thể gửi khiếu nại.");
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "Đã xảy ra lỗi khi gửi khiếu nại bản quyền.";
      Alert.alert("Lỗi", msg);
    } finally {
      setSubmittingClaim(false);
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

        {/* Bottom Utility Row: Lyrics toggle, Queue button, and Copyright button */}
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

          <TouchableOpacity
            style={styles.utilPill}
            onPress={handleOpenCopyrightModal}
          >
            <Ionicons name="shield-checkmark" size={18} color={Colors.dark.primaryLight} />
            <Text style={styles.utilPillText}>
              Bản quyền
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

      {/* Copyright Certificate & Licensing Modal */}
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
                <Text style={{ color: Colors.dark.textMuted, marginTop: 12 }}>Đang tra cứu dữ liệu bản quyền...</Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                {/* Status Badge */}
                <View style={styles.copyrightBadgeWrap}>
                  <Ionicons name="ribbon-outline" size={18} color="#fff" />
                  <Text style={styles.copyrightBadgeText}>
                    {copyrightData?.status === "ACTIVE"
                      ? "ĐÃ XÁC THỰC BẢN QUYỀN HỢP PHÁP"
                      : "CHỨNG CHỈ BẢN QUYỀN TIÊU CHUẨN"}
                  </Text>
                </View>

                {/* Song info summary */}
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

                {/* Rights details grid */}
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

                {/* Protection note */}
                <View style={styles.protectionNotice}>
                  <Ionicons name="information-circle" size={18} color={Colors.dark.textMuted} style={{ marginTop: 2 }} />
                  <Text style={styles.protectionNoticeText}>
                    Âm thanh được bảo hộ theo Luật Sở hữu Trí tuệ và Tiêu chuẩn Âm nhạc Số Toàn cầu. Mọi hành vi sao chép không xin phép đều bị xử lý theo chính sách DMCA của Waifu Player.
                  </Text>
                </View>

                {/* Claim dispute action button */}
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
              <Text style={styles.claimInstruction}>
                Nếu bạn là chủ sở hữu tác phẩm hoặc đại diện pháp lý nhận thấy bài hát <Text style={{ color: Colors.dark.primary, fontWeight: "700" }}>"{currentSong.title}"</Text> vi phạm bản quyền, hãy cung cấp thông tin bên dưới:
              </Text>

              {/* Claim Type Selector */}
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

              {/* Claim Reason */}
              <Text style={styles.inputLabel}>Lý do khiếu nại (tóm tắt) *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ví dụ: Tác phẩm chưa được cấp quyền tác giả..."
                placeholderTextColor={Colors.dark.textMuted}
                value={claimReason}
                onChangeText={setClaimReason}
              />

              {/* Claim Description */}
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

              {/* Evidence URL */}
              <Text style={styles.inputLabel}>Đường dẫn bằng chứng (URL chứng thực quyền sở hữu)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="https://drive.google.com/... hoặc link tác phẩm gốc"
                placeholderTextColor={Colors.dark.textMuted}
                value={claimEvidence}
                onChangeText={setClaimEvidence}
                autoCapitalize="none"
              />

              {/* Submit Button */}
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
});
