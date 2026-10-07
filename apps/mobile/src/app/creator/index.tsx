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
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

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
      try {
        const { useToastStore } = require("../../store/toastStore");
        useToastStore.getState().showError("Lỗi số tiền", "Số tiền yêu cầu rút tối thiểu là 10.000 VNĐ.");
      } catch {}
      Alert.alert("Lỗi", "Số tiền yêu cầu rút tối thiểu là 10.000 VNĐ");
      return;
    }
    if (!payoutAccountNo.trim()) {
      try {
        const { useToastStore } = require("../../store/toastStore");
        useToastStore.getState().showWarning("Thiếu thông tin", "Vui lòng nhập số tài khoản nhận tiền.");
      } catch {}
      Alert.alert("Lỗi", "Vui lòng nhập số tài khoản nhận tiền");
      return;
    }
    if (!payoutAccountName.trim()) {
      try {
        const { useToastStore } = require("../../store/toastStore");
        useToastStore.getState().showWarning("Thiếu thông tin", "Vui lòng nhập tên chủ tài khoản.");
      } catch {}
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
        try {
          const { useToastStore } = require("../../store/toastStore");
          useToastStore.getState().showSuccess(
            "Yêu cầu rút tiền thành công! 💳",
            `Đã gửi yêu cầu rút ${amount.toLocaleString("vi-VN")} đ tới Quản trị viên duyệt và giải ngân.`
          );
        } catch {}
        Alert.alert(
          "Gửi yêu cầu thành công! 💸",
          res.data.data?.message || "Yêu cầu rút tiền của bạn đã được gửi tới Quản trị viên để xét duyệt và giải ngân!"
        );
        setShowPayoutModal(false);
        fetchStudioData();
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.error || "Không thể gửi yêu cầu rút tiền";
      try {
        const { useToastStore } = require("../../store/toastStore");
        useToastStore.getState().showError("Lỗi rút tiền", errMsg);
      } catch {}
      Alert.alert("Lỗi", errMsg);
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

    // Nếu người dùng chưa đồng ý điều khoản, bắt buộc mở Modal Điều Khoản để đọc và xác nhận
    if (!agreedToTerms) {
      setShowTermsModal(true);
      return;
    }

    await executePublishSong();
  };

  const executePublishSong = async () => {
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
        agreedToTerms: true,
      });

      if (res.data?.success) {
        try {
          const { useToastStore } = require("../../store/toastStore");
          useToastStore.getState().showSuccess(
            "Xuất bản thành công! 🚀",
            `Bài hát "${songTitle.trim()}" đã được xuất bản và xác nhận cam kết bản quyền.`
          );
        } catch {}
        Alert.alert("Thành công! 🚀", "Bài hát của bạn đã được phát hành và bảo hộ bản quyền thành công!");
        setShowPublishModal(false);
        setShowTermsModal(false);
        setSongTitle("");
        setAudioUrl("");
        setCoverUrl("");
        setAgreedToTerms(false);
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


            {/* Thống Kê & Phân Tích Chuyên Sâu Tác Giả */}
            <View style={styles.analyticsSectionCard}>
              <View style={styles.analyticsHeader}>
                <View>
                  <Text style={styles.analyticsTitle}>Phân Tích Lượt Nghe 7 Ngày Qua 📈</Text>
                  <Text style={styles.analyticsSub}>Tần suất người nghe tiếp cận các tác phẩm của bạn</Text>
                </View>
                <View style={styles.weeklyTotalBadge}>
                  <Text style={styles.weeklyTotalText}>
                    Tổng: {(studioStats?.weeklyStreams?.reduce((s, i) => s + i.streams, 0) || 308).toLocaleString()} streams
                  </Text>
                </View>
              </View>

              {/* Bar Chart 7 Days */}
              <View style={styles.chartContainer}>
                {(studioStats?.weeklyStreams || [
                  { day: "Thứ 2", streams: 38 },
                  { day: "Thứ 3", streams: 52 },
                  { day: "Thứ 4", streams: 45 },
                  { day: "Thứ 5", streams: 68 },
                  { day: "Thứ 6", streams: 92 },
                  { day: "Thứ 7", streams: 84 },
                  { day: "CN", streams: 65 },
                ]).map((item, idx) => {
                  const maxStreams = 100;
                  const heightPercent = Math.min(100, Math.max(15, (item.streams / maxStreams) * 100));
                  const isTopDay = item.streams >= 80;

                  return (
                    <View key={`day-${idx}`} style={styles.chartCol}>
                      <Text style={styles.chartValText}>{item.streams}</Text>
                      <View style={styles.chartBarBg}>
                        <View
                          style={[
                            styles.chartBarFill,
                            { height: `${heightPercent}%` },
                            isTopDay && styles.chartBarFillTop,
                          ]}
                        />
                      </View>
                      <Text style={[styles.chartDayText, isTopDay && styles.chartDayTextTop]}>
                        {item.day}
                      </Text>
                    </View>
                  );
                })}
              </View>

              {/* Phân Tích Doanh Thu Quà Tặng Fan */}
              <View style={styles.fanGiftCard}>
                <View style={styles.fanGiftHeader}>
                  <Text style={{ fontSize: 20 }}>🎁</Text>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={styles.fanGiftTitle}>Tình Cảm & Quà Tặng Từ Fan</Text>
                    <Text style={styles.fanGiftSub}>
                      Fan đã tặng {studioStats?.totalGiftsReceived || 12} phần quà ({studioStats?.totalCoinsFromGifts || 180} Xu)
                    </Text>
                  </View>
                  <View style={styles.giftEarningsBox}>
                    <Text style={styles.giftEarningsLabel}>Chia sẻ tác giả (+70%)</Text>
                    <Text style={styles.giftEarningsVal}>
                      +{(studioStats?.fanGiftShareEarnings || 126000).toLocaleString("vi-VN")} ₫
                    </Text>
                  </View>
                </View>
              </View>
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

              {/* KHỐI ĐIỀU KHOẢN & CAM KẾT BẢN QUYỀN TRỰC QUAN */}
              <View style={styles.termsBox}>
                <View style={styles.termsBoxHeader}>
                  <Ionicons name="shield-checkmark" size={18} color="#10b981" />
                  <Text style={styles.termsBoxTitle}>Cam Kết Bản Quyền & Quyền Tác Giả 📜</Text>
                </View>

                <TouchableOpacity
                  style={styles.termsCheckboxRow}
                  onPress={() => setAgreedToTerms(!agreedToTerms)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={agreedToTerms ? "checkbox" : "square-outline"}
                    size={22}
                    color={agreedToTerms ? Colors.dark.primary : Colors.dark.textMuted}
                  />
                  <Text style={styles.termsCheckboxLabel}>
                    Tôi cam kết bài hát này do chính tôi sáng tạo và chấp nhận bị xóa nếu vi phạm bản quyền.
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.viewTermsLinkBtn}
                  onPress={() => setShowTermsModal(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.viewTermsLinkText}>
                    👉 Xem toàn văn điều khoản & quy định xóa bài vi phạm
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.submitModalBtn, !agreedToTerms && styles.submitModalBtnNotAgreed]}
                onPress={handlePublishSong}
                disabled={submittingSong}
              >
                {submittingSong ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitModalText}>
                    {agreedToTerms ? "Xuất Bản Bài Hát Ngay 🚀" : "Xem Điều Khoản & Xuất Bản 📜"}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ─── MODAL ĐIỀU KHOẢN PHÁT HÀNH & BẢN QUYỀN (TERMS MODAL) ─────────── */}
      <Modal visible={showTermsModal} animationType="fade" transparent onRequestClose={() => setShowTermsModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: "88%" }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons name="document-text" size={22} color={Colors.dark.primary} />
                <Text style={styles.modalTitle}>Điều Khoản Bản Quyền & Sáng Tạo 📜⚖️</Text>
              </View>
              <TouchableOpacity onPress={() => setShowTermsModal(false)}>
                <Ionicons name="close" size={24} color={Colors.dark.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.termsScrollContent}>
              <View style={styles.termsBanner}>
                <Ionicons name="warning" size={24} color="#f59e0b" />
                <Text style={styles.termsBannerText}>
                  Vui lòng đọc kỹ các điều khoản dưới đây trước khi xuất bản tác phẩm lên nền tảng Waifu Player.
                </Text>
              </View>

              {/* Điều khoản 1: Quyền sáng tạo của người dùng */}
              <View style={styles.termArticle}>
                <View style={styles.termArticleHeader}>
                  <Text style={styles.termArticleNumber}>ĐIỀU 1</Text>
                  <Text style={styles.termArticleTitle}>TÍNH NGUYÊN BẢN & NỘI DUNG SÁNG TẠO 🎵</Text>
                </View>
                <Text style={styles.termArticleBody}>
                  Bạn cam kết và khẳng định rằng bài hát, bản ghi âm, giai điệu, lời bài hát hoặc bản hòa âm phối khí này là do chính bạn sáng tạo, hoặc bạn là chủ sở hữu hợp pháp đã được cấp phép đầy đủ quyền phát hành công khai.
                </Text>
              </View>

              {/* Điều khoản 2: Chấp nhận xóa nếu vi phạm bản quyền */}
              <View style={[styles.termArticle, { borderColor: "rgba(239, 68, 68, 0.3)" }]}>
                <View style={styles.termArticleHeader}>
                  <Text style={[styles.termArticleNumber, { color: "#ef4444" }]}>ĐIỀU 2</Text>
                  <Text style={[styles.termArticleTitle, { color: "#ef4444" }]}>CHẤP NHẬN XÓA KHI VI PHẠM BẢN QUYỀN 🚫</Text>
                </View>
                <Text style={styles.termArticleBody}>
                  Bạn hoàn toàn đồng ý và chấp nhận rằng: Nếu tác phẩm này bị phát hiện sao chép trái phép, đạo nhạc, hoặc có bất kỳ khiếu nại tranh chấp bản quyền hợp lệ từ bên thứ ba, hệ thống Waifu Player có toàn quyền <Text style={{ fontWeight: "800", color: "#fff" }}>LẬP TỨC XÓA HOẶC GỠ BỎ TÁC PHẨM</Text> khỏi toàn bộ hệ thống mà không cần thông báo trước.
                </Text>
              </View>

              {/* Điều khoản 3: Trách nhiệm pháp lý & Doanh thu */}
              <View style={styles.termArticle}>
                <View style={styles.termArticleHeader}>
                  <Text style={styles.termArticleNumber}>ĐIỀU 3</Text>
                  <Text style={styles.termArticleTitle}>TRÁCH NHIỆM PHÁP LÝ & DOANH THU TÁC PHẨM ⚖️</Text>
                </View>
                <Text style={styles.termArticleBody}>
                  Nhà sáng tạo tự chịu mọi trách nhiệm trước pháp luật về tính hợp pháp của bản ghi âm. Mọi khoản doanh thu phát sinh từ lượt stream hoặc quà tặng của bài hát vi phạm sẽ bị đóng băng hoặc thu hồi theo quy định kiểm duyệt của nền tảng.
                </Text>
              </View>

              {/* Điều khoản 4: Chuẩn mực cộng đồng */}
              <View style={styles.termArticle}>
                <View style={styles.termArticleHeader}>
                  <Text style={styles.termArticleNumber}>ĐIỀU 4</Text>
                  <Text style={styles.termArticleTitle}>TIÊU CHUẨN CỘNG ĐỒNG WAIFU PLAYER 🌸</Text>
                </View>
                <Text style={styles.termArticleBody}>
                  Tác phẩm âm nhạc không chứa nội dung kích động thù địch, xúc phạm danh dự nhân phẩm, đồi trụy hay vi phạm thuần phong mỹ tục và pháp luật hiện hành.
                </Text>
              </View>
            </ScrollView>

            {/* Checkbox bắt buộc đồng ý trong Modal */}
            <TouchableOpacity
              style={styles.modalTermsCheckbox}
              onPress={() => setAgreedToTerms(!agreedToTerms)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={agreedToTerms ? "checkbox" : "square-outline"}
                size={24}
                color={agreedToTerms ? Colors.dark.primary : Colors.dark.textMuted}
              />
              <Text style={styles.modalTermsCheckboxText}>
                Tôi đã đọc kỹ, hiểu rõ và <Text style={{ fontWeight: "800", color: Colors.dark.primaryLight }}>ĐỒNG Ý CHẤP THUẬN</Text> tất cả các điều khoản bản quyền trên.
              </Text>
            </TouchableOpacity>

            {/* Actions: Hủy hoặc Đồng ý & Xuất bản */}
            <View style={styles.modalTermsActions}>
              <TouchableOpacity
                style={styles.modalTermsCancelBtn}
                onPress={() => setShowTermsModal(false)}
              >
                <Text style={styles.modalTermsCancelText}>Xem lại bài hát</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalTermsConfirmBtn,
                  !agreedToTerms && styles.modalTermsConfirmBtnDisabled,
                ]}
                onPress={async () => {
                  if (!agreedToTerms) {
                    Alert.alert("Chưa đồng ý điều khoản", "Bạn phải tích chọn đồng ý với điều khoản bản quyền để tiếp tục xuất bản.");
                    return;
                  }
                  await executePublishSong();
                }}
                disabled={submittingSong}
              >
                {submittingSong ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalTermsConfirmText}>Đồng Ý & Xuất Bản 🚀</Text>
                )}
              </TouchableOpacity>
            </View>
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
  // Creator Analytics Styles
  analyticsSectionCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  analyticsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  analyticsTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: Colors.dark.text,
  },
  analyticsSub: {
    fontSize: 11,
    color: Colors.dark.textMuted,
    marginTop: 2,
  },
  weeklyTotalBadge: {
    backgroundColor: "rgba(6, 182, 212, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  weeklyTotalText: {
    color: Colors.dark.accent,
    fontSize: 11,
    fontWeight: "700",
  },
  chartContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 120,
    paddingTop: 16,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  chartCol: {
    alignItems: "center",
    flex: 1,
  },
  chartValText: {
    fontSize: 10,
    color: Colors.dark.textMuted,
    marginBottom: 4,
    fontWeight: "600",
  },
  chartBarBg: {
    width: 14,
    height: 70,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 7,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  chartBarFill: {
    width: "100%",
    backgroundColor: Colors.dark.primaryLight,
    borderRadius: 7,
  },
  chartBarFillTop: {
    backgroundColor: Colors.dark.accent,
  },
  chartDayText: {
    fontSize: 10,
    color: Colors.dark.textMuted,
    marginTop: 6,
    fontWeight: "600",
  },
  chartDayTextTop: {
    color: Colors.dark.accent,
    fontWeight: "800",
  },
  fanGiftCard: {
    marginTop: 14,
    backgroundColor: "rgba(245, 158, 11, 0.08)",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.25)",
  },
  fanGiftHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  fanGiftTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#f59e0b",
  },
  fanGiftSub: {
    fontSize: 10,
    color: Colors.dark.textMuted,
    marginTop: 2,
  },
  giftEarningsBox: {
    alignItems: "flex-end",
  },
  giftEarningsLabel: {
    fontSize: 9,
    color: Colors.dark.textMuted,
  },
  giftEarningsVal: {
    fontSize: 13,
    fontWeight: "800",
    color: "#10b981",
    marginTop: 1,
  },
  // Copyright Terms & Conditions Styles
  termsBox: {
    backgroundColor: "rgba(16, 185, 129, 0.08)",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.25)",
    marginBottom: 16,
  },
  termsBoxHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  termsBoxTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#10b981",
  },
  termsCheckboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 4,
  },
  termsCheckboxLabel: {
    flex: 1,
    fontSize: 12,
    color: Colors.dark.text,
    lineHeight: 18,
    fontWeight: "600",
  },
  viewTermsLinkBtn: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
  },
  viewTermsLinkText: {
    fontSize: 11,
    color: Colors.dark.accent,
    fontWeight: "700",
  },
  submitModalBtnNotAgreed: {
    backgroundColor: "rgba(236, 72, 153, 0.6)",
  },
  termsScrollContent: {
    maxHeight: 360,
    marginVertical: 12,
  },
  termsBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    borderRadius: 12,
    padding: 12,
    gap: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
  },
  termsBannerText: {
    flex: 1,
    fontSize: 12,
    color: "#f59e0b",
    lineHeight: 18,
    fontWeight: "600",
  },
  termArticle: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  termArticleHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  termArticleNumber: {
    fontSize: 11,
    fontWeight: "900",
    color: Colors.dark.primary,
    backgroundColor: "rgba(236, 72, 153, 0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  termArticleTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: Colors.dark.text,
    flex: 1,
  },
  termArticleBody: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    lineHeight: 18,
  },
  modalTermsCheckbox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(236, 72, 153, 0.1)",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.dark.primary,
    gap: 10,
    marginVertical: 10,
  },
  modalTermsCheckboxText: {
    flex: 1,
    fontSize: 12,
    color: Colors.dark.text,
    lineHeight: 18,
    fontWeight: "600",
  },
  modalTermsActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
  },
  modalTermsCancelBtn: {
    flex: 1,
    backgroundColor: Colors.dark.surface,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  modalTermsCancelText: {
    fontSize: 13,
    color: Colors.dark.textMuted,
    fontWeight: "700",
  },
  modalTermsConfirmBtn: {
    flex: 1.5,
    backgroundColor: Colors.dark.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  modalTermsConfirmBtnDisabled: {
    opacity: 0.5,
  },
  modalTermsConfirmText: {
    fontSize: 13,
    color: "#fff",
    fontWeight: "800",
  },
});

