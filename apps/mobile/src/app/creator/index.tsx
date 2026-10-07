import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Modal,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/colors";
import { useAuthStore } from "../../store/authStore";
import { api } from "../../services/api";
import { API_BASE_URL } from "../../constants/api";
import { formatDuration } from "@waifu-player/utils";
import type { CreatorStudioStats, Song } from "@waifu-player/types";

const GENRES = [
  { id: "g1", name: "Vocaloid" },
  { id: "g2", name: "Anisong" },
  { id: "g3", name: "J-Pop" },
  { id: "g4", name: "Lo-fi Anime" },
  { id: "g5", name: "J-Rock" },
];

const LICENSE_TYPES = [
  { id: "ALL_RIGHTS_RESERVED", name: "Bảo lưu mọi quyền (All Rights Reserved)" },
  { id: "CREATIVE_COMMONS", name: "Giấy phép Mở (Creative Commons CC-BY)" },
  { id: "ROYALTY_FREE", name: "Miễn phí bản quyền (Royalty Free)" },
  { id: "CUSTOM_LICENSE", name: "Giấy phép riêng biệt (Custom License)" },
];

export default function CreatorStudioScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [studioStats, setStudioStats] = useState<CreatorStudioStats | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);

  // Modals
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showAlbumModal, setShowAlbumModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  // Publish Form State
  const [songTitle, setSongTitle] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [duration, setDuration] = useState("210");
  const [selectedGenreId, setSelectedGenreId] = useState("g1");
  const [licenseType, setLicenseType] = useState("ALL_RIGHTS_RESERVED");
  const [isrcCode, setIsrcCode] = useState("");
  const [commercialUse, setCommercialUse] = useState(true);
  const [allowRemix, setAllowRemix] = useState(false);
  const [submittingSong, setSubmittingSong] = useState(false);

  // Local File Upload States
  const [localAudioName, setLocalAudioName] = useState<string | null>(null);
  const [localAudioSize, setLocalAudioSize] = useState<string | null>(null);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [localCoverName, setLocalCoverName] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);

  // Function to pick audio file from local machine
  const handlePickLocalAudio = () => {
    if (typeof document === "undefined") return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "audio/mp3,audio/wav,audio/flac,audio/ogg,audio/m4a,audio/*,.mp3,.wav,.flac,.m4a";
    input.onchange = async (e: any) => {
      const file = e.target?.files?.[0];
      if (!file) return;

      setLocalAudioName(file.name);
      setLocalAudioSize((file.size / (1024 * 1024)).toFixed(2));

      // Auto populate song title if empty
      if (!songTitle.trim()) {
        const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
        setSongTitle(cleanName);
      }

      // Auto detect duration via HTML5 Audio
      try {
        const tempAudio = new Audio(URL.createObjectURL(file));
        tempAudio.onloadedmetadata = () => {
          if (tempAudio.duration && !isNaN(tempAudio.duration)) {
            setDuration(Math.round(tempAudio.duration).toString());
          }
        };
      } catch {}

      // Upload file to backend
      setUploadingAudio(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await api.post("/api/v1/creator/upload/audio", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        if (res.data?.success && res.data?.data?.url) {
          setAudioUrl(res.data.data.url);
        }
      } catch (err) {
        console.warn("Upload audio error:", err);
      } finally {
        setUploadingAudio(false);
      }
    };
    input.click();
  };

  // Function to pick cover art image from local machine
  const handlePickLocalCover = () => {
    if (typeof document === "undefined") return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/webp,image/gif,image/*";
    input.onchange = async (e: any) => {
      const file = e.target?.files?.[0];
      if (!file) return;

      setLocalCoverName(file.name);

      // Upload file to backend
      setUploadingCover(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await api.post("/api/v1/creator/upload/cover", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        if (res.data?.success && res.data?.data?.url) {
          setCoverUrl(res.data.data.url);
        }
      } catch (err) {
        console.warn("Upload cover error:", err);
      } finally {
        setUploadingCover(false);
      }
    };
    input.click();
  };

  // Album Form State
  const [albumTitle, setAlbumTitle] = useState("");
  const [albumCover, setAlbumCover] = useState("");
  const [submittingAlbum, setSubmittingAlbum] = useState(false);

  // Register Creator Profile State
  const [artistName, setArtistName] = useState(user?.displayName || user?.username || "");
  const [artistBio, setArtistBio] = useState("");
  const [registering, setRegistering] = useState(false);

  // Payout & Withdrawal States
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [showPayoutHistoryModal, setShowPayoutHistoryModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("50000");
  const [payoutBankId, setPayoutBankId] = useState("MB");
  const [payoutBankName, setPayoutBankName] = useState("MBBank (Ngân Hàng Quân Đội)");
  const [payoutAccountNo, setPayoutAccountNo] = useState("");
  const [payoutAccountName, setPayoutAccountName] = useState(user?.displayName?.toUpperCase() || "");
  const [payoutNote, setPayoutNote] = useState("");
  const [submittingPayout, setSubmittingPayout] = useState(false);
  const [payoutInfo, setPayoutInfo] = useState<{
    payouts: any[];
    totalEarnings: number;
    availableBalance: number;
    totalCompleted: number;
    totalPending: number;
  }>({
    payouts: [],
    totalEarnings: 150000,
    availableBalance: 150000,
    totalCompleted: 0,
    totalPending: 0,
  });

  const POPULAR_BANKS = [
    { id: "MB", name: "MBBank (Quân Đội)", shortName: "MBBank" },
    { id: "VCB", name: "Vietcombank (Ngoại Thương)", shortName: "Vietcombank" },
    { id: "TCB", name: "Techcombank (Kỹ Thương)", shortName: "Techcombank" },
    { id: "ICB", name: "VietinBank (Công Thương)", shortName: "VietinBank" },
    { id: "BIDV", name: "BIDV (Đầu Tư & Phát Triển)", shortName: "BIDV" },
    { id: "ACB", name: "ACB (Á Châu)", shortName: "ACB" },
    { id: "VPB", name: "VPBank (Việt Nam Thịnh Vượng)", shortName: "VPBank" },
    { id: "TPB", name: "TPBank (Tiên Phong)", shortName: "TPBank" },
    { id: "MOMO", name: "Ví Điện Tử MoMo", shortName: "MoMo" },
  ];

  const fetchPayoutHistory = async () => {
    try {
      const res = await api.get("/api/v1/creator/payouts");
      if (res.data?.success && res.data?.data) {
        setPayoutInfo(res.data.data);
      }
    } catch {}
  };

  const fetchStudioData = async () => {
    setLoading(true);
    try {
      const [studioRes, songsRes] = await Promise.all([
        api.get("/api/v1/creator/studio").catch(() => null),
        api.get("/api/v1/creator/songs").catch(() => null),
      ]);

      if (studioRes?.data?.success) {
        setStudioStats(studioRes.data.data);
      }
      if (songsRes?.data?.success && Array.isArray(songsRes.data.data)) {
        setSongs(songsRes.data.data);
      }
      await fetchPayoutHistory();
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPayout = async () => {
    const amount = Number(payoutAmount);
    if (!amount || amount < 10000) {
      Alert.alert("Lỗi", "Số tiền yêu cầu rút tối thiểu là 10.000 VNĐ");
      return;
    }
    if (!payoutAccountNo.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập số tài khoản nhận tiền");
      return;
    }
    if (!payoutAccountName.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tên chủ tài khoản");
      return;
    }

    setSubmittingPayout(true);
    try {
      const res = await api.post("/api/v1/creator/payouts", {
        amount,
        bankId: payoutBankId,
        bankName: payoutBankName,
        accountNo: payoutAccountNo.trim(),
        accountName: payoutAccountName.trim().toUpperCase(),
        note: payoutNote.trim() || undefined,
      });

      if (res.data?.success) {
        Alert.alert(
          "Gửi yêu cầu thành công! 💸",
          res.data.data?.message || "Yêu cầu rút tiền của bạn đã được gửi tới Quản trị viên để xét duyệt và giải ngân!"
        );
        setShowPayoutModal(false);
        fetchStudioData();
      }
    } catch (err: any) {
      Alert.alert("Lỗi", err.response?.data?.error || "Không thể gửi yêu cầu rút tiền");
    } finally {
      setSubmittingPayout(false);
    }
  };


  useEffect(() => {
    if (isAuthenticated) {
      fetchStudioData();
    }
  }, [isAuthenticated]);

  const handleRegisterCreator = async () => {
    if (!artistName.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập nghệ danh của bạn");
      return;
    }

    setRegistering(true);
    try {
      const res = await api.post("/api/v1/creator/register", {
        name: artistName.trim(),
        bio: artistBio.trim() || "Anime Music Creator",
      });

      if (res.data?.success) {
        Alert.alert("Thành công! 🎉", "Bạn đã trở thành Nhà Sáng Tạo Âm Nhạc Anime!");
        setShowRegisterModal(false);
        fetchStudioData();
      }
    } catch (err: any) {
      Alert.alert("Lỗi", err.response?.data?.error || "Không thể khởi tạo hồ sơ");
    } finally {
      setRegistering(false);
    }
  };

  const handlePublishSong = async () => {
    if (!songTitle.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tên bài hát");
      return;
    }

    setSubmittingSong(true);
    try {
      const res = await api.post("/api/v1/creator/songs", {
        title: songTitle.trim(),
        duration: Number(duration) || 180,
        fileUrl: audioUrl.trim() || "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        coverUrl: coverUrl.trim() || "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80",
        genreIds: [selectedGenreId],
        licenseType,
        isrc: isrcCode.trim() || undefined,
        commercialUse,
        allowRemix,
      });

      if (res.data?.success) {
        Alert.alert("Thành công! 🚀", "Bài hát của bạn đã được phát hành và bảo hộ bản quyền thành công!");
        setShowPublishModal(false);
        setSongTitle("");
        setAudioUrl("");
        setCoverUrl("");
        fetchStudioData();
      }
    } catch (err: any) {
      Alert.alert("Lỗi", err.response?.data?.error || "Không thể phát hành bài hát");
    } finally {
      setSubmittingSong(false);
    }
  };

  const handleCreateAlbum = async () => {
    if (!albumTitle.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tên Album");
      return;
    }

    setSubmittingAlbum(true);
    try {
      const res = await api.post("/api/v1/creator/albums", {
        title: albumTitle.trim(),
        coverUrl: albumCover.trim() || undefined,
      });

      if (res.data?.success) {
        Alert.alert("Thành công! 💿", "Album mới đã được tạo thành công!");
        setShowAlbumModal(false);
        setAlbumTitle("");
        setAlbumCover("");
        fetchStudioData();
      }
    } catch (err: any) {
      Alert.alert("Lỗi", err.response?.data?.error || "Không thể tạo Album");
    } finally {
      setSubmittingAlbum(false);
    }
  };

  const handleDeleteSong = (songId: string, title: string) => {
    Alert.alert("Xác nhận gỡ bài", `Bạn có chắc muốn xóa bài hát "${title}" khỏi hệ thống?`, [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa Ngay",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/api/v1/creator/songs/${songId}`);
            Alert.alert("Đã xóa", "Bài hát đã được gỡ thành công.");
            fetchStudioData();
          } catch {
            Alert.alert("Lỗi", "Không thể xóa bài hát này.");
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={22} color={Colors.dark.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>Creator Studio 🎙️</Text>
          <Text style={styles.headerSubtitle}>Trung tâm Sáng tạo Âm nhạc Anime</Text>
        </View>
        <TouchableOpacity
          style={styles.publishIconBtn}
          onPress={() => setShowPublishModal(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="cloud-upload" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Colors.dark.primary} />
            <Text style={styles.loadingText}>Đang tải phòng sáng tạo...</Text>
          </View>
        ) : (
          <>
            {/* Creator Profile Card */}
            <View style={styles.creatorCard}>
              <View style={styles.creatorHeader}>
                <Image
                  source={{
                    uri: studioStats?.artist.avatarUrl || "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=200&q=80",
                  }}
                  style={styles.creatorAvatar}
                />
                <View style={styles.creatorInfo}>
                  <View style={styles.creatorNameRow}>
                    <Text style={styles.creatorName}>{studioStats?.artist.name || user?.displayName || "Nghệ sĩ Anime"}</Text>
                    <Ionicons name="checkmark-circle" size={18} color={Colors.dark.accent} />
                  </View>
                  <Text style={styles.creatorBio} numberOfLines={2}>
                    {studioStats?.artist.bio || "Nhà sáng tạo âm nhạc độc quyền Waifu Player"}
                  </Text>
                  <View style={styles.badgeRow}>
                    <View style={styles.verifiedBadge}>
                      <Text style={styles.verifiedText}>OFFICIAL CREATOR</Text>
                    </View>
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusText}>ACTIVE PRODUCER</Text>
                    </View>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.editProfileBtn}
                onPress={() => setShowRegisterModal(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="create-outline" size={16} color={Colors.dark.primaryLight} />
                <Text style={styles.editProfileText}>Chỉnh Sửa Hồ Sơ Nghệ Sĩ</Text>
              </TouchableOpacity>
            </View>

            {/* Metrics Dashboard Grid */}
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <View style={[styles.metricIconBg, { backgroundColor: "rgba(233, 30, 140, 0.15)" }]}>
                  <Ionicons name="play" size={20} color={Colors.dark.primary} />
                </View>
                <Text style={styles.metricValue}>{(studioStats?.totalPlays || 0).toLocaleString()}</Text>
                <Text style={styles.metricLabel}>Lượt Nghe Stream</Text>
              </View>

              <View style={styles.metricCard}>
                <View style={[styles.metricIconBg, { backgroundColor: "rgba(6, 182, 212, 0.15)" }]}>
                  <Ionicons name="people" size={20} color={Colors.dark.accent} />
                </View>
                <Text style={styles.metricValue}>{(studioStats?.totalFollowers || 0).toLocaleString()}</Text>
                <Text style={styles.metricLabel}>Người Theo Dõi</Text>
              </View>

              <View style={styles.metricCard}>
                <View style={[styles.metricIconBg, { backgroundColor: "rgba(168, 85, 247, 0.15)" }]}>
                  <Ionicons name="musical-notes" size={20} color={Colors.dark.secondary} />
                </View>
                <Text style={styles.metricValue}>{studioStats?.totalSongs || songs.length}</Text>
                <Text style={styles.metricLabel}>Bài Hát Đã Đăng</Text>
              </View>

              <View style={[styles.metricCard, { borderColor: "rgba(34, 197, 94, 0.4)", borderWidth: 1 }]}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View style={[styles.metricIconBg, { backgroundColor: "rgba(34, 197, 94, 0.15)" }]}>
                    <Ionicons name="cash" size={20} color={Colors.dark.success} />
                  </View>
                  <TouchableOpacity
                    style={styles.metricWithdrawBtn}
                    onPress={() => setShowPayoutModal(true)}
                  >
                    <Ionicons name="card" size={12} color="#fff" />
                    <Text style={styles.metricWithdrawBtnText}>Rút Tiền</Text>
                  </TouchableOpacity>
                </View>
                <Text style={[styles.metricValue, { color: Colors.dark.success }]}>
                  {payoutInfo.availableBalance.toLocaleString()} ₫
                </Text>
                <Text style={styles.metricLabel}>Khả Dụng ({payoutInfo.totalEarnings.toLocaleString()} ₫ tích lũy)</Text>
              </View>
            </View>

            {/* Action Buttons Row */}
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                style={styles.primaryActionBtn}
                onPress={() => setShowPublishModal(true)}
                activeOpacity={0.85}
              >
                <Ionicons name="add-circle" size={18} color="#fff" />
                <Text style={styles.primaryActionText}>Phát Hành Bài Mới</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryActionBtn}
                onPress={() => setShowAlbumModal(true)}
                activeOpacity={0.85}
              >
                <Ionicons name="disc" size={18} color={Colors.dark.accent} />
                <Text style={styles.secondaryActionText}>Tạo Album</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.payoutActionBtn}
                onPress={() => setShowPayoutModal(true)}
                activeOpacity={0.85}
              >
                <Ionicons name="cash-outline" size={18} color="#fff" />
                <Text style={styles.payoutActionText}>Rút Doanh Thu</Text>
              </TouchableOpacity>
            </View>


            {/* Songs Management List */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Kho Tác Phẩm Của Bạn ({songs.length}) 🎶</Text>
              <TouchableOpacity onPress={fetchStudioData}>
                <Ionicons name="refresh" size={18} color={Colors.dark.primaryLight} />
              </TouchableOpacity>
            </View>

            {songs.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="musical-note-outline" size={48} color={Colors.dark.textMuted} />
                <Text style={styles.emptyTitle}>Chưa có bài hát nào</Text>
                <Text style={styles.emptySub}>
                  Hãy bắt đầu đăng tải bài hát anime đầu tiên của bạn để tiếp cận hàng ngàn người nghe!
                </Text>
                <TouchableOpacity
                  style={styles.emptyPublishBtn}
                  onPress={() => setShowPublishModal(true)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.emptyPublishText}>Phát Hành Ngay</Text>
                </TouchableOpacity>
              </View>
            ) : (
              songs.map((song, index) => (
                <View key={song.id} style={styles.songManageCard}>
                  <Text style={styles.songIndex}>#{index + 1}</Text>
                  <Image
                    source={{
                      uri: song.coverUrl || "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=200&q=80",
                    }}
                    style={styles.songThumb}
                  />
                  <View style={styles.songManageInfo}>
                    <Text style={styles.songManageTitle} numberOfLines={1}>{song.title}</Text>
                    <Text style={styles.songManageMeta}>
                      {formatDuration(song.duration)} • {(song.plays || 0).toLocaleString()} lượt nghe
                    </Text>
                    <View style={styles.songTagRow}>
                      <View style={styles.isrcTag}>
                        <Text style={styles.isrcText}>{song.copyright?.isrc || "ISRC PROTECTED"}</Text>
                      </View>
                      <View style={styles.statusLiveTag}>
                        <Text style={styles.statusLiveText}>LIVE</Text>
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.deleteSongBtn}
                    onPress={() => handleDeleteSong(song.id, song.title)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={20} color={Colors.dark.error} />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* ─── MODAL 1: PUBLISH SONG ────────────────────────────────────────────── */}
      <Modal visible={showPublishModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Phát Hành Bài Hát Mới 🚀</Text>
              <TouchableOpacity onPress={() => setShowPublishModal(false)}>
                <Ionicons name="close" size={24} color={Colors.dark.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Tên bài hát *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Ví dụ: Sakura Memories (Vocaloid Ver.)"
                  placeholderTextColor={Colors.dark.textMuted}
                  value={songTitle}
                  onChangeText={setSongTitle}
                />
              </View>

              {/* Audio Source Picker */}
              <View style={styles.formGroup}>
                <View style={styles.fieldHeaderRow}>
                  <Text style={styles.formLabel}>File Âm Thanh (Audio MP3 / FLAC) *</Text>
                  <TouchableOpacity
                    style={styles.pickFileBtn}
                    onPress={handlePickLocalAudio}
                    disabled={uploadingAudio}
                    activeOpacity={0.8}
                  >
                    {uploadingAudio ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="folder-open" size={14} color="#fff" />
                        <Text style={styles.pickFileBtnText}>Chọn file từ máy</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                {localAudioName && (
                  <View style={styles.pickedFileBadge}>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.dark.accent} />
                    <Text style={styles.pickedFileName} numberOfLines={1}>
                      {localAudioName} {localAudioSize ? `(${localAudioSize} MB)` : ""}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        setLocalAudioName(null);
                        setLocalAudioSize(null);
                        setAudioUrl("");
                      }}
                    >
                      <Ionicons name="close-circle" size={16} color={Colors.dark.textMuted} />
                    </TouchableOpacity>
                  </View>
                )}

                <TextInput
                  style={styles.formInput}
                  placeholder="Hoặc dán URL: https://... hoặc /uploads/audio/..."
                  placeholderTextColor={Colors.dark.textMuted}
                  value={audioUrl}
                  onChangeText={setAudioUrl}
                />
              </View>

              {/* Cover Art Picker */}
              <View style={styles.formGroup}>
                <View style={styles.fieldHeaderRow}>
                  <Text style={styles.formLabel}>Ảnh Bìa Bài Hát (Cover Art URL)</Text>
                  <TouchableOpacity
                    style={styles.pickFileBtnSecondary}
                    onPress={handlePickLocalCover}
                    disabled={uploadingCover}
                    activeOpacity={0.8}
                  >
                    {uploadingCover ? (
                      <ActivityIndicator size="small" color={Colors.dark.accent} />
                    ) : (
                      <>
                        <Ionicons name="image" size={14} color={Colors.dark.accent} />
                        <Text style={styles.pickFileBtnSecondaryText}>Chọn ảnh từ máy</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                {coverUrl ? (
                  <View style={styles.coverPreviewBox}>
                    <Image
                      source={{ uri: coverUrl.startsWith("http") ? coverUrl : `${API_BASE_URL}${coverUrl.startsWith("/") ? "" : "/"}${coverUrl}` }}
                      style={styles.coverPreviewThumb}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.coverPreviewLabel}>Ảnh bìa xem trước</Text>
                      <Text style={styles.coverPreviewUrl} numberOfLines={1}>{localCoverName || coverUrl}</Text>
                    </View>
                    <TouchableOpacity onPress={() => { setCoverUrl(""); setLocalCoverName(null); }}>
                      <Ionicons name="trash-outline" size={18} color={Colors.dark.error} />
                    </TouchableOpacity>
                  </View>
                ) : null}

                <TextInput
                  style={styles.formInput}
                  placeholder="Hoặc dán link ảnh bìa: https://images.unsplash.com/..."
                  placeholderTextColor={Colors.dark.textMuted}
                  value={coverUrl}
                  onChangeText={setCoverUrl}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Thời lượng (Giây) *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="210"
                  placeholderTextColor={Colors.dark.textMuted}
                  value={duration}
                  onChangeText={setDuration}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Thể loại chính</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 6 }}>
                  {GENRES.map((g) => (
                    <TouchableOpacity
                      key={g.id}
                      style={[styles.genreChip, selectedGenreId === g.id && styles.genreChipActive]}
                      onPress={() => setSelectedGenreId(g.id)}
                    >
                      <Text style={[styles.genreChipText, selectedGenreId === g.id && { color: "#fff" }]}>
                        {g.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Mã chuẩn quốc tế ISRC (Tự sinh nếu để trống)</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="VN-WFP-2026-XXXXX"
                  placeholderTextColor={Colors.dark.textMuted}
                  value={isrcCode}
                  onChangeText={setIsrcCode}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Loại giấy phép bản quyền</Text>
                {LICENSE_TYPES.map((lic) => (
                  <TouchableOpacity
                    key={lic.id}
                    style={[styles.licenseOption, licenseType === lic.id && styles.licenseOptionActive]}
                    onPress={() => setLicenseType(lic.id)}
                  >
                    <Ionicons
                      name={licenseType === lic.id ? "radio-button-on" : "radio-button-off"}
                      size={18}
                      color={licenseType === lic.id ? Colors.dark.primary : Colors.dark.textMuted}
                    />
                    <Text style={styles.licenseText}>{lic.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={styles.submitModalBtn}
                onPress={handlePublishSong}
                disabled={submittingSong}
              >
                {submittingSong ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitModalText}>Xuất Bản Ngay</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ─── MODAL 2: CREATE ALBUM ────────────────────────────────────────────── */}
      <Modal visible={showAlbumModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tạo Album Mới 💿</Text>
              <TouchableOpacity onPress={() => setShowAlbumModal(false)}>
                <Ionicons name="close" size={24} color={Colors.dark.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Tên Album *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Ví dụ: Magical Anime Dreams Vol. 1"
                placeholderTextColor={Colors.dark.textMuted}
                value={albumTitle}
                onChangeText={setAlbumTitle}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Ảnh bìa Album (URL)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="https://images.unsplash.com/..."
                placeholderTextColor={Colors.dark.textMuted}
                value={albumCover}
                onChangeText={setAlbumCover}
              />
            </View>

            <TouchableOpacity
              style={styles.submitModalBtn}
              onPress={handleCreateAlbum}
              disabled={submittingAlbum}
            >
              {submittingAlbum ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitModalText}>Tạo Album</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─── MODAL 3: REGISTER / EDIT ARTIST PROFILE ─────────────────────────── */}
      <Modal visible={showRegisterModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Hồ Sơ Nhà Sáng Tạo 🎙️</Text>
              <TouchableOpacity onPress={() => setShowRegisterModal(false)}>
                <Ionicons name="close" size={24} color={Colors.dark.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Nghệ danh Waifu / Producer *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Ví dụ: MikuDJ Official"
                placeholderTextColor={Colors.dark.textMuted}
                value={artistName}
                onChangeText={setArtistName}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Tiểu sử & Phong cách âm nhạc</Text>
              <TextInput
                style={[styles.formInput, { height: 80, textAlignVertical: "top" }]}
                placeholder="Giới thiệu về bạn và phong cách nhạc Anime bạn sáng tác..."
                placeholderTextColor={Colors.dark.textMuted}
                value={artistBio}
                onChangeText={setArtistBio}
                multiline
              />
            </View>

            <TouchableOpacity
              style={styles.submitModalBtn}
              onPress={handleRegisterCreator}
              disabled={registering}
            >
              {registering ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitModalText}>Lưu Hồ Sơ Sáng Tạo</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─── MODAL 4: REQUEST CREATOR PAYOUT ───────────────────────────────── */}
      <Modal visible={showPayoutModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: "90%" }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons name="cash" size={24} color={Colors.dark.success} />
                <Text style={styles.modalTitle}>Yêu Cầu Rút Tiền Doanh Thu 💸</Text>
              </View>
              <TouchableOpacity onPress={() => setShowPayoutModal(false)}>
                <Ionicons name="close" size={24} color={Colors.dark.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
              {/* Available Balance Box */}
              <View style={styles.payoutBalanceBox}>
                <View style={styles.payoutBalanceHeader}>
                  <Text style={styles.payoutBalanceLabel}>SỐ DƯ DOANH THU KHẢ DỤNG</Text>
                  <TouchableOpacity
                    style={styles.historyTriggerBtn}
                    onPress={() => {
                      setShowPayoutModal(false);
                      setShowPayoutHistoryModal(true);
                    }}
                  >
                    <Ionicons name="time-outline" size={14} color={Colors.dark.primaryLight} />
                    <Text style={styles.historyTriggerText}>Xem Lịch Sử Rút</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.payoutBalanceValue}>
                  {payoutInfo.availableBalance.toLocaleString()} ₫
                </Text>
                <Text style={styles.payoutBalanceSub}>
                  Đã rút: {payoutInfo.totalCompleted.toLocaleString()} ₫ • Đang xử lý: {payoutInfo.totalPending.toLocaleString()} ₫
                </Text>
              </View>

              {/* Amount Preset Chips */}
              <Text style={styles.formSectionLabel}>Chọn số tiền cần rút:</Text>
              <View style={styles.presetAmountsGrid}>
                {["50000", "100000", "200000", "500000"].map((amt) => {
                  const isSelected = payoutAmount === amt;
                  return (
                    <TouchableOpacity
                      key={amt}
                      style={[styles.presetAmountChip, isSelected && styles.presetAmountChipActive]}
                      onPress={() => setPayoutAmount(amt)}
                    >
                      <Text style={[styles.presetAmountText, isSelected && { color: Colors.dark.success, fontWeight: "700" }]}>
                        {Number(amt).toLocaleString()} ₫
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                <TouchableOpacity
                  style={[styles.presetAmountChip, payoutAmount === String(payoutInfo.availableBalance) && styles.presetAmountChipActive]}
                  onPress={() => setPayoutAmount(String(payoutInfo.availableBalance || 50000))}
                >
                  <Text style={[styles.presetAmountText, { color: Colors.dark.primaryLight, fontWeight: "700" }]}>
                    Rút Hết Số Dư
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Hoặc nhập số tiền tùy chọn (VNĐ) *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Ví dụ: 75000"
                  placeholderTextColor={Colors.dark.textMuted}
                  value={payoutAmount}
                  onChangeText={setPayoutAmount}
                  keyboardType="numeric"
                />
              </View>

              {/* Choose Receiving Bank */}
              <Text style={styles.formSectionLabel}>Chọn ngân hàng thụ hưởng *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bankChipsScroll}>
                {POPULAR_BANKS.map((b) => {
                  const isSelected = payoutBankId === b.id;
                  return (
                    <TouchableOpacity
                      key={b.id}
                      style={[styles.bankChip, isSelected && styles.bankChipActive]}
                      onPress={() => {
                        setPayoutBankId(b.id);
                        setPayoutBankName(b.name);
                      }}
                    >
                      <Text style={[styles.bankChipText, isSelected && styles.bankChipTextActive]}>
                        {b.shortName || b.id}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Số tài khoản ngân hàng của bạn *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Ví dụ: 0987654321..."
                  placeholderTextColor={Colors.dark.textMuted}
                  value={payoutAccountNo}
                  onChangeText={setPayoutAccountNo}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Tên chủ tài khoản (In hoa không dấu) *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Ví dụ: NGUYEN VAN NGHESI"
                  placeholderTextColor={Colors.dark.textMuted}
                  value={payoutAccountName}
                  onChangeText={(val) => setPayoutAccountName(val.toUpperCase())}
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Ghi chú cho Quản trị viên (Tùy chọn)</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Ví dụ: Rút tiền tác quyền bài hát tháng này..."
                  placeholderTextColor={Colors.dark.textMuted}
                  value={payoutNote}
                  onChangeText={setPayoutNote}
                />
              </View>

              {/* Instant VietQR Preview of Creator's Account */}
              {payoutAccountNo.length > 3 && (
                <View style={styles.payoutQrPreviewBox}>
                  <Text style={styles.payoutQrPreviewTitle}>Mã VietQR Nhận Tiền Tự Động:</Text>
                  <Image
                    source={{
                      uri: `https://img.vietqr.io/image/${payoutBankId}-${payoutAccountNo.trim()}-compact2.png?amount=${Number(payoutAmount) || 50000}&addInfo=PAYOUT%20WFP&accountName=${encodeURIComponent(payoutAccountName || "CREATOR")}`,
                    }}
                    style={styles.payoutQrImage}
                    resizeMode="contain"
                  />
                  <Text style={styles.payoutQrSubText}>
                    Admin sẽ quét mã QR trên để giải ngân chính xác {Number(payoutAmount || 0).toLocaleString()} VNĐ vào tài khoản của bạn.
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.submitPayoutBtn}
                onPress={handleRequestPayout}
                disabled={submittingPayout}
                activeOpacity={0.85}
              >
                {submittingPayout ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="paper-plane" size={18} color="#fff" />
                    <Text style={styles.submitPayoutBtnText}>
                      Xác Nhận Rút {Number(payoutAmount || 0).toLocaleString()} ₫
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ─── MODAL 5: PAYOUT HISTORY ───────────────────────────────────────── */}
      <Modal visible={showPayoutHistoryModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: "85%" }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons name="receipt" size={24} color={Colors.dark.primary} />
                <Text style={styles.modalTitle}>Lịch Sử Rút Tiền 📜</Text>
              </View>
              <TouchableOpacity onPress={() => setShowPayoutHistoryModal(false)}>
                <Ionicons name="close" size={24} color={Colors.dark.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              {payoutInfo.payouts.length === 0 ? (
                <View style={styles.emptyPayoutHistoryBox}>
                  <Ionicons name="wallet-outline" size={48} color={Colors.dark.textMuted} />
                  <Text style={styles.emptyPayoutHistoryTitle}>Chưa có yêu cầu rút tiền nào</Text>
                  <Text style={styles.emptyPayoutHistorySub}>
                    Các yêu cầu rút tiền bản quyền của bạn sẽ hiển thị tại đây để bạn tiện theo dõi tiến độ giải ngân.
                  </Text>
                </View>
              ) : (
                payoutInfo.payouts.map((p) => {
                  const isPending = p.status === "PENDING";
                  const isSuccess = p.status === "COMPLETED" || p.status === "APPROVED";
                  return (
                    <View key={p.id} style={styles.payoutHistoryItem}>
                      <View style={styles.payoutHistoryIcon}>
                        <Ionicons
                          name={isSuccess ? "checkmark-circle" : isPending ? "time" : "close-circle"}
                          size={22}
                          color={isSuccess ? Colors.dark.success : isPending ? "#f59e0b" : "#ef4444"}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.payoutHistoryAmount}>
                          +{Number(p.amount).toLocaleString()} ₫
                        </Text>
                        <Text style={styles.payoutHistoryBank}>
                          {p.bankName} • {p.accountNo} ({p.accountName})
                        </Text>
                        <Text style={styles.payoutHistoryCode}>
                          Mã GD: {p.txCode} • {new Date(p.createdAt).toLocaleString("vi-VN")}
                        </Text>
                        {p.adminNote && (
                          <Text style={styles.payoutAdminNote}>
                            Ghi chú Admin: {p.adminNote}
                          </Text>
                        )}
                      </View>
                      <View style={[
                        styles.payoutStatusTag,
                        isSuccess ? styles.statusTagSuccess : isPending ? styles.statusTagPending : styles.statusTagRejected
                      ]}>
                        <Text style={[
                          styles.payoutStatusTagText,
                          isSuccess ? { color: Colors.dark.success } : isPending ? { color: "#f59e0b" } : { color: "#ef4444" }
                        ]}>
                          {isSuccess ? "ĐÃ CHUYỂN" : isPending ? "CHỜ DUYỆT" : "TỪ CHỐI"}
                        </Text>
                      </View>
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  backBtn: {
    padding: 6,
  },
  headerTitleBox: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.dark.text,
  },
  headerSubtitle: {
    fontSize: 11,
    color: Colors.dark.textMuted,
    marginTop: 2,
  },
  publishIconBtn: {
    backgroundColor: Colors.dark.primary,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  loadingBox: {
    paddingVertical: 60,
    alignItems: "center",
  },
  loadingText: {
    color: Colors.dark.textMuted,
    fontSize: 13,
    marginTop: 12,
  },
  creatorCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(233, 30, 140, 0.3)",
    marginBottom: 20,
  },
  creatorHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  creatorAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: Colors.dark.primary,
    marginRight: 14,
  },
  creatorInfo: {
    flex: 1,
  },
  creatorNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  creatorName: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.dark.text,
  },
  creatorBio: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    marginTop: 4,
    lineHeight: 16,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 6,
  },
  verifiedBadge: {
    backgroundColor: "rgba(6, 182, 212, 0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  verifiedText: {
    color: Colors.dark.accent,
    fontSize: 9,
    fontWeight: "800",
  },
  statusBadge: {
    backgroundColor: "rgba(233, 30, 140, 0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    color: Colors.dark.primaryLight,
    fontSize: 9,
    fontWeight: "800",
  },
  editProfileBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.dark.card,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  editProfileText: {
    color: Colors.dark.primaryLight,
    fontSize: 12,
    fontWeight: "700",
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  metricCard: {
    width: "48%",
    backgroundColor: Colors.dark.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  metricIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.dark.text,
  },
  metricLabel: {
    fontSize: 11,
    color: Colors.dark.textMuted,
    marginTop: 2,
    fontWeight: "500",
  },
  actionButtonsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },
  primaryActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.dark.primary,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: Colors.dark.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  primaryActionText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  secondaryActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.dark.surface,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  secondaryActionText: {
    color: Colors.dark.accent,
    fontSize: 14,
    fontWeight: "700",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.dark.text,
  },
  emptyCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 14,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  emptyTitle: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: "700",
    marginTop: 10,
  },
  emptySub: {
    color: Colors.dark.textMuted,
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
    lineHeight: 18,
    paddingHorizontal: 12,
  },
  emptyPublishBtn: {
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 14,
  },
  emptyPublishText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  songManageCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  songIndex: {
    color: Colors.dark.textMuted,
    fontSize: 12,
    fontWeight: "700",
    width: 24,
    textAlign: "center",
  },
  songThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 10,
  },
  songManageInfo: {
    flex: 1,
  },
  songManageTitle: {
    color: Colors.dark.text,
    fontSize: 14,
    fontWeight: "700",
  },
  songManageMeta: {
    color: Colors.dark.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  songTagRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 4,
  },
  isrcTag: {
    backgroundColor: "rgba(168, 85, 247, 0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  isrcText: {
    color: Colors.dark.secondary,
    fontSize: 9,
    fontWeight: "700",
  },
  statusLiveTag: {
    backgroundColor: "rgba(34, 197, 94, 0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusLiveText: {
    color: Colors.dark.success,
    fontSize: 9,
    fontWeight: "800",
  },
  deleteSongBtn: {
    padding: 8,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.dark.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.dark.text,
  },
  formGroup: {
    marginBottom: 14,
  },
  formLabel: {
    color: Colors.dark.text,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
  },
  formInput: {
    backgroundColor: Colors.dark.card,
    borderRadius: 10,
    padding: 12,
    color: Colors.dark.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  genreChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.dark.card,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  genreChipActive: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
  },
  genreChipText: {
    color: Colors.dark.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },
  licenseOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    gap: 8,
  },
  licenseOptionActive: {
    opacity: 1,
  },
  licenseText: {
    color: Colors.dark.text,
    fontSize: 12,
  },
  submitModalBtn: {
    backgroundColor: Colors.dark.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  submitModalText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  fieldHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  pickFileBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  pickFileBtnText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  pickFileBtnSecondary: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(6, 182, 212, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(6, 182, 212, 0.3)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  pickFileBtnSecondaryText: {
    color: Colors.dark.accent,
    fontSize: 11,
    fontWeight: "700",
  },
  pickedFileBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(6, 182, 212, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(6, 182, 212, 0.25)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 8,
    gap: 6,
  },
  pickedFileName: {
    flex: 1,
    color: Colors.dark.accent,
    fontSize: 12,
    fontWeight: "600",
  },
  coverPreviewBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.card,
    borderRadius: 10,
    padding: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    gap: 10,
  },
  coverPreviewThumb: {
    width: 44,
    height: 44,
    borderRadius: 6,
  },
  coverPreviewLabel: {
    color: Colors.dark.text,
    fontSize: 12,
    fontWeight: "700",
  },
  coverPreviewUrl: {
    color: Colors.dark.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  // Payout Styles
  metricWithdrawBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.dark.success,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  metricWithdrawBtnText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
  },
  payoutActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(34, 197, 94, 0.18)",
    borderWidth: 1,
    borderColor: Colors.dark.success,
    paddingVertical: 12,
    borderRadius: 12,
  },
  payoutActionText: {
    color: "#22c55e",
    fontSize: 13,
    fontWeight: "700",
  },
  payoutBalanceBox: {
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "rgba(34, 197, 94, 0.35)",
    marginBottom: 16,
  },
  payoutBalanceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  payoutBalanceLabel: {
    color: "#22c55e",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  historyTriggerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  historyTriggerText: {
    color: Colors.dark.primaryLight,
    fontSize: 11,
    fontWeight: "600",
  },
  payoutBalanceValue: {
    fontSize: 24,
    fontWeight: "900",
    color: "#fff",
    marginVertical: 2,
  },
  payoutBalanceSub: {
    color: Colors.dark.textMuted,
    fontSize: 11,
  },
  formSectionLabel: {
    color: Colors.dark.text,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
  },
  presetAmountsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  presetAmountChip: {
    backgroundColor: Colors.dark.card,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  presetAmountChipActive: {
    borderColor: Colors.dark.success,
    backgroundColor: "rgba(34, 197, 94, 0.15)",
  },
  presetAmountText: {
    color: Colors.dark.textMuted,
    fontSize: 12,
  },
  bankChipsScroll: {
    gap: 8,
    paddingVertical: 4,
    marginBottom: 12,
  },
  bankChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: Colors.dark.card,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  bankChipActive: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primaryLight,
  },
  bankChipText: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    fontWeight: "600",
  },
  bankChipTextActive: {
    color: "#fff",
    fontWeight: "700",
  },
  payoutQrPreviewBox: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    marginVertical: 10,
    borderWidth: 1.5,
    borderColor: Colors.dark.success,
  },
  payoutQrPreviewTitle: {
    color: "#059669",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6,
  },
  payoutQrImage: {
    width: "100%",
    height: 200,
    maxWidth: 200,
  },
  payoutQrSubText: {
    color: "#6b7280",
    fontSize: 10,
    textAlign: "center",
    marginTop: 6,
  },
  submitPayoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#16a34a",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 20,
    shadowColor: "#16a34a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  submitPayoutBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
  emptyPayoutHistoryBox: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyPayoutHistoryTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.dark.text,
    marginTop: 10,
  },
  emptyPayoutHistorySub: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    textAlign: "center",
    marginTop: 4,
    paddingHorizontal: 20,
  },
  payoutHistoryItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    gap: 10,
  },
  payoutHistoryIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  payoutHistoryAmount: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.dark.success,
  },
  payoutHistoryBank: {
    fontSize: 12,
    color: Colors.dark.text,
    fontWeight: "600",
    marginTop: 1,
  },
  payoutHistoryCode: {
    fontSize: 10,
    color: Colors.dark.textMuted,
    marginTop: 2,
  },
  payoutAdminNote: {
    fontSize: 11,
    color: Colors.dark.primaryLight,
    marginTop: 2,
  },
  payoutStatusTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusTagSuccess: {
    backgroundColor: "rgba(34, 197, 94, 0.15)",
  },
  statusTagPending: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
  },
  statusTagRejected: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
  },
  payoutStatusTagText: {
    fontSize: 9,
    fontWeight: "800",
  },
});

