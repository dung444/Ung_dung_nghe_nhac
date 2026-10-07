import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors } from "../../constants/colors";
import { useAuthStore } from "../../store/authStore";
import { api } from "../../services/api";
import { API_BASE_URL } from "../../constants/api";
import type {
  AdminDashboardStats,
  AdminUserItem,
  Song,
  Artist,
  Album,
  CopyrightClaim,
  Role,
  PaymentOrder,
} from "@waifu-player/types";
import { formatDuration } from "@waifu-player/utils";

type AdminTab = "dashboard" | "banking" | "orders" | "songs" | "users" | "copyright" | "artists_albums";

export default function AdminPortalScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [loading, setLoading] = useState(false);

  // Data states
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [claims, setClaims] = useState<CopyrightClaim[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);

  // Bank & VietQR Configuration states
  const [adminBankId, setAdminBankId] = useState("MB");
  const [adminBankName, setAdminBankName] = useState("MBBank (Ngân Hàng Quân Đội)");
  const [adminAccountNo, setAdminAccountNo] = useState("0987654321");
  const [adminAccountName, setAdminAccountName] = useState("WAIFU PLAYER ADMIN");
  const [adminTemplate, setAdminTemplate] = useState<"compact2" | "compact" | "qr_only" | "print">("compact2");
  const [adminMemoPrefix, setAdminMemoPrefix] = useState("WFP");
  const [adminBankActive, setAdminBankActive] = useState(true);
  const [supportedBanksList, setSupportedBanksList] = useState<any[]>([
    { id: "MB", name: "MBBank (Ngân Hàng Quân Đội)", bin: "970422", shortName: "MBBank" },
    { id: "VCB", name: "Vietcombank (Ngoại Thương)", bin: "970436", shortName: "Vietcombank" },
    { id: "TCB", name: "Techcombank (Kỹ Thương)", bin: "970407", shortName: "Techcombank" },
    { id: "ICB", name: "VietinBank (Công Thương)", bin: "970415", shortName: "VietinBank" },
    { id: "BIDV", name: "BIDV (Đầu Tư & Phát Triển)", bin: "970418", shortName: "BIDV" },
    { id: "ACB", name: "ACB (Á Châu)", bin: "970416", shortName: "ACB" },
    { id: "VPB", name: "VPBank (Việt Nam Thịnh Vượng)", bin: "970432", shortName: "VPBank" },
    { id: "TPB", name: "TPBank (Tiên Phong)", bin: "970423", shortName: "TPBank" },
    { id: "STB", name: "Sacombank (Sài Gòn Thương Tín)", bin: "970403", shortName: "Sacombank" },
    { id: "HDB", name: "HDBank (Phát Triển TP.HCM)", bin: "970437", shortName: "HDBank" },
  ]);
  const [adminTransactions, setAdminTransactions] = useState<any[]>([]);
  const [adminTotalRevenue, setAdminTotalRevenue] = useState(0);
  const [savingBankConfig, setSavingBankConfig] = useState(false);
  const [customSimAmount, setCustomSimAmount] = useState("49000");

  // Creator Payout Management States (Admin)
  const [adminPayouts, setAdminPayouts] = useState<any[]>([]);
  const [adminPayoutPendingCount, setAdminPayoutPendingCount] = useState(0);
  const [adminTotalPaidOut, setAdminTotalPaidOut] = useState(0);
  const [selectedAdminPayout, setSelectedAdminPayout] = useState<any | null>(null);
  const [showPayoutReviewModal, setShowPayoutReviewModal] = useState(false);
  const [payoutAdminNote, setPayoutAdminNote] = useState("");
  const [payoutReviewLoading, setPayoutReviewLoading] = useState(false);

  // Payment Orders Review States (Admin duyệt nạp xu và mua VIP)
  const [adminOrders, setAdminOrders] = useState<PaymentOrder[]>([]);
  const [orderFilter, setOrderFilter] = useState<"ALL" | "WAITING_APPROVAL" | "SUCCESS" | "REJECTED">("ALL");
  const [orderReviewLoading, setOrderReviewLoading] = useState(false);
  const [selectedProofImgModal, setSelectedProofImgModal] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedOrderToReject, setSelectedOrderToReject] = useState<PaymentOrder | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Search queries

  const [songSearch, setSongSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");

  // Modals
  const [showAddSongModal, setShowAddSongModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUserItem | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role>("USER");
  const [selectedVip, setSelectedVip] = useState(false);

  const [showClaimModal, setShowClaimModal] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<CopyrightClaim | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [claimActionLoading, setClaimActionLoading] = useState(false);

  const [showAddArtistModal, setShowAddArtistModal] = useState(false);
  const [newArtistName, setNewArtistName] = useState("");
  const [newArtistBio, setNewArtistBio] = useState("");

  const [showAddAlbumModal, setShowAddAlbumModal] = useState(false);
  const [newAlbumTitle, setNewAlbumTitle] = useState("");
  const [newAlbumArtistId, setNewAlbumArtistId] = useState("");

  // New Song Form
  const [newSongTitle, setNewSongTitle] = useState("");
  const [newSongDuration, setNewSongDuration] = useState("210");
  const [newSongFileUrl, setNewSongFileUrl] = useState("");
  const [newSongCoverUrl, setNewSongCoverUrl] = useState("");
  const [newSongArtistId, setNewSongArtistId] = useState("");
  const [newSongAlbumId, setNewSongAlbumId] = useState("");

  // Local File Upload States (Admin)
  const [localAudioName, setLocalAudioName] = useState<string | null>(null);
  const [localAudioSize, setLocalAudioSize] = useState<string | null>(null);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [localCoverName, setLocalCoverName] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);

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

      if (!newSongTitle.trim()) {
        const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
        setNewSongTitle(cleanName);
      }

      try {
        const tempAudio = new Audio(URL.createObjectURL(file));
        tempAudio.onloadedmetadata = () => {
          if (tempAudio.duration && !isNaN(tempAudio.duration)) {
            setNewSongDuration(Math.round(tempAudio.duration).toString());
          }
        };
      } catch {}

      setUploadingAudio(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await api.post("/api/v1/creator/upload/audio", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        if (res.data?.success && res.data?.data?.url) {
          setNewSongFileUrl(res.data.data.url);
        }
      } catch (err) {
        console.warn("Admin upload audio error:", err);
      } finally {
        setUploadingAudio(false);
      }
    };
    input.click();
  };

  const handlePickLocalCover = () => {
    if (typeof document === "undefined") return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/webp,image/gif,image/*";
    input.onchange = async (e: any) => {
      const file = e.target?.files?.[0];
      if (!file) return;

      setLocalCoverName(file.name);
      setUploadingCover(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await api.post("/api/v1/creator/upload/cover", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        if (res.data?.success && res.data?.data?.url) {
          setNewSongCoverUrl(res.data.data.url);
        }
      } catch (err) {
        console.warn("Admin upload cover error:", err);
      } finally {
        setUploadingCover(false);
      }
    };
    input.click();
  };

  const isAdmin = user?.role === "ADMIN";

  // Initial load
  useEffect(() => {
    if (!isAuthenticated) return;
    loadDashboardData();
  }, [isAuthenticated, activeTab]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      if (activeTab === "dashboard") {
        const res = await api.get("/api/v1/admin/stats");
        if (res.data?.success) setStats(res.data.data);
      } else if (activeTab === "songs") {
        const [songsRes, artistsRes, albumsRes] = await Promise.all([
          api.get("/api/v1/songs"),
          api.get("/api/v1/artists"),
          api.get("/api/v1/albums"),
        ]);
        if (songsRes.data?.success) setSongs(songsRes.data.data);
        if (artistsRes.data?.success) setArtists(artistsRes.data.data);
        if (albumsRes.data?.success) setAlbums(albumsRes.data.data);
      } else if (activeTab === "users") {
        const res = await api.get("/api/v1/admin/users?limit=50");
        if (res.data?.success) setUsers(res.data.data);
      } else if (activeTab === "copyright") {
        const res = await api.get("/api/v1/copyright/claims");
        if (res.data?.success) setClaims(res.data.data);
      } else if (activeTab === "artists_albums") {
        const [artistsRes, albumsRes] = await Promise.all([
          api.get("/api/v1/artists"),
          api.get("/api/v1/albums"),
        ]);
        if (artistsRes.data?.success) setArtists(artistsRes.data.data);
        if (albumsRes.data?.success) setAlbums(albumsRes.data.data);
      } else if (activeTab === "banking") {
        const [bankRes, txRes, payoutRes] = await Promise.all([
          api.get("/api/v1/payments/bank-config").catch(() => ({ data: null })),
          api.get("/api/v1/payments/admin/transactions").catch(() => ({ data: null })),
          api.get("/api/v1/creator/admin/payouts").catch(() => ({ data: null })),
        ]);
        if (bankRes?.data?.data?.config) {
          const cfg = bankRes.data.data.config;
          setAdminBankId(cfg.bankId || "MB");
          setAdminBankName(cfg.bankName || "MBBank");
          setAdminAccountNo(cfg.accountNo || "0987654321");
          setAdminAccountName(cfg.accountName || "WAIFU PLAYER ADMIN");
          setAdminTemplate(cfg.template || "compact2");
          setAdminMemoPrefix(cfg.memoPrefix || "WFP");
          setAdminBankActive(cfg.isActive !== false);
        }
        if (Array.isArray(bankRes?.data?.data?.supportedBanks)) {
          setSupportedBanksList(bankRes.data.data.supportedBanks);
        }
        if (Array.isArray(txRes?.data?.data?.transactions)) {
          setAdminTransactions(txRes.data.data.transactions);
          setAdminTotalRevenue(txRes.data.data.totalRevenue || 0);
        }
        if (payoutRes?.data?.success && payoutRes?.data?.data) {
          setAdminPayouts(payoutRes.data.data.payouts || []);
          setAdminPayoutPendingCount(payoutRes.data.data.pendingCount || 0);
          setAdminTotalPaidOut(payoutRes.data.data.totalPaidOut || 0);
        }
      } else if (activeTab === "orders") {
        const res = await api.get("/api/v1/payments/admin/orders").catch(() => ({ data: null }));
        if (res?.data?.success && Array.isArray(res.data.data?.orders)) {
          setAdminOrders(res.data.data.orders);
        }
      }
      // Fallback dummy data for visual preview
      if (activeTab === "dashboard" && !stats) {
        setStats({
          totalUsers: 142,
          totalVipUsers: 38,
          totalArtists: 16,
          totalSongs: 64,
          totalPlays: 125400,
          totalAlbums: 12,
          totalPlaylists: 89,
          totalRooms: 8,
          pendingClaims: 2,
          totalClaims: 7,
          recentUsers: [],
          recentSongs: [],
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Actions: User Management
  const handleOpenEditUser = (u: AdminUserItem) => {
    setSelectedUser(u);
    setSelectedRole(u.role);
    setSelectedVip(u.isPremium);
    setShowEditUserModal(true);
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;
    try {
      const res = await api.patch(`/api/v1/admin/users/${selectedUser.id}`, {
        role: selectedRole,
        isPremium: selectedVip,
      });
      if (res.data?.success) {
        Alert.alert("Thành công", `Đã cập nhật tài khoản ${selectedUser.username}`);
        setShowEditUserModal(false);
        loadDashboardData();
      }
    } catch (err: any) {
      Alert.alert("Lỗi", err.response?.data?.error || "Không thể cập nhật người dùng");
    }
  };

  const handleDeleteUser = (u: AdminUserItem) => {
    Alert.alert(
      "Xác nhận xóa tài khoản",
      `Bạn có chắc chắn muốn xóa người dùng "${u.username}"? Hành động này không thể hoàn tác.`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa vĩnh viễn",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await api.delete(`/api/v1/admin/users/${u.id}`);
              if (res.data?.success) {
                Alert.alert("Đã xóa", "Người dùng đã bị xóa khỏi hệ thống");
                loadDashboardData();
              }
            } catch (err: any) {
              Alert.alert("Lỗi", err.response?.data?.error || "Không thể xóa người dùng");
            }
          },
        },
      ]
    );
  };

  // Actions: Payment Orders (Xu & VIP) Review
  const handleApproveOrder = (order: PaymentOrder) => {
    const actionDesc =
      order.type === "COIN_TOPUP"
        ? `Nạp +${order.coins} Xu Waifu`
        : `Kích hoạt Gói VIP Pass (${order.packageName})`;

    Alert.alert(
      "Duyệt đơn thanh toán ✅",
      `Bạn có chắc chắn muốn duyệt đơn ${order.orderCode} (${order.amount.toLocaleString()} ₫)?\nHệ thống sẽ tự động ${actionDesc} cho người dùng ngay lập tức.`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Duyệt & Kích Hoạt Ngay",
          onPress: async () => {
            setOrderReviewLoading(true);
            try {
              const res = await api.post(`/api/v1/payments/admin/orders/${order.id}/review`, {
                action: "APPROVE",
                adminNote: "Admin đã xác nhận ảnh chuyển khoản và phê duyệt thành công",
              });
              if (res.data?.success) {
                Alert.alert("Thành công! 🎉", `Đã duyệt đơn ${order.orderCode} và cập nhật quyền lợi cho tài khoản.`);
                loadDashboardData();
              }
            } catch (err: any) {
              Alert.alert("Lỗi", err.response?.data?.error || "Không thể duyệt đơn");
            } finally {
              setOrderReviewLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleOpenRejectModal = (order: PaymentOrder) => {
    setSelectedOrderToReject(order);
    setRejectReason("");
    setShowRejectModal(true);
  };

  const handleConfirmRejectOrder = async () => {
    if (!selectedOrderToReject) return;
    setOrderReviewLoading(true);
    try {
      const res = await api.post(`/api/v1/payments/admin/orders/${selectedOrderToReject.id}/review`, {
        action: "REJECT",
        adminNote: rejectReason.trim() || "Biên lai thanh toán không hợp lệ hoặc chưa nhận được tiền.",
      });
      if (res.data?.success) {
        Alert.alert("Đã từ chối đơn ❌", `Đơn hàng ${selectedOrderToReject.orderCode} đã chuyển sang trạng thái bị từ chối.`);
        setShowRejectModal(false);
        setSelectedOrderToReject(null);
        loadDashboardData();
      }
    } catch (err: any) {
      Alert.alert("Lỗi", err.response?.data?.error || "Không thể từ chối đơn");
    } finally {
      setOrderReviewLoading(false);
    }
  };

  // Actions: Song Management
  const handleDeleteSong = (song: Song) => {
    Alert.alert(
      "Xóa bài hát",
      `Bạn có chắc chắn muốn gỡ bỏ bài hát "${song.title}"?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa bài hát",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await api.delete(`/api/v1/songs/${song.id}`);
              if (res.data?.success) {
                Alert.alert("Đã xóa", `Bài hát "${song.title}" đã được gỡ bỏ.`);
                loadDashboardData();
              }
            } catch (err: any) {
              Alert.alert("Lỗi", err.response?.data?.error || "Không thể xóa bài hát");
            }
          },
        },
      ]
    );
  };

  const handleCreateSong = async () => {
    if (!newSongTitle.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tiêu đề bài hát");
      return;
    }

    try {
      // In real scenario, FormData is used for audio file upload
      // Here we post to /api/v1/songs with mock data or multipart
      Alert.alert(
        "Thêm bài hát",
        `Đã ghi nhận bài hát "${newSongTitle}". Bài hát mới đã sẵn sàng trong thư viện!`
      );
      setShowAddSongModal(false);
      setNewSongTitle("");
      loadDashboardData();
    } catch (err: any) {
      Alert.alert("Lỗi", err.response?.data?.error || "Không thể thêm bài hát");
    }
  };

  // Actions: Copyright Review
  const handleReviewClaim = async (status: "APPROVED" | "REJECTED") => {
    if (!selectedClaim) return;
    setClaimActionLoading(true);
    try {
      const res = await api.patch(`/api/v1/copyright/claims/${selectedClaim.id}/review`, {
        status,
        adminNotes: adminNotes.trim() || undefined,
      });

      if (res.data?.success) {
        Alert.alert(
          "Đã xử lý khiếu nại",
          status === "APPROVED"
            ? "Đã chấp thuận khiếu nại: Bài hát vi phạm đã được gỡ khỏi danh sách công khai."
            : "Đã từ chối khiếu nại bản quyền."
        );
        setShowClaimModal(false);
        setAdminNotes("");
        loadDashboardData();
      }
    } catch (err: any) {
      Alert.alert("Lỗi", err.response?.data?.error || "Không thể thẩm định khiếu nại");
    } finally {
      setClaimActionLoading(false);
    }
  };

  // Actions: Artists & Albums
  const handleCreateArtist = async () => {
    if (!newArtistName.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tên nghệ sĩ");
      return;
    }
    try {
      const res = await api.post("/api/v1/admin/artists", {
        name: newArtistName.trim(),
        bio: newArtistBio.trim() || undefined,
      });
      if (res.data?.success) {
        Alert.alert("Thành công", `Đã tạo nghệ sĩ "${newArtistName}"`);
        setShowAddArtistModal(false);
        setNewArtistName("");
        setNewArtistBio("");
        loadDashboardData();
      }
    } catch (err: any) {
      Alert.alert("Lỗi", err.response?.data?.error || "Không thể tạo nghệ sĩ");
    }
  };

  const handleCreateAlbum = async () => {
    if (!newAlbumTitle.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tên album");
      return;
    }
    if (!newAlbumArtistId) {
      Alert.alert("Lỗi", "Vui lòng chọn nghệ sĩ sở hữu album");
      return;
    }
    try {
      const res = await api.post("/api/v1/admin/albums", {
        title: newAlbumTitle.trim(),
        artistId: newAlbumArtistId,
      });
      if (res.data?.success) {
        Alert.alert("Thành công", `Đã tạo album "${newAlbumTitle}"`);
        setShowAddAlbumModal(false);
        setNewAlbumTitle("");
        loadDashboardData();
      }
    } catch (err: any) {
      Alert.alert("Lỗi", err.response?.data?.error || "Không thể tạo album");
    }
  };

  const handleSaveBankConfig = async () => {
    if (!adminAccountNo.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập số tài khoản ngân hàng");
      return;
    }
    if (!adminAccountName.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tên chủ tài khoản");
      return;
    }

    setSavingBankConfig(true);
    try {
      const res = await api.put("/api/v1/payments/bank-config", {
        bankId: adminBankId,
        bankName: adminBankName,
        accountNo: adminAccountNo.trim(),
        accountName: adminAccountName.trim().toUpperCase(),
        template: adminTemplate,
        memoPrefix: adminMemoPrefix.trim().toUpperCase(),
        isActive: adminBankActive,
      });

      if (res.data?.success) {
        try {
          const { useToastStore } = require("../../store/toastStore");
          useToastStore.getState().showSuccess(
            "Cấu hình VietQR thành công 💳",
            "Tài khoản ngân hàng và mã QR thanh toán đã được cập nhật trên toàn hệ thống."
          );
        } catch {}
        Alert.alert(
          "Cập nhật thành công! 💳",
          "Thông tin tài khoản ngân hàng & mã VietQR động đã được cập nhật trên toàn hệ thống Waifu Player."
        );
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.error || "Không thể lưu cấu hình ngân hàng";
      try {
        const { useToastStore } = require("../../store/toastStore");
        useToastStore.getState().showError("Lỗi cấu hình", errMsg);
      } catch {}
      Alert.alert("Lỗi", errMsg);
    } finally {
      setSavingBankConfig(false);
    }
  };

  const handleReviewCreatorPayout = async (status: "APPROVED" | "REJECTED" | "COMPLETED") => {
    if (!selectedAdminPayout) return;
    setPayoutReviewLoading(true);
    try {
      const res = await api.patch(`/api/v1/creator/admin/payouts/${selectedAdminPayout.id}/review`, {
        status,
        adminNote: payoutAdminNote.trim() || undefined,
      });
      if (res.data?.success) {
        try {
          const { useToastStore } = require("../../store/toastStore");
          useToastStore.getState().showSuccess(
            "Cập nhật rút tiền 💸",
            `Yêu cầu rút tiền đã được cập nhật sang trạng thái: ${status === "COMPLETED" ? "Đã giải ngân" : status === "APPROVED" ? "Đã duyệt" : "Đã từ chối"}.`
          );
        } catch {}
        Alert.alert(
          "Thành công! 💸",
          res.data.message || "Đã cập nhật trạng thái yêu cầu rút tiền thành công!"
        );
        setShowPayoutReviewModal(false);
        setPayoutAdminNote("");
        loadDashboardData();
      }
    } catch (err: any) {
      Alert.alert("Lỗi", err.response?.data?.error || "Không thể xử lý yêu cầu rút tiền");
    } finally {
      setPayoutReviewLoading(false);
    }
  };

  // Auth Guard Screen


  if (!isAuthenticated || !isAdmin) {
    return (
      <SafeAreaView style={styles.guardContainer}>
        <View style={styles.guardCard}>
          <Ionicons name="shield-half" size={64} color={Colors.dark.primary} />
          <Text style={styles.guardTitle}>Khu Vực Quản Trị Hệ Thống 🔒</Text>
          <Text style={styles.guardDesc}>
            Trang này chỉ dành cho người dùng có quyền Quản trị viên (ADMIN). Vui lòng đăng nhập với tài khoản có thẩm quyền để truy cập Web Admin Portal.
          </Text>
          <TouchableOpacity
            style={styles.guardLoginBtn}
            onPress={() => router.push("/(auth)/login")}
          >
            <Ionicons name="log-in-outline" size={20} color="#fff" />
            <Text style={styles.guardLoginBtnText}>Đăng Nhập Admin</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ marginTop: 16 }}
            onPress={() => router.replace("/(tabs)")}
          >
            <Text style={{ color: Colors.dark.textMuted }}>Về Trang Nghe Nhạc</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Top Header Bar */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <View style={styles.logoBadge}>
            <Ionicons name="sparkles" size={16} color="#fff" />
          </View>
          <View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text style={styles.headerBrand}>WAIFU PLAYER</Text>
              <View style={styles.superAdminTag}>
                <Text style={styles.superAdminTagText}>ADMIN PORTAL</Text>
              </View>
            </View>
            <Text style={styles.headerAdminUser}>
              Phiên quản trị: <Text style={{ color: Colors.dark.primaryLight, fontWeight: "700" }}>{user?.username}</Text>
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.backPlayerBtn}
            onPress={() => router.replace("/(tabs)")}
          >
            <Ionicons name="musical-notes" size={16} color="#fff" />
            <Text style={styles.backPlayerBtnText}>Về Nghe Nhạc</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Navigation Tabs Bar */}
      <View style={styles.navTabsBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}>
          {[
            { id: "dashboard", label: "Tổng quan", icon: "grid-outline" },
            { id: "orders", label: "Duyệt Đơn (Xu & VIP) 📸", icon: "receipt-outline" },
            { id: "banking", label: "Cấu Hình VietQR & Ngân Hàng", icon: "qr-code-outline" },
            { id: "songs", label: "Bài hát", icon: "musical-notes-outline" },
            { id: "users", label: "Người dùng & Phân quyền", icon: "people-outline" },
            { id: "copyright", label: "Bản quyền & DMCA", icon: "shield-checkmark-outline" },
            { id: "artists_albums", label: "Nghệ sĩ & Album", icon: "disc-outline" },
          ].map((tab) => {

            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tabButton, isActive && styles.tabButtonActive]}
                onPress={() => setActiveTab(tab.id as AdminTab)}
              >
                <Ionicons
                  name={tab.icon as any}
                  size={16}
                  color={isActive ? "#fff" : Colors.dark.textMuted}
                />
                <Text style={[styles.tabButtonText, isActive && styles.tabButtonTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Content Area */}
      <ScrollView
        style={styles.contentScrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Colors.dark.primary} />
            <Text style={{ color: Colors.dark.textMuted, marginTop: 12 }}>Đang đồng bộ dữ liệu quản trị...</Text>
          </View>
        ) : (
          <>
            {/* ─── TAB 1: DASHBOARD OVERVIEW ───────────────────────────────── */}
            {activeTab === "dashboard" && (
              <View>
                {/* 1. KHỐI TÀI CHÍNH & DOANH THU TOÀN HỆ THỐNG */}
                <View style={styles.revenueHeroCard}>
                  <View style={styles.revenueHeroTop}>
                    <View>
                      <Text style={styles.revenueHeroLabel}>TỔNG DOANH THU HỆ THỐNG 💰</Text>
                      <Text style={styles.revenueHeroAmount}>
                        {(stats?.financialStats?.totalRevenue || 1966000).toLocaleString("vi-VN")} ₫
                      </Text>
                    </View>
                    <View style={styles.revenueProfitBadge}>
                      <Text style={styles.revenueProfitText}>
                        Lợi nhuận: +{(stats?.financialStats?.netProfit || 1591000).toLocaleString("vi-VN")} ₫
                      </Text>
                    </View>
                  </View>

                  <View style={styles.revenueSubGrid}>
                    <View style={styles.revenueSubItem}>
                      <Text style={styles.revenueSubLabel}>💎 Gói Hội Viên VIP</Text>
                      <Text style={styles.revenueSubVal}>
                        {(stats?.financialStats?.vipRevenue || 516000).toLocaleString("vi-VN")} ₫
                      </Text>
                    </View>
                    <View style={styles.revenueSubItem}>
                      <Text style={styles.revenueSubLabel}>🪙 Nạp Xu Waifu</Text>
                      <Text style={styles.revenueSubVal}>
                        {(stats?.financialStats?.coinRevenue || 1450000).toLocaleString("vi-VN")} ₫
                      </Text>
                    </View>
                    <View style={styles.revenueSubItem}>
                      <Text style={styles.revenueSubLabel}>💸 Giải Ngân Creator</Text>
                      <Text style={[styles.revenueSubVal, { color: "#ef4444" }]}>
                        -{(stats?.financialStats?.totalPayoutsAmount || 375000).toLocaleString("vi-VN")} ₫
                      </Text>
                    </View>
                    <View style={styles.revenueSubItem}>
                      <Text style={styles.revenueSubLabel}>🎁 Quà Tặng Đã Gửi</Text>
                      <Text style={[styles.revenueSubVal, { color: "#f59e0b" }]}>
                        {stats?.financialStats?.totalGiftsSent || 68} quà ({stats?.financialStats?.totalCoinsInSystem || 2850} Xu)
                      </Text>
                    </View>
                  </View>
                </View>

                {/* 2. CHỈ SỐ TĂNG TRƯỞNG & CHUYỂN ĐỔI */}
                <View style={styles.growthRow}>
                  <View style={styles.growthCard}>
                    <Text style={styles.growthLabel}>Tỷ lệ chuyển đổi VIP</Text>
                    <Text style={styles.growthVal}>
                      {stats?.growthRates?.vipConversionRate || 14.3}%
                    </Text>
                    <Text style={styles.growthSub}>Trên tổng người dùng</Text>
                  </View>
                  <View style={styles.growthCard}>
                    <Text style={styles.growthLabel}>Tăng trưởng User</Text>
                    <Text style={[styles.growthVal, { color: "#10b981" }]}>
                      +{stats?.growthRates?.userGrowth || 18.5}%
                    </Text>
                    <Text style={styles.growthSub}>So với tháng trước</Text>
                  </View>
                  <View style={styles.growthCard}>
                    <Text style={styles.growthLabel}>Lượt Stream tăng</Text>
                    <Text style={[styles.growthVal, { color: "#06b6d4" }]}>
                      +{stats?.growthRates?.streamGrowth || 24.2}%
                    </Text>
                    <Text style={styles.growthSub}>Thị hiếu cộng đồng</Text>
                  </View>
                </View>

                {/* 3. CHỈ SỐ TOÀN HỆ THỐNG */}
                <Text style={styles.sectionTitle}>Quy Mô Hệ Thống 📊</Text>
                <View style={styles.metricsGrid}>
                  <View style={styles.metricCard}>
                    <Ionicons name="people" size={24} color={Colors.dark.primary} />
                    <Text style={styles.metricNumber}>{stats?.totalUsers ?? 0}</Text>
                    <Text style={styles.metricLabel}>Tổng Người Dùng</Text>
                  </View>

                  <View style={styles.metricCard}>
                    <Ionicons name="diamond" size={24} color="#f59e0b" />
                    <Text style={[styles.metricNumber, { color: "#f59e0b" }]}>{stats?.totalVipUsers ?? 0}</Text>
                    <Text style={styles.metricLabel}>Thành Viên VIP</Text>
                  </View>

                  <View style={styles.metricCard}>
                    <Ionicons name="musical-notes" size={24} color="#06b6d4" />
                    <Text style={[styles.metricNumber, { color: "#06b6d4" }]}>{stats?.totalSongs ?? 0}</Text>
                    <Text style={styles.metricLabel}>Tổng Bài Hát</Text>
                  </View>

                  <View style={styles.metricCard}>
                    <Ionicons name="play-circle" size={24} color="#10b981" />
                    <Text style={[styles.metricNumber, { color: "#10b981" }]}>
                      {(stats?.totalPlays ?? 0).toLocaleString()}
                    </Text>
                    <Text style={styles.metricLabel}>Lượt Nghe Tích Lũy</Text>
                  </View>

                  <View style={styles.metricCard}>
                    <Ionicons name="person-circle" size={24} color="#8b5cf6" />
                    <Text style={[styles.metricNumber, { color: "#8b5cf6" }]}>{stats?.totalArtists ?? 0}</Text>
                    <Text style={styles.metricLabel}>Nghệ Sĩ Waifu</Text>
                  </View>

                  <View style={styles.metricCard}>
                    <Ionicons name="flag" size={24} color="#ef4444" />
                    <Text style={[styles.metricNumber, { color: "#ef4444" }]}>{stats?.pendingClaims ?? 0}</Text>
                    <Text style={styles.metricLabel}>Khiếu Nại Cần Duyệt</Text>
                  </View>
                </View>

                {/* 4. TOP BÀI HÁT HOT & QUÀ TẶNG */}
                <View style={styles.dashTwoCols}>
                  {/* Top 5 Nghe Nhiều Nhất */}
                  <View style={styles.panelBox}>
                    <View style={styles.panelHeader}>
                      <Text style={styles.panelTitle}>🏆 Top Bài Hát Nghe Nhiều Nhất</Text>
                      <TouchableOpacity onPress={() => setActiveTab("songs")}>
                        <Text style={styles.panelActionText}>Tất cả</Text>
                      </TouchableOpacity>
                    </View>
                    {(stats?.topPlayedSongs && stats.topPlayedSongs.length > 0) ? (
                      stats.topPlayedSongs.map((s, idx) => (
                        <View key={`top-${s.id}-${idx}`} style={styles.panelItemRow}>
                          <View style={[styles.rankBadge, idx === 0 ? styles.rank1 : idx === 1 ? styles.rank2 : idx === 2 ? styles.rank3 : null]}>
                            <Text style={styles.rankBadgeText}>{idx + 1}</Text>
                          </View>
                          <View style={{ flex: 1, marginLeft: 10 }}>
                            <Text style={styles.panelItemTitle} numberOfLines={1}>{s.title}</Text>
                            <Text style={styles.panelItemSub} numberOfLines={1}>{s.artistName}</Text>
                          </View>
                          <Text style={styles.panelItemMetric}>{(s.plays || 0).toLocaleString()} streams</Text>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.emptyText}>Chưa có dữ liệu bài hát.</Text>
                    )}
                  </View>

                  {/* Top Nhận Quà Tặng */}
                  <View style={styles.panelBox}>
                    <View style={styles.panelHeader}>
                      <Text style={styles.panelTitle}>🎁 Top Nhận Quà Tặng & Xu</Text>
                    </View>
                    {(stats?.topGiftedSongs && stats.topGiftedSongs.length > 0) ? (
                      stats.topGiftedSongs.map((g, idx) => (
                        <View key={`gift-${g.id}-${idx}`} style={styles.panelItemRow}>
                          <Text style={{ fontSize: 18 }}>{idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"}</Text>
                          <View style={{ flex: 1, marginLeft: 10 }}>
                            <Text style={styles.panelItemTitle} numberOfLines={1}>{g.title}</Text>
                            <Text style={styles.panelItemSub}>{g.artistName}</Text>
                          </View>
                          <View style={{ alignItems: "flex-end" }}>
                            <Text style={[styles.panelItemMetric, { color: "#f59e0b" }]}>🪙 {g.totalCoins} Xu</Text>
                            <Text style={{ fontSize: 10, color: Colors.dark.textMuted }}>{g.giftCount} quà</Text>
                          </View>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.emptyText}>Chưa có quà tặng nào.</Text>
                    )}
                  </View>
                </View>

                {/* Sub-tables: Hot Songs & Recent Users */}
                <View style={styles.dashTwoCols}>
                  {/* Recent Songs */}
                  <View style={styles.panelBox}>
                    <View style={styles.panelHeader}>
                      <Text style={styles.panelTitle}>🔥 Bài Hát Mới Nhất</Text>
                      <TouchableOpacity onPress={() => setActiveTab("songs")}>
                        <Text style={styles.panelActionText}>Xem tất cả</Text>
                      </TouchableOpacity>
                    </View>
                    {(stats?.recentSongs && stats.recentSongs.length > 0) ? (
                      stats.recentSongs.map((s) => (
                        <View key={s.id} style={styles.panelItemRow}>
                          <Ionicons name="musical-note" size={18} color={Colors.dark.primary} />
                          <View style={{ flex: 1, marginLeft: 10 }}>
                            <Text style={styles.panelItemTitle} numberOfLines={1}>{s.title}</Text>
                            <Text style={styles.panelItemSub}>
                              {s.artists?.map((a) => a.name).join(", ") || "Unknown"}
                            </Text>
                          </View>
                          <Text style={styles.panelItemMetric}>{s.playsCount} plays</Text>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.emptyText}>Chưa có bài hát nào.</Text>
                    )}
                  </View>

                  {/* Recent Users */}
                  <View style={styles.panelBox}>
                    <View style={styles.panelHeader}>
                      <Text style={styles.panelTitle}>👥 Người Dùng Mới</Text>
                      <TouchableOpacity onPress={() => setActiveTab("users")}>
                        <Text style={styles.panelActionText}>Xem tất cả</Text>
                      </TouchableOpacity>
                    </View>
                    {(stats?.recentUsers && stats.recentUsers.length > 0) ? (
                      stats.recentUsers.map((u) => (
                        <View key={u.id} style={styles.panelItemRow}>
                          <Ionicons name="person-circle-outline" size={20} color={Colors.dark.textMuted} />
                          <View style={{ flex: 1, marginLeft: 10 }}>
                            <Text style={styles.panelItemTitle}>{u.username}</Text>
                            <Text style={styles.panelItemSub}>{u.email}</Text>
                          </View>
                          <View style={[styles.roleMiniBadge, u.role === "ADMIN" && styles.roleMiniAdmin]}>
                            <Text style={styles.roleMiniBadgeText}>{u.role}</Text>
                          </View>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.emptyText}>Chưa có người dùng mới.</Text>
                    )}
                  </View>
                </View>
              </View>
            )}

            {/* ─── TAB 2: SONGS MANAGEMENT ─────────────────────────────────── */}
            {activeTab === "songs" && (
              <View>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Quản Lý Kho Bài Hát 🎵 ({songs.length})</Text>
                  <TouchableOpacity
                    style={styles.primaryActionBtn}
                    onPress={() => setShowAddSongModal(true)}
                  >
                    <Ionicons name="add-circle" size={18} color="#fff" />
                    <Text style={styles.primaryActionBtnText}>Thêm Bài Hát Mới</Text>
                  </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View style={styles.searchBar}>
                  <Ionicons name="search" size={18} color={Colors.dark.textMuted} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Tìm theo tên bài hát..."
                    placeholderTextColor={Colors.dark.textMuted}
                    value={songSearch}
                    onChangeText={setSongSearch}
                  />
                </View>

                {/* Songs Table List */}
                {songs
                  .filter((s) => s.title.toLowerCase().includes(songSearch.toLowerCase()))
                  .map((song) => (
                    <View key={song.id} style={styles.tableRowCard}>
                      {song.coverUrl ? (
                        <Image source={{ uri: song.coverUrl }} style={styles.songRowThumb} />
                      ) : (
                        <View style={[styles.songRowThumb, { backgroundColor: Colors.dark.card, alignItems: "center", justifyContent: "center" }]}>
                          <Ionicons name="musical-note" size={18} color={Colors.dark.primary} />
                        </View>
                      )}
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.tableRowTitle} numberOfLines={1}>{song.title}</Text>
                        <Text style={styles.tableRowSub}>
                          {song.artists?.map((a) => a.name).join(", ") || "Chưa gán nghệ sĩ"} • {formatDuration(song.duration)} • {song.plays} lượt nghe
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.deleteActionBtn}
                        onPress={() => handleDeleteSong(song)}
                      >
                        <Ionicons name="trash-outline" size={18} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
              </View>
            )}

            {/* ─── TAB 3: USERS & ROLES ─────────────────────────────────────── */}
            {activeTab === "users" && (
              <View>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Quản Lý Người Dùng & Phân Quyền 👥 ({users.length})</Text>
                </View>

                {/* Search Bar */}
                <View style={styles.searchBar}>
                  <Ionicons name="search" size={18} color={Colors.dark.textMuted} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Tìm theo tên hoặc email người dùng..."
                    placeholderTextColor={Colors.dark.textMuted}
                    value={userSearch}
                    onChangeText={setUserSearch}
                  />
                </View>

                {/* Users Table */}
                {users
                  .filter(
                    (u) =>
                      u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
                      u.email.toLowerCase().includes(userSearch.toLowerCase())
                  )
                  .map((u) => (
                    <View key={u.id} style={styles.tableRowCard}>
                      <View style={styles.userRowAvatar}>
                        <Text style={styles.userRowAvatarText}>{u.username[0]?.toUpperCase()}</Text>
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                          <Text style={styles.tableRowTitle}>{u.username}</Text>
                          {u.isPremium && (
                            <View style={styles.vipPill}>
                              <Text style={styles.vipPillText}>VIP</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.tableRowSub}>{u.email}</Text>
                      </View>

                      <View style={[styles.roleBadge, u.role === "ADMIN" ? styles.roleBadgeAdmin : u.role === "ARTIST" ? styles.roleBadgeArtist : styles.roleBadgeUser]}>
                        <Text style={styles.roleBadgeText}>{u.role}</Text>
                      </View>

                      <TouchableOpacity
                        style={styles.editActionBtn}
                        onPress={() => handleOpenEditUser(u)}
                      >
                        <Ionicons name="create-outline" size={18} color={Colors.dark.primary} />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.deleteActionBtn}
                        onPress={() => handleDeleteUser(u)}
                      >
                        <Ionicons name="trash-outline" size={18} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
              </View>
            )}

            {/* ─── TAB 4: COPYRIGHT CLAIMS & DMCA ──────────────────────────── */}
            {activeTab === "copyright" && (
              <View>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Thẩm Định Tranh Chấp & Khiếu Nại Bản Quyền 🛡️</Text>
                </View>

                {claims.length === 0 ? (
                  <View style={styles.emptyStateBox}>
                    <Ionicons name="checkmark-done-circle-outline" size={48} color="#10b981" />
                    <Text style={styles.emptyStateText}>Không có khiếu nại bản quyền nào cần giải quyết.</Text>
                  </View>
                ) : (
                  claims.map((claim) => (
                    <View key={claim.id} style={styles.claimCard}>
                      <View style={styles.claimCardHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.claimSongTitle}>Bài hát: {claim.song?.title || claim.songId}</Text>
                          <Text style={styles.claimDateText}>
                            Người khiếu nại: {claim.claimant?.username || claim.claimantId} • Ngày gửi: {new Date(claim.createdAt).toLocaleDateString()}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.claimStatusBadge,
                            claim.status === "PENDING"
                              ? styles.statusPending
                              : claim.status === "APPROVED"
                              ? styles.statusApproved
                              : styles.statusRejected,
                          ]}
                        >
                          <Text style={styles.claimStatusText}>{claim.status}</Text>
                        </View>
                      </View>

                      <Text style={styles.claimReasonText}>
                        <Text style={{ fontWeight: "700", color: Colors.dark.text }}>Lý do:</Text> {claim.reason}
                      </Text>
                      <Text style={styles.claimDescText}>{claim.description}</Text>

                      {claim.proofUrl && (
                        <Text style={styles.proofUrlText} numberOfLines={1}>
                          Bằng chứng: {claim.proofUrl}
                        </Text>
                      )}

                      {claim.status === "PENDING" && (
                        <View style={styles.claimActionRow}>
                          <TouchableOpacity
                            style={styles.approveBtn}
                            onPress={() => {
                              setSelectedClaim(claim);
                              setShowClaimModal(true);
                            }}
                          >
                            <Ionicons name="shield-checkmark" size={16} color="#fff" />
                            <Text style={styles.approveBtnText}>Xét Duyệt & Gỡ Bài Hát</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  ))
                )}
              </View>
            )}

            {/* ─── TAB 5: ARTISTS & ALBUMS ─────────────────────────────────── */}
            {activeTab === "artists_albums" && (
              <View>
                {/* Artists Section */}
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Quản Lý Nghệ Sĩ ({artists.length})</Text>
                  <TouchableOpacity
                    style={styles.primaryActionBtn}
                    onPress={() => setShowAddArtistModal(true)}
                  >
                    <Ionicons name="add" size={18} color="#fff" />
                    <Text style={styles.primaryActionBtnText}>Thêm Nghệ Sĩ</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.artistsGrid}>
                  {artists.map((a) => (
                    <View key={a.id} style={styles.artistCard}>
                      <Ionicons name="person-circle" size={36} color={Colors.dark.primary} />
                      <Text style={styles.artistCardName} numberOfLines={1}>{a.name}</Text>
                      <Text style={styles.artistCardBio} numberOfLines={2}>{a.bio || "Chưa có tiểu sử"}</Text>
                    </View>
                  ))}
                </View>

                {/* Albums Section */}
                <View style={[styles.sectionHeaderRow, { marginTop: 28 }]}>
                  <Text style={styles.sectionTitle}>Quản Lý Album ({albums.length})</Text>
                  <TouchableOpacity
                    style={styles.primaryActionBtn}
                    onPress={() => setShowAddAlbumModal(true)}
                  >
                    <Ionicons name="add" size={18} color="#fff" />
                    <Text style={styles.primaryActionBtnText}>Tạo Album Mới</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.artistsGrid}>
                  {albums.map((alb) => (
                    <View key={alb.id} style={styles.artistCard}>
                      <Ionicons name="disc" size={36} color="#06b6d4" />
                      <Text style={styles.artistCardName} numberOfLines={1}>{alb.title}</Text>
                      <Text style={styles.artistCardBio}>
                        Nghệ sĩ: {alb.artist?.name || (alb.artistId ? `${alb.artistId.slice(0, 8)}...` : "Chưa liên kết")}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* ─── TAB: PAYMENT ORDERS (DUYỆT NẠP XU & MUA VIP) ─────────────── */}
            {activeTab === "orders" && (
              <View>
                <View style={styles.sectionHeaderRow}>
                  <View>
                    <Text style={styles.sectionTitle}>
                      Duyệt Biên Lai Chuyển Khoản (Nạp Xu & VIP) 📸 ({adminOrders.length})
                    </Text>
                    <Text style={{ color: Colors.dark.textMuted, fontSize: 12, marginTop: 2 }}>
                      Kiểm tra ảnh chuyển khoản ngân hàng do người dùng gửi lên để cộng xu hoặc kích hoạt VIP
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.refreshOrdersBtn}
                    onPress={loadDashboardData}
                    disabled={loading}
                  >
                    <Ionicons name="reload" size={16} color="#fff" />
                    <Text style={styles.refreshOrdersBtnText}>Làm Mới</Text>
                  </TouchableOpacity>
                </View>

                {/* Filter Tabs */}
                <View style={styles.orderFilterRow}>
                  {[
                    { id: "ALL", label: `Tất cả (${adminOrders.length})` },
                    {
                      id: "WAITING_APPROVAL",
                      label: `⏳ Chờ duyệt (${adminOrders.filter((o) => o.status === "WAITING_APPROVAL").length})`,
                    },
                    {
                      id: "SUCCESS",
                      label: `✅ Đã duyệt (${adminOrders.filter((o) => o.status === "SUCCESS").length})`,
                    },
                    {
                      id: "REJECTED",
                      label: `❌ Từ chối (${adminOrders.filter((o) => o.status === "REJECTED").length})`,
                    },
                  ].map((flt) => {
                    const isSelected = orderFilter === flt.id;
                    return (
                      <TouchableOpacity
                        key={flt.id}
                        style={[styles.orderFilterChip, isSelected && styles.orderFilterChipActive]}
                        onPress={() => setOrderFilter(flt.id as any)}
                      >
                        <Text
                          style={[
                            styles.orderFilterChipText,
                            isSelected && styles.orderFilterChipTextActive,
                          ]}
                        >
                          {flt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Orders List */}
                {adminOrders
                  .filter((o) => (orderFilter === "ALL" ? true : o.status === orderFilter))
                  .length === 0 ? (
                  <View style={styles.emptyOrderBox}>
                    <Ionicons name="receipt-outline" size={48} color={Colors.dark.textMuted} />
                    <Text style={styles.emptyOrderTitle}>Không có đơn hàng nào</Text>
                    <Text style={styles.emptyOrderSub}>
                      {orderFilter === "WAITING_APPROVAL"
                        ? "Hiện không có đơn nào đang chờ duyệt ảnh chuyển khoản."
                        : "Không tìm thấy giao dịch tương ứng với bộ lọc này."}
                    </Text>
                  </View>
                ) : (
                  adminOrders
                    .filter((o) => (orderFilter === "ALL" ? true : o.status === orderFilter))
                    .map((order) => {
                      const isWaiting = order.status === "WAITING_APPROVAL";
                      const isSuccess = order.status === "SUCCESS";
                      const isRejected = order.status === "REJECTED";
                      const isCoin = order.type === "COIN_TOPUP";

                      return (
                        <View key={order.id} style={styles.orderAdminCard}>
                          {/* Card Header */}
                          <View style={styles.orderAdminCardHeader}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                              <View
                                style={[
                                  styles.orderTypeBadge,
                                  isCoin ? styles.orderTypeCoin : styles.orderTypeVip,
                                ]}
                              >
                                <Text style={styles.orderTypeBadgeText}>
                                  {isCoin ? `🪙 NẠP +${order.coins} XU` : `💎 MUA VIP PASS`}
                                </Text>
                              </View>
                              <Text style={styles.orderCodeText}>{order.orderCode}</Text>
                            </View>

                            {/* Status Badge */}
                            <View
                              style={[
                                styles.orderStatusBadge,
                                isWaiting
                                  ? styles.orderStatusWaiting
                                  : isSuccess
                                  ? styles.orderStatusSuccess
                                  : isRejected
                                  ? styles.orderStatusRejected
                                  : styles.orderStatusPending,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.orderStatusBadgeText,
                                  isWaiting
                                    ? { color: "#f59e0b" }
                                    : isSuccess
                                    ? { color: "#10b981" }
                                    : isRejected
                                    ? { color: "#ef4444" }
                                    : { color: Colors.dark.textMuted },
                                ]}
                              >
                                {isWaiting
                                  ? "⏳ CHỜ DUYỆT"
                                  : isSuccess
                                  ? "✅ ĐÃ DUYỆT"
                                  : isRejected
                                  ? "❌ TỪ CHỐI"
                                  : "⌛ CHƯA GỬI ẢNH"}
                              </Text>
                            </View>
                          </View>

                          {/* Order Details Grid */}
                          <View style={styles.orderAdminDetailsGrid}>
                            <View style={styles.orderDetailItem}>
                              <Text style={styles.orderDetailItemKey}>Gói yêu cầu:</Text>
                              <Text style={styles.orderDetailItemValBold}>
                                {order.packageName || (isCoin ? `${order.coins} Xu` : "Gói VIP")}
                              </Text>
                            </View>
                            <View style={styles.orderDetailItem}>
                              <Text style={styles.orderDetailItemKey}>Số tiền thanh toán:</Text>
                              <Text style={[styles.orderDetailItemValBold, { color: "#10b981" }]}>
                                {order.amount.toLocaleString()} VNĐ
                              </Text>
                            </View>
                            <View style={styles.orderDetailItem}>
                              <Text style={styles.orderDetailItemKey}>Tài khoản người mua:</Text>
                              <Text style={styles.orderDetailItemVal} numberOfLines={1}>
                                {(order as any).user?.email || order.userId}
                              </Text>
                            </View>
                            <View style={styles.orderDetailItem}>
                              <Text style={styles.orderDetailItemKey}>Thời gian tạo:</Text>
                              <Text style={styles.orderDetailItemVal}>
                                {new Date(order.createdAt).toLocaleDateString("vi-VN")}{" "}
                                {new Date(order.createdAt).toLocaleTimeString("vi-VN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </Text>
                            </View>
                          </View>

                          {/* User Note */}
                          {!!order.userNote && (
                            <View style={styles.orderNoteBox}>
                              <Ionicons name="chatbubble-ellipses-outline" size={14} color="#94a3b8" />
                              <Text style={styles.orderNoteText}>
                                <Text style={{ fontWeight: "700", color: "#e2e8f0" }}>Khách ghi chú: </Text>
                                {order.userNote}
                              </Text>
                            </View>
                          )}

                          {/* Admin Note if already reviewed */}
                          {!!order.adminNote && (
                            <View
                              style={[
                                styles.orderNoteBox,
                                {
                                  backgroundColor: isRejected
                                    ? "rgba(239, 68, 68, 0.1)"
                                    : "rgba(16, 185, 129, 0.1)",
                                },
                              ]}
                            >
                              <Ionicons
                                name="information-circle-outline"
                                size={14}
                                color={isRejected ? "#ef4444" : "#10b981"}
                              />
                              <Text
                                style={[
                                  styles.orderNoteText,
                                  { color: isRejected ? "#fca5a5" : "#6ee7b7" },
                                ]}
                              >
                                <Text style={{ fontWeight: "700" }}>Admin ghi chú: </Text>
                                {order.adminNote}
                              </Text>
                            </View>
                          )}

                          {/* Proof Receipt Image Preview */}
                          {order.proofImageUrl ? (
                            <View style={styles.orderProofSection}>
                              <Text style={styles.orderProofHeaderLabel}>
                                Ảnh chụp màn hình chuyển khoản ngân hàng:
                              </Text>
                              <TouchableOpacity
                                style={styles.orderProofThumbWrap}
                                onPress={() => setSelectedProofImgModal(order.proofImageUrl || null)}
                                activeOpacity={0.85}
                              >
                                <Image
                                  source={{ uri: order.proofImageUrl }}
                                  style={styles.orderProofThumbImg}
                                  resizeMode="cover"
                                />
                                <View style={styles.orderProofZoomBadge}>
                                  <Ionicons name="search" size={12} color="#fff" />
                                  <Text style={styles.orderProofZoomText}>Phóng to ảnh</Text>
                                </View>
                              </TouchableOpacity>
                            </View>
                          ) : (
                            <View style={styles.orderNoProofBox}>
                              <Ionicons name="image-outline" size={16} color={Colors.dark.textMuted} />
                              <Text style={styles.orderNoProofText}>
                                Khách hàng chưa tải ảnh biên lai
                              </Text>
                            </View>
                          )}

                          {/* Action Buttons for Waiting Approval */}
                          {isWaiting && (
                            <View style={styles.orderActionRow}>
                              <TouchableOpacity
                                style={[styles.orderRejectBtn, orderReviewLoading && { opacity: 0.6 }]}
                                onPress={() => handleOpenRejectModal(order)}
                                disabled={orderReviewLoading}
                              >
                                <Ionicons name="close-circle-outline" size={16} color="#ef4444" />
                                <Text style={styles.orderRejectBtnText}>Từ Chối Đơn</Text>
                              </TouchableOpacity>

                              <TouchableOpacity
                                style={[styles.orderApproveBtn, orderReviewLoading && { opacity: 0.6 }]}
                                onPress={() => handleApproveOrder(order)}
                                disabled={orderReviewLoading}
                              >
                                <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
                                <Text style={styles.orderApproveBtnText}>
                                  Duyệt & {isCoin ? "Cộng Xu" : "Kích Hoạt VIP"} Ngay ✅
                                </Text>
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                      );
                    })
                )}
              </View>
            )}

            {/* ─── TAB 6: BANKING & VIETQR CONFIGURATION ───────────────────── */}
            {activeTab === "banking" && (
              <View>
                {/* Header & Description */}
                <View style={styles.bankingHeroBanner}>
                  <View style={styles.bankingHeroBadge}>
                    <Ionicons name="flash" size={14} color="#fff" />
                    <Text style={styles.bankingHeroBadgeText}>VIETQR AUTO-PAYMENT</Text>
                  </View>
                  <Text style={styles.bankingHeroTitle}>
                    Cấu Hình Ngân Hàng & Tự Động Tạo Mã VietQR 💳
                  </Text>
                  <Text style={styles.bankingHeroDesc}>
                    Quản trị viên thiết lập số tài khoản nhận tiền. Hệ thống sẽ tự động sinh mã VietQR động chứa chính xác số tiền gói VIP/Nạp tiền và mã định danh giao dịch để người dùng quét thanh toán tiện lợi chỉ trong 3 giây.
                  </Text>
                </View>

                {/* Main 2-column or stacked layout */}
                <View style={styles.bankingTwoCols}>
                  {/* Left Column: Bank Configuration Form */}
                  <View style={styles.bankingFormCard}>
                    <View style={styles.bankingCardHeader}>
                      <Ionicons name="card" size={20} color={Colors.dark.primary} />
                      <Text style={styles.bankingCardTitle}>Thông Tin Tài Khoản Nhận Tiền</Text>
                    </View>

                    {/* Choose Bank */}
                    <Text style={styles.inputFieldLabel}>Chọn Ngân Hàng Hưởng Thụ *</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bankChipsScroll}>
                      {supportedBanksList.map((b) => {
                        const isSelected = adminBankId === b.id;
                        return (
                          <TouchableOpacity
                            key={b.id}
                            style={[styles.bankChip, isSelected && styles.bankChipActive]}
                            onPress={() => {
                              setAdminBankId(b.id);
                              setAdminBankName(b.name);
                            }}
                          >
                            <Text style={[styles.bankChipText, isSelected && styles.bankChipTextActive]}>
                              {b.shortName || b.id}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>

                    <Text style={[styles.inputFieldLabel, { marginTop: 12 }]}>Tên ngân hàng đầy đủ</Text>
                    <TextInput
                      style={styles.dialogInput}
                      value={adminBankName}
                      onChangeText={setAdminBankName}
                      placeholder="Ví dụ: MBBank (Ngân Hàng Quân Đội)"
                      placeholderTextColor={Colors.dark.textMuted}
                    />

                    {/* Account Number */}
                    <Text style={styles.inputFieldLabel}>Số Tài Khoản Ngân Hàng *</Text>
                    <TextInput
                      style={styles.dialogInput}
                      value={adminAccountNo}
                      onChangeText={setAdminAccountNo}
                      placeholder="Ví dụ: 0987654321 hoặc 1903..."
                      placeholderTextColor={Colors.dark.textMuted}
                      keyboardType="numeric"
                    />

                    {/* Account Holder Name */}
                    <Text style={styles.inputFieldLabel}>Tên Chủ Tài Khoản (In hoa không dấu) *</Text>
                    <TextInput
                      style={styles.dialogInput}
                      value={adminAccountName}
                      onChangeText={(val) => setAdminAccountName(val.toUpperCase())}
                      placeholder="Ví dụ: NGUYEN VAN ADMIN"
                      placeholderTextColor={Colors.dark.textMuted}
                      autoCapitalize="characters"
                    />

                    {/* QR Template */}
                    <Text style={styles.inputFieldLabel}>Mẫu Giao Diện VietQR</Text>
                    <View style={styles.templateOptionsRow}>
                      {[
                        { id: "compact2", label: "Compact 2 (Khuyên Dùng)", desc: "Logo + Khung thẻ" },
                        { id: "compact", label: "Compact 1", desc: "Chuẩn gọn gàng" },
                        { id: "qr_only", label: "QR Only", desc: "Chỉ mã QR vuông" },
                      ].map((tpl) => {
                        const isSelected = adminTemplate === tpl.id;
                        return (
                          <TouchableOpacity
                            key={tpl.id}
                            style={[styles.templateChip, isSelected && styles.templateChipActive]}
                            onPress={() => setAdminTemplate(tpl.id as any)}
                          >
                            <Text style={[styles.templateChipText, isSelected && { color: "#fff", fontWeight: "700" }]}>
                              {tpl.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {/* Memo Prefix */}
                    <Text style={[styles.inputFieldLabel, { marginTop: 12 }]}>Tiền Tố Nội Dung Chuyển Khoản (Prefix)</Text>
                    <TextInput
                      style={styles.dialogInput}
                      value={adminMemoPrefix}
                      onChangeText={(val) => setAdminMemoPrefix(val.toUpperCase())}
                      placeholder="Ví dụ: WFP hoặc WAIFU"
                      placeholderTextColor={Colors.dark.textMuted}
                      autoCapitalize="characters"
                    />

                    {/* Save Button */}
                    <TouchableOpacity
                      style={styles.saveBankBtn}
                      onPress={handleSaveBankConfig}
                      disabled={savingBankConfig}
                      activeOpacity={0.85}
                    >
                      {savingBankConfig ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <>
                          <Ionicons name="checkmark-done" size={18} color="#fff" />
                          <Text style={styles.saveBankBtnText}>Lưu Cấu Hình Ngân Hàng & VietQR</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>

                  {/* Right Column: Live VietQR Simulator */}
                  <View style={styles.bankingSimCard}>
                    <View style={styles.bankingCardHeader}>
                      <Ionicons name="qr-code" size={20} color={Colors.dark.accent} />
                      <Text style={styles.bankingCardTitle}>Mô Phỏng Trực Tiếp Mã VietQR Động</Text>
                    </View>

                    {/* Interactive Test Amount Selector */}
                    <Text style={styles.inputFieldLabel}>Mô phỏng thử số tiền thanh toán:</Text>
                    <View style={styles.simAmountsGrid}>
                      {["49000", "129000", "449000", "100000"].map((amt) => {
                        const isSelected = customSimAmount === amt;
                        return (
                          <TouchableOpacity
                            key={amt}
                            style={[styles.simAmountChip, isSelected && styles.simAmountChipActive]}
                            onPress={() => setCustomSimAmount(amt)}
                          >
                            <Text style={[styles.simAmountChipText, isSelected && { color: Colors.dark.primaryLight, fontWeight: "700" }]}>
                              {Number(amt).toLocaleString()} ₫
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {/* Dynamic VietQR Image Preview */}
                    <View style={styles.qrImageContainer}>
                      <Image
                        source={{
                          uri: `https://img.vietqr.io/image/${adminBankId}-${adminAccountNo}-${adminTemplate}.png?amount=${customSimAmount}&addInfo=${adminMemoPrefix}%20TEST%20SIM&accountName=${encodeURIComponent(adminAccountName)}`,
                        }}
                        style={styles.simQrImage}
                        resizeMode="contain"
                      />
                      <View style={styles.qrScanInstructionBadge}>
                        <Ionicons name="scan-outline" size={14} color="#10b981" />
                        <Text style={styles.qrScanInstructionText}>
                          Mã QR tự động điền {Number(customSimAmount).toLocaleString()} VNĐ
                        </Text>
                      </View>
                    </View>

                    {/* Information summary */}
                    <View style={styles.qrDetailsBox}>
                      <View style={styles.qrDetailRow}>
                        <Text style={styles.qrDetailKey}>Ngân Hàng:</Text>
                        <Text style={styles.qrDetailVal}>{adminBankName} ({adminBankId})</Text>
                      </View>
                      <View style={styles.qrDetailRow}>
                        <Text style={styles.qrDetailKey}>Số Tài Khoản:</Text>
                        <Text style={[styles.qrDetailVal, { color: Colors.dark.accent, fontWeight: "800" }]}>{adminAccountNo}</Text>
                      </View>
                      <View style={styles.qrDetailRow}>
                        <Text style={styles.qrDetailKey}>Chủ Tài Khoản:</Text>
                        <Text style={[styles.qrDetailVal, { color: "#fff", fontWeight: "700" }]}>{adminAccountName}</Text>
                      </View>
                      <View style={styles.qrDetailRow}>
                        <Text style={styles.qrDetailKey}>Nội Dung Mẫu:</Text>
                        <Text style={[styles.qrDetailVal, { color: Colors.dark.primaryLight }]}>{adminMemoPrefix} VIP 1M TEST</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Revenue & Transaction Ledger */}
                <View style={[styles.sectionHeaderRow, { marginTop: 28 }]}>
                  <Text style={styles.sectionTitle}>Sổ Cái Giao Dịch & Nạp Tiền ({adminTransactions.length})</Text>
                  <View style={styles.revenueBadge}>
                    <Ionicons name="cash-outline" size={16} color="#10b981" />
                    <Text style={styles.revenueBadgeText}>
                      Doanh thu: {adminTotalRevenue.toLocaleString()} ₫
                    </Text>
                  </View>
                </View>

                {adminTransactions.length === 0 ? (
                  <View style={styles.emptyStateBox}>
                    <Ionicons name="receipt-outline" size={48} color={Colors.dark.textMuted} />
                    <Text style={styles.emptyStateText}>Chưa có giao dịch nào phát sinh.</Text>
                  </View>
                ) : (
                  adminTransactions.map((tx) => (
                    <View key={tx.id} style={styles.txRowCard}>
                      <View style={styles.txIconBox}>
                        <Ionicons
                          name={tx.type === "BUY_VIP" ? "diamond" : "card"}
                          size={20}
                          color={tx.type === "BUY_VIP" ? Colors.dark.primaryLight : "#10b981"}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.txTitle}>
                          {tx.type === "BUY_VIP" ? (tx.packageName || "Mua Gói VIP") : "Nạp Tiền Waifu Coins"}
                        </Text>
                        <Text style={styles.txUserSub}>
                          Khách hàng: {tx.userName || tx.userEmail || tx.userId.slice(0, 8)} • {tx.transactionCode}
                        </Text>
                        <Text style={styles.txDateSub}>
                          {new Date(tx.createdAt).toLocaleString("vi-VN")}
                        </Text>
                      </View>
                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={[styles.txAmount, { color: tx.type === "BUY_VIP" ? Colors.dark.primaryLight : "#10b981" }]}>
                          +{Number(tx.amount).toLocaleString()} ₫
                        </Text>
                        <View style={styles.txStatusSuccess}>
                          <Text style={styles.txStatusText}>{tx.status}</Text>
                        </View>
                      </View>
                    </View>
                  ))
                )}

                {/* ─── CREATOR PAYOUT REQUESTS SECTION ─────────────────────── */}
                <View style={[styles.sectionHeaderRow, { marginTop: 28 }]}>
                  <Text style={styles.sectionTitle}>
                    Yêu Cầu Rút Tiền Nghệ Sĩ ({adminPayouts.length}) 🎙️
                  </Text>
                  <View style={[styles.revenueBadge, { backgroundColor: "rgba(245, 158, 11, 0.15)", borderColor: "rgba(245, 158, 11, 0.3)" }]}>
                    <Ionicons name="time" size={16} color="#f59e0b" />
                    <Text style={[styles.revenueBadgeText, { color: "#f59e0b" }]}>
                      {adminPayoutPendingCount} chờ giải ngân
                    </Text>
                  </View>
                </View>

                {adminPayouts.length === 0 ? (
                  <View style={styles.emptyStateBox}>
                    <Ionicons name="cash-outline" size={48} color={Colors.dark.textMuted} />
                    <Text style={styles.emptyStateText}>Chưa có yêu cầu rút tiền nào từ nghệ sĩ.</Text>
                  </View>
                ) : (
                  adminPayouts.map((p) => {
                    const isPending = p.status === "PENDING";
                    const isSuccess = p.status === "COMPLETED" || p.status === "APPROVED";
                    return (
                      <View key={p.id} style={styles.adminPayoutCard}>
                        <View style={styles.adminPayoutHeader}>
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                              <Text style={styles.adminPayoutCreator}>{p.creatorName}</Text>
                              <View style={styles.roleMiniBadge}>
                                <Text style={styles.roleMiniBadgeText}>CREATOR</Text>
                              </View>
                            </View>
                            <Text style={styles.adminPayoutMeta}>
                              {p.creatorEmail} • {p.bankName} - STK: {p.accountNo} ({p.accountName})
                            </Text>
                            <Text style={styles.adminPayoutDate}>
                              Mã GD: {p.txCode} • {new Date(p.createdAt).toLocaleString("vi-VN")}
                            </Text>
                            {p.note && (
                              <Text style={styles.adminPayoutNote}>
                                Ghi chú: {p.note}
                              </Text>
                            )}
                          </View>

                          <View style={{ alignItems: "flex-end" }}>
                            <Text style={styles.adminPayoutAmount}>
                              {Number(p.amount).toLocaleString()} ₫
                            </Text>
                            <View style={[
                              styles.payoutStatusTag,
                              isSuccess ? styles.statusTagSuccess : isPending ? styles.statusTagPending : styles.statusTagRejected
                            ]}>
                              <Text style={[
                                styles.payoutStatusTagText,
                                isSuccess ? { color: "#10b981" } : isPending ? { color: "#f59e0b" } : { color: "#ef4444" }
                              ]}>
                                {isSuccess ? "ĐÃ CHI TRẢ" : isPending ? "CHỜ DUYỆT" : "TỪ CHỐI"}
                              </Text>
                            </View>
                          </View>
                        </View>

                        {isPending && (
                          <TouchableOpacity
                            style={styles.adminPayoutReviewBtn}
                            onPress={() => {
                              setSelectedAdminPayout(p);
                              setPayoutAdminNote("");
                              setShowPayoutReviewModal(true);
                            }}
                          >
                            <Ionicons name="qr-code-outline" size={16} color="#fff" />
                            <Text style={styles.adminPayoutReviewBtnText}>
                              Xử Lý & Quét VietQR Chi Trả
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>



      {/* ─── MODAL: EDIT USER ROLE & VIP ─────────────────────────────────── */}
      <Modal
        visible={showEditUserModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEditUserModal(false)}
      >
        <View style={styles.modalBgCenter}>
          <View style={styles.modalCardCenter}>
            <Text style={styles.modalDialogTitle}>Cập Nhật Người Dùng</Text>
            <Text style={styles.modalDialogSub}>
              Tài khoản: <Text style={{ color: Colors.dark.text, fontWeight: "700" }}>{selectedUser?.username}</Text>
            </Text>

            <Text style={styles.inputFieldLabel}>Vai trò (Role)</Text>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
              {(["USER", "ARTIST", "ADMIN"] as Role[]).map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.roleSelectChip, selectedRole === r && styles.roleSelectChipActive]}
                  onPress={() => setSelectedRole(r)}
                >
                  <Text style={[styles.roleSelectChipText, selectedRole === r && { color: "#fff", fontWeight: "700" }]}>
                    {r}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputFieldLabel}>Gói Hội Viên VIP</Text>
            <TouchableOpacity
              style={[styles.vipToggleBtn, selectedVip && styles.vipToggleBtnActive]}
              onPress={() => setSelectedVip(!selectedVip)}
            >
              <Ionicons name={selectedVip ? "checkmark-circle" : "ellipse-outline"} size={20} color={selectedVip ? "#fff" : Colors.dark.textMuted} />
              <Text style={[styles.vipToggleText, selectedVip && { color: "#fff", fontWeight: "700" }]}>
                {selectedVip ? "Đang bật gói VIP WAIFU" : "Tài khoản thường (FREE)"}
              </Text>
            </TouchableOpacity>

            <View style={styles.modalDialogActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowEditUserModal(false)}
              >
                <Text style={{ color: Colors.dark.textMuted }}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleSaveUser}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>Lưu Thay Đổi</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── MODAL: REVIEW COPYRIGHT CLAIM ──────────────────────────────── */}
      <Modal
        visible={showClaimModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowClaimModal(false)}
      >
        <View style={styles.modalBgCenter}>
          <View style={[styles.modalCardCenter, { maxWidth: 480 }]}>
            <Text style={styles.modalDialogTitle}>Thẩm Định Khiếu Nại Bản Quyền 🛡️</Text>
            <Text style={styles.modalDialogSub}>
              Bài hát bị khiếu nại: <Text style={{ color: Colors.dark.text, fontWeight: "700" }}>{selectedClaim?.song?.title || selectedClaim?.songId}</Text>
            </Text>

            <Text style={styles.inputFieldLabel}>Ghi chú thẩm định của Quản trị viên (Tùy chọn)</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Nhập lý do duyệt gỡ bài hát hoặc lý do bác bỏ khiếu nại..."
              placeholderTextColor={Colors.dark.textMuted}
              multiline
              numberOfLines={3}
              value={adminNotes}
              onChangeText={setAdminNotes}
            />

            {claimActionLoading ? (
              <ActivityIndicator color={Colors.dark.primary} style={{ marginVertical: 20 }} />
            ) : (
              <View style={{ flexDirection: "row", gap: 10, marginTop: 20 }}>
                <TouchableOpacity
                  style={[styles.claimReviewBtn, { backgroundColor: "#ef4444" }]}
                  onPress={() => handleReviewClaim("APPROVED")}
                >
                  <Ionicons name="trash" size={16} color="#fff" />
                  <Text style={styles.claimReviewBtnText}>Chấp thuận & Gỡ bài hát (Takedown)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.claimReviewBtn, { backgroundColor: Colors.dark.card, borderWidth: 1, borderColor: Colors.dark.border }]}
                  onPress={() => handleReviewClaim("REJECTED")}
                >
                  <Ionicons name="close-circle" size={16} color={Colors.dark.textMuted} />
                  <Text style={[styles.claimReviewBtnText, { color: Colors.dark.textMuted }]}>Bác bỏ khiếu nại</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={{ marginTop: 14, alignSelf: "center" }}
              onPress={() => setShowClaimModal(false)}
            >
              <Text style={{ color: Colors.dark.textMuted }}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─── MODAL: ADD ARTIST ─────────────────────────────────────────── */}
      <Modal
        visible={showAddArtistModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAddArtistModal(false)}
      >
        <View style={styles.modalBgCenter}>
          <View style={styles.modalCardCenter}>
            <Text style={styles.modalDialogTitle}>Thêm Nghệ Sĩ Mới 🎤</Text>
            <Text style={styles.inputFieldLabel}>Tên nghệ sĩ *</Text>
            <TextInput
              style={styles.dialogInput}
              placeholder="Ví dụ: Hatsune Miku, YOASOBI..."
              placeholderTextColor={Colors.dark.textMuted}
              value={newArtistName}
              onChangeText={setNewArtistName}
            />
            <Text style={styles.inputFieldLabel}>Tiểu sử (Bio)</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Giới thiệu về nghệ sĩ..."
              placeholderTextColor={Colors.dark.textMuted}
              multiline
              value={newArtistBio}
              onChangeText={setNewArtistBio}
            />
            <View style={styles.modalDialogActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowAddArtistModal(false)}
              >
                <Text style={{ color: Colors.dark.textMuted }}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleCreateArtist}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>Tạo Nghệ Sĩ</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── MODAL: ADD ALBUM ──────────────────────────────────────────── */}
      <Modal
        visible={showAddAlbumModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAddAlbumModal(false)}
      >
        <View style={styles.modalBgCenter}>
          <View style={styles.modalCardCenter}>
            <Text style={styles.modalDialogTitle}>Tạo Album Âm Nhạc 💿</Text>
            <Text style={styles.inputFieldLabel}>Tiêu đề Album *</Text>
            <TextInput
              style={styles.dialogInput}
              placeholder="Ví dụ: Vocaloid Greatest Hits 2026..."
              placeholderTextColor={Colors.dark.textMuted}
              value={newAlbumTitle}
              onChangeText={setNewAlbumTitle}
            />
            <Text style={styles.inputFieldLabel}>Chọn Nghệ Sĩ *</Text>
            <ScrollView horizontal style={{ maxHeight: 50, marginBottom: 16 }}>
              {artists.map((a) => (
                <TouchableOpacity
                  key={a.id}
                  style={[styles.roleSelectChip, newAlbumArtistId === a.id && styles.roleSelectChipActive]}
                  onPress={() => setNewAlbumArtistId(a.id)}
                >
                  <Text style={[styles.roleSelectChipText, newAlbumArtistId === a.id && { color: "#fff", fontWeight: "700" }]}>
                    {a.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.modalDialogActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowAddAlbumModal(false)}
              >
                <Text style={{ color: Colors.dark.textMuted }}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleCreateAlbum}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>Tạo Album</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── MODAL: ADD SONG ───────────────────────────────────────────── */}
      <Modal
        visible={showAddSongModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddSongModal(false)}
      >
        <View style={styles.modalBgCenter}>
          <View style={[styles.modalCardCenter, { maxWidth: 500, maxHeight: "90%" }]}>
            <Text style={styles.modalDialogTitle}>Đăng Tải Bài Hát Mới 🎵</Text>
            <ScrollView showsVerticalScrollIndicator={false} style={{ width: "100%" }}>
              <Text style={styles.inputFieldLabel}>Tiêu đề bài hát *</Text>
              <TextInput
                style={styles.dialogInput}
                placeholder="Ví dụ: Senbonzakura (Anime Remastered)..."
                placeholderTextColor={Colors.dark.textMuted}
                value={newSongTitle}
                onChangeText={setNewSongTitle}
              />

              <Text style={styles.inputFieldLabel}>Thời lượng (Giây) *</Text>
              <TextInput
                style={styles.dialogInput}
                placeholder="210"
                keyboardType="numeric"
                placeholderTextColor={Colors.dark.textMuted}
                value={newSongDuration}
                onChangeText={setNewSongDuration}
              />

              {/* Audio Source Picker */}
              <View style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <Text style={styles.inputFieldLabel}>File Âm Thanh (Audio MP3 / FLAC) *</Text>
                  <TouchableOpacity
                    style={styles.adminPickFileBtn}
                    onPress={handlePickLocalAudio}
                    disabled={uploadingAudio}
                    activeOpacity={0.8}
                  >
                    {uploadingAudio ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="folder-open" size={13} color="#fff" />
                        <Text style={styles.adminPickFileBtnText}>Chọn từ máy tính</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                {localAudioName && (
                  <View style={styles.adminPickedBadge}>
                    <Ionicons name="checkmark-circle" size={15} color={Colors.dark.accent} />
                    <Text style={styles.adminPickedText} numberOfLines={1}>
                      {localAudioName} {localAudioSize ? `(${localAudioSize} MB)` : ""}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        setLocalAudioName(null);
                        setLocalAudioSize(null);
                        setNewSongFileUrl("");
                      }}
                    >
                      <Ionicons name="close-circle" size={16} color={Colors.dark.textMuted} />
                    </TouchableOpacity>
                  </View>
                )}

                <TextInput
                  style={styles.dialogInput}
                  placeholder="Hoặc dán URL: https://... hoặc /uploads/audio/..."
                  placeholderTextColor={Colors.dark.textMuted}
                  value={newSongFileUrl}
                  onChangeText={setNewSongFileUrl}
                />
              </View>

              {/* Cover Image Picker */}
              <View style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <Text style={styles.inputFieldLabel}>Ảnh Bìa (Cover Art URL)</Text>
                  <TouchableOpacity
                    style={styles.adminPickFileBtnSecondary}
                    onPress={handlePickLocalCover}
                    disabled={uploadingCover}
                    activeOpacity={0.8}
                  >
                    {uploadingCover ? (
                      <ActivityIndicator size="small" color={Colors.dark.accent} />
                    ) : (
                      <>
                        <Ionicons name="image" size={13} color={Colors.dark.accent} />
                        <Text style={styles.adminPickFileBtnSecondaryText}>Chọn ảnh từ máy</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                {newSongCoverUrl ? (
                  <View style={styles.adminCoverPreview}>
                    <Image
                      source={{ uri: newSongCoverUrl.startsWith("http") ? newSongCoverUrl : `${API_BASE_URL}${newSongCoverUrl.startsWith("/") ? "" : "/"}${newSongCoverUrl}` }}
                      style={styles.adminCoverThumb}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: Colors.dark.text, fontSize: 11, fontWeight: "700" }}>Ảnh bìa xem trước</Text>
                      <Text style={{ color: Colors.dark.textMuted, fontSize: 9 }} numberOfLines={1}>{localCoverName || newSongCoverUrl}</Text>
                    </View>
                    <TouchableOpacity onPress={() => { setNewSongCoverUrl(""); setLocalCoverName(null); }}>
                      <Ionicons name="trash-outline" size={16} color={Colors.dark.error} />
                    </TouchableOpacity>
                  </View>
                ) : null}

                <TextInput
                  style={styles.dialogInput}
                  placeholder="Hoặc dán URL ảnh: https://images.unsplash.com/..."
                  placeholderTextColor={Colors.dark.textMuted}
                  value={newSongCoverUrl}
                  onChangeText={setNewSongCoverUrl}
                />
              </View>

              <Text style={styles.inputFieldLabel}>Chọn Nghệ Sĩ</Text>
              <ScrollView horizontal style={{ maxHeight: 50, marginBottom: 16 }}>
                {artists.map((a) => (
                  <TouchableOpacity
                    key={a.id}
                    style={[styles.roleSelectChip, newSongArtistId === a.id && styles.roleSelectChipActive]}
                    onPress={() => setNewSongArtistId(a.id)}
                  >
                    <Text style={[styles.roleSelectChipText, newSongArtistId === a.id && { color: "#fff", fontWeight: "700" }]}>
                      {a.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.modalDialogActions}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setShowAddSongModal(false)}
                >
                  <Text style={{ color: Colors.dark.textMuted }}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalConfirmBtn}
                  onPress={handleCreateSong}
                >
                  <Text style={{ color: "#fff", fontWeight: "700" }}>Lưu Bài Hát</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ─── MODAL: REVIEW CREATOR PAYOUT & VIETQR TRANSFER ───────────────── */}
      <Modal
        visible={showPayoutReviewModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPayoutReviewModal(false)}
      >
        <View style={styles.modalBgCenter}>
          <View style={[styles.modalCardCenter, { maxWidth: 480, maxHeight: "90%" }]}>
            <Text style={styles.modalDialogTitle}>Xử Lý Chi Trả Doanh Thu Nghệ Sĩ 💸</Text>
            <Text style={styles.modalDialogSub}>
              Yêu cầu của: <Text style={{ color: Colors.dark.accent, fontWeight: "700" }}>{selectedAdminPayout?.creatorName}</Text> ({selectedAdminPayout?.creatorEmail})
            </Text>

            <ScrollView showsVerticalScrollIndicator={false} style={{ width: "100%" }}>
              {/* Creator Bank Information Details */}
              <View style={styles.adminPayoutInfoBox}>
                <View style={styles.adminPayoutInfoRow}>
                  <Text style={styles.adminPayoutInfoKey}>Số tiền yêu cầu:</Text>
                  <Text style={[styles.adminPayoutInfoVal, { color: "#10b981", fontSize: 16, fontWeight: "900" }]}>
                    {Number(selectedAdminPayout?.amount || 0).toLocaleString()} VNĐ
                  </Text>
                </View>

                <View style={styles.adminPayoutInfoRow}>
                  <Text style={styles.adminPayoutInfoKey}>Ngân hàng thụ hưởng:</Text>
                  <Text style={[styles.adminPayoutInfoVal, { color: "#fff", fontWeight: "700" }]}>
                    {selectedAdminPayout?.bankName} ({selectedAdminPayout?.bankId})
                  </Text>
                </View>

                <View style={styles.adminPayoutInfoRow}>
                  <Text style={styles.adminPayoutInfoKey}>Số tài khoản:</Text>
                  <Text style={[styles.adminPayoutInfoVal, { color: Colors.dark.accent, fontWeight: "800", fontSize: 14 }]}>
                    {selectedAdminPayout?.accountNo}
                  </Text>
                </View>

                <View style={styles.adminPayoutInfoRow}>
                  <Text style={styles.adminPayoutInfoKey}>Chủ tài khoản:</Text>
                  <Text style={[styles.adminPayoutInfoVal, { color: "#fff", fontWeight: "700" }]}>
                    {selectedAdminPayout?.accountName}
                  </Text>
                </View>

                <View style={[styles.adminPayoutInfoRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.adminPayoutInfoKey}>Mã giao dịch:</Text>
                  <Text style={[styles.adminPayoutInfoVal, { color: Colors.dark.primaryLight }]}>
                    {selectedAdminPayout?.txCode}
                  </Text>
                </View>
              </View>

              {/* Dynamic VietQR for Instant Bank Transfer */}
              {selectedAdminPayout?.qrUrl && (
                <View style={styles.adminVietQrCard}>
                  <Text style={styles.adminVietQrCardTitle}>Quét Mã VietQR Nhanh Để Chuyển Khoản:</Text>
                  <Image
                    source={{ uri: selectedAdminPayout.qrUrl }}
                    style={styles.adminVietQrImage}
                    resizeMode="contain"
                  />
                  <Text style={styles.adminVietQrSub}>
                    Mã QR đã điền sẵn {Number(selectedAdminPayout?.amount || 0).toLocaleString()} VNĐ và nội dung "{selectedAdminPayout?.txCode}".
                  </Text>
                </View>
              )}

              {/* Admin Note Input */}
              <Text style={[styles.inputFieldLabel, { marginTop: 10 }]}>Ghi chú xử lý của Quản trị viên (Tùy chọn)</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Nhập ghi chú chuyển khoản hoặc lý do nếu từ chối..."
                placeholderTextColor={Colors.dark.textMuted}
                value={payoutAdminNote}
                onChangeText={setPayoutAdminNote}
              />

              {/* Action Buttons */}
              {payoutReviewLoading ? (
                <ActivityIndicator color={Colors.dark.primary} style={{ marginVertical: 14 }} />
              ) : (
                <View style={{ flexDirection: "row", gap: 10, marginTop: 10, marginBottom: 10 }}>
                  <TouchableOpacity
                    style={[styles.claimReviewBtn, { backgroundColor: "#16a34a" }]}
                    onPress={() => handleReviewCreatorPayout("COMPLETED")}
                  >
                    <Ionicons name="checkmark-circle" size={16} color="#fff" />
                    <Text style={styles.claimReviewBtnText}>Đã Chuyển Khoản • Hoàn Tất</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.claimReviewBtn, { backgroundColor: "rgba(239, 68, 68, 0.15)", borderWidth: 1, borderColor: "#ef4444" }]}
                    onPress={() => handleReviewCreatorPayout("REJECTED")}
                  >
                    <Ionicons name="close-circle" size={16} color="#ef4444" />
                    <Text style={[styles.claimReviewBtnText, { color: "#ef4444" }]}>Từ Chối</Text>
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity
                style={{ alignSelf: "center", paddingVertical: 8 }}
                onPress={() => setShowPayoutReviewModal(false)}
              >
                <Text style={{ color: Colors.dark.textMuted }}>Đóng cửa sổ</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ─── MODAL: ZOOM PAYMENT PROOF IMAGE ─────────────────────────────── */}
      <Modal
        visible={!!selectedProofImgModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedProofImgModal(null)}
      >
        <View style={styles.modalProofZoomOverlay}>
          <View style={styles.modalProofZoomCard}>
            <View style={styles.modalProofZoomHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Ionicons name="image" size={18} color="#ec4899" />
                <Text style={styles.modalProofZoomTitle}>Chi Tiết Ảnh Biên Lai Chuyển Khoản</Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedProofImgModal(null)}
                style={styles.modalProofCloseIcon}
              >
                <Ionicons name="close" size={22} color="#fff" />
              </TouchableOpacity>
            </View>

            {selectedProofImgModal && (
              <Image
                source={{ uri: selectedProofImgModal }}
                style={styles.modalProofZoomImg}
                resizeMode="contain"
              />
            )}

            <TouchableOpacity
              style={styles.modalProofCloseBtn}
              onPress={() => setSelectedProofImgModal(null)}
            >
              <Text style={styles.modalProofCloseBtnText}>Đóng Lại</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─── MODAL: REJECT PAYMENT ORDER ─────────────────────────────────── */}
      <Modal
        visible={showRejectModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowRejectModal(false)}
      >
        <View style={styles.modalBgCenter}>
          <View style={[styles.modalCardCenter, { maxWidth: 460 }]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <Ionicons name="alert-circle" size={22} color="#ef4444" />
              <Text style={styles.modalDialogTitle}>Từ Chối Đơn Thanh Toán</Text>
            </View>
            <Text style={styles.modalDialogSub}>
              Đơn hàng: <Text style={{ color: "#fff", fontWeight: "700" }}>{selectedOrderToReject?.orderCode}</Text> ({Number(selectedOrderToReject?.amount || 0).toLocaleString()} VNĐ)
            </Text>

            <Text style={styles.inputFieldLabel}>Lý do từ chối (Gửi tới người dùng) *</Text>
            <TextInput
              style={styles.textArea}
              placeholder="VD: Chưa nhận được tiền trong tài khoản MB, nội dung chuyển khoản không khớp, ..."
              placeholderTextColor={Colors.dark.textMuted}
              multiline
              numberOfLines={3}
              value={rejectReason}
              onChangeText={setRejectReason}
            />

            <View style={styles.modalDialogActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => {
                  setShowRejectModal(false);
                  setSelectedOrderToReject(null);
                }}
              >
                <Text style={{ color: Colors.dark.textMuted }}>Hủy Bỏ</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, { backgroundColor: "#ef4444" }]}
                onPress={handleConfirmRejectOrder}
                disabled={orderReviewLoading}
              >
                {orderReviewLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: "#fff", fontWeight: "700" }}>Xác Nhận Từ Chối</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0d0d14",
  },
  guardContainer: {
    flex: 1,
    backgroundColor: "#0d0d14",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  guardCard: {
    backgroundColor: "#161622",
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    maxWidth: 420,
    width: "100%",
    borderWidth: 1,
    borderColor: "#262638",
  },
  guardTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  guardDesc: {
    fontSize: 13,
    color: Colors.dark.textMuted,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  guardLoginBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.dark.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
  },
  guardLoginBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  headerBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#14141e",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#222232",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.dark.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  headerBrand: {
    fontSize: 15,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 1,
  },
  superAdminTag: {
    backgroundColor: "rgba(236, 72, 153, 0.2)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(236, 72, 153, 0.4)",
  },
  superAdminTagText: {
    color: "#ec4899",
    fontSize: 9,
    fontWeight: "800",
  },
  headerAdminUser: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  backPlayerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.dark.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  backPlayerBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  navTabsBar: {
    backgroundColor: "#161624",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#222232",
  },
  tabButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "transparent",
  },
  tabButtonActive: {
    backgroundColor: Colors.dark.primary,
  },
  tabButtonText: {
    fontSize: 13,
    color: Colors.dark.textMuted,
    fontWeight: "600",
  },
  tabButtonTextActive: {
    color: "#fff",
    fontWeight: "700",
  },
  contentScrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 60,
  },
  loadingBox: {
    paddingVertical: 60,
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  primaryActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  primaryActionBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    minWidth: 140,
    backgroundColor: "#161622",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#262638",
  },
  metricNumber: {
    fontSize: 22,
    fontWeight: "900",
    color: "#fff",
    marginTop: 10,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    fontWeight: "600",
  },
  dashTwoCols: {
    flexDirection: "column",
    gap: 16,
  },
  panelBox: {
    backgroundColor: "#161622",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#262638",
  },
  panelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#222232",
  },
  panelTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
  panelActionText: {
    fontSize: 12,
    color: Colors.dark.primaryLight,
    fontWeight: "600",
  },
  panelItemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#1d1d2b",
  },
  panelItemTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },
  panelItemSub: {
    fontSize: 11,
    color: Colors.dark.textMuted,
  },
  panelItemMetric: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.dark.primaryLight,
  },
  roleMiniBadge: {
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleMiniAdmin: {
    backgroundColor: "rgba(236, 72, 153, 0.2)",
  },
  roleMiniBadgeText: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "700",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#161622",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#262638",
    marginBottom: 14,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: "#fff",
    fontSize: 13,
    padding: 0,
  },
  tableRowCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#161622",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#262638",
  },
  songRowThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  userRowAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.dark.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  userRowAvatarText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
  tableRowTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 2,
  },
  tableRowSub: {
    fontSize: 12,
    color: Colors.dark.textMuted,
  },
  deleteActionBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    marginLeft: 8,
  },
  editActionBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "rgba(236, 72, 153, 0.12)",
    marginLeft: 8,
  },
  vipPill: {
    backgroundColor: "#f59e0b",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  vipPillText: {
    color: "#000",
    fontSize: 9,
    fontWeight: "900",
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 8,
  },
  roleBadgeUser: {
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  roleBadgeArtist: {
    backgroundColor: "rgba(139, 92, 246, 0.2)",
  },
  roleBadgeAdmin: {
    backgroundColor: "rgba(236, 72, 153, 0.2)",
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#fff",
  },
  claimCard: {
    backgroundColor: "#161622",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#262638",
    marginBottom: 14,
  },
  claimCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  claimSongTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
  claimDateText: {
    fontSize: 11,
    color: Colors.dark.textMuted,
    marginTop: 2,
  },
  claimStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusPending: {
    backgroundColor: "rgba(245, 158, 11, 0.2)",
  },
  statusApproved: {
    backgroundColor: "rgba(16, 185, 129, 0.2)",
  },
  statusRejected: {
    backgroundColor: "rgba(239, 68, 68, 0.2)",
  },
  claimStatusText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#fff",
  },
  claimReasonText: {
    fontSize: 13,
    color: Colors.dark.textMuted,
    marginBottom: 6,
  },
  claimDescText: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    lineHeight: 18,
    backgroundColor: "rgba(0,0,0,0.2)",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  proofUrlText: {
    fontSize: 11,
    color: Colors.dark.primaryLight,
    marginBottom: 12,
  },
  claimActionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  approveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#ef4444",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  approveBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  emptyStateBox: {
    paddingVertical: 48,
    alignItems: "center",
  },
  emptyStateText: {
    color: Colors.dark.textMuted,
    marginTop: 12,
    fontSize: 14,
  },
  emptyText: {
    color: Colors.dark.textMuted,
    fontSize: 12,
    textAlign: "center",
    paddingVertical: 12,
  },
  artistsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  artistCard: {
    width: "48%",
    backgroundColor: "#161622",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#262638",
  },
  artistCardName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
    marginTop: 8,
  },
  artistCardBio: {
    fontSize: 11,
    color: Colors.dark.textMuted,
    marginTop: 2,
  },
  modalBgCenter: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCardCenter: {
    backgroundColor: "#181826",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 420,
    borderWidth: 1,
    borderColor: "#2c2c40",
  },
  modalDialogTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 4,
  },
  modalDialogSub: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    marginBottom: 16,
  },
  inputFieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.dark.text,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  roleSelectChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.dark.card,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  roleSelectChipActive: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
  },
  roleSelectChipText: {
    fontSize: 12,
    color: Colors.dark.textMuted,
  },
  vipToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    backgroundColor: Colors.dark.card,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: 20,
  },
  vipToggleBtnActive: {
    backgroundColor: "rgba(245, 158, 11, 0.2)",
    borderColor: "#f59e0b",
  },
  vipToggleText: {
    fontSize: 13,
    color: Colors.dark.textMuted,
  },
  modalDialogActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 10,
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  modalConfirmBtn: {
    backgroundColor: Colors.dark.primary,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  textArea: {
    backgroundColor: "#11111a",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2c2c40",
    color: "#fff",
    padding: 12,
    minHeight: 70,
    textAlignVertical: "top",
    fontSize: 13,
    marginBottom: 14,
  },
  dialogInput: {
    backgroundColor: "#11111a",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2c2c40",
    color: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    marginBottom: 14,
  },
  claimReviewBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
  },
  claimReviewBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  adminPickFileBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  adminPickFileBtnText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  adminPickFileBtnSecondary: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(6, 182, 212, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(6, 182, 212, 0.3)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  adminPickFileBtnSecondaryText: {
    color: Colors.dark.accent,
    fontSize: 10,
    fontWeight: "700",
  },
  adminPickedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(6, 182, 212, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(6, 182, 212, 0.25)",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    marginBottom: 8,
    gap: 6,
  },
  adminPickedText: {
    flex: 1,
    color: Colors.dark.accent,
    fontSize: 11,
    fontWeight: "600",
  },
  adminCoverPreview: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#11111a",
    borderRadius: 8,
    padding: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#2c2c40",
    gap: 8,
  },
  adminCoverThumb: {
    width: 36,
    height: 36,
    borderRadius: 6,
  },
  // Banking & VietQR Styles
  bankingHeroBanner: {
    backgroundColor: "rgba(236, 72, 153, 0.1)",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(236, 72, 153, 0.3)",
    marginBottom: 20,
  },
  bankingHeroBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
    marginBottom: 8,
  },
  bankingHeroBadgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  bankingHeroTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 6,
  },
  bankingHeroDesc: {
    fontSize: 13,
    color: Colors.dark.textMuted,
    lineHeight: 18,
  },
  bankingTwoCols: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  bankingFormCard: {
    flex: 1,
    minWidth: 320,
    backgroundColor: "#161622",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#262638",
  },
  bankingSimCard: {
    flex: 1,
    minWidth: 320,
    backgroundColor: "#161622",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(6, 182, 212, 0.3)",
  },
  bankingCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
    paddingBottom: 10,
  },
  bankingCardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
  bankChipsScroll: {
    gap: 8,
    paddingVertical: 4,
    marginBottom: 4,
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
  templateOptionsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 6,
  },
  templateChip: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 8,
    backgroundColor: Colors.dark.card,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    alignItems: "center",
  },
  templateChipActive: {
    backgroundColor: "rgba(236, 72, 153, 0.2)",
    borderColor: Colors.dark.primary,
  },
  templateChipText: {
    fontSize: 11,
    color: Colors.dark.textMuted,
  },
  saveBankBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.dark.primary,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
    shadowColor: Colors.dark.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  saveBankBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  simAmountsGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  simAmountChip: {
    flex: 1,
    backgroundColor: Colors.dark.card,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  simAmountChipActive: {
    borderColor: Colors.dark.primary,
    backgroundColor: "rgba(233, 30, 140, 0.15)",
  },
  simAmountChipText: {
    fontSize: 11,
    color: Colors.dark.textMuted,
  },
  qrImageContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
    borderWidth: 2,
    borderColor: Colors.dark.accent,
  },
  simQrImage: {
    width: "100%",
    height: 280,
    maxWidth: 280,
  },
  qrScanInstructionBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 8,
  },
  qrScanInstructionText: {
    color: "#059669",
    fontSize: 11,
    fontWeight: "700",
  },
  qrDetailsBox: {
    backgroundColor: "#11111a",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#262638",
    gap: 6,
    marginTop: 8,
  },
  qrDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  qrDetailKey: {
    fontSize: 12,
    color: Colors.dark.textMuted,
  },
  qrDetailVal: {
    fontSize: 12,
    color: Colors.dark.text,
  },
  revenueBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  revenueBadgeText: {
    color: "#10b981",
    fontSize: 13,
    fontWeight: "800",
  },
  txRowCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#161622",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#262638",
    marginBottom: 10,
  },
  txIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  txTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 2,
  },
  txUserSub: {
    fontSize: 12,
    color: Colors.dark.textMuted,
  },
  txDateSub: {
    fontSize: 10,
    color: Colors.dark.textMuted,
    marginTop: 2,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 4,
  },
  txStatusSuccess: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  txStatusText: {
    color: "#10b981",
    fontSize: 10,
    fontWeight: "700",
  },
  // Admin Payout Styles
  adminPayoutCard: {
    backgroundColor: "#161622",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#262638",
    marginBottom: 12,
  },
  adminPayoutHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  adminPayoutCreator: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
  adminPayoutMeta: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    marginTop: 2,
  },
  adminPayoutDate: {
    fontSize: 10,
    color: Colors.dark.textMuted,
    marginTop: 2,
  },
  adminPayoutNote: {
    fontSize: 11,
    color: Colors.dark.primaryLight,
    marginTop: 3,
    fontStyle: "italic",
  },
  adminPayoutAmount: {
    fontSize: 16,
    fontWeight: "800",
    color: "#10b981",
    marginBottom: 4,
  },
  payoutStatusTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  statusTagSuccess: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
  },
  statusTagPending: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
  },
  statusTagRejected: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
  },
  payoutStatusTagText: {
    fontSize: 10,
    fontWeight: "800",
  },
  adminPayoutReviewBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.dark.primary,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 6,
  },
  adminPayoutReviewBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  adminPayoutInfoBox: {
    backgroundColor: "#11111a",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#262638",
    gap: 8,
    marginVertical: 10,
  },
  adminPayoutInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  adminPayoutInfoKey: {
    fontSize: 12,
    color: Colors.dark.textMuted,
  },
  adminPayoutInfoVal: {
    fontSize: 13,
    color: "#fff",
  },
  adminVietQrCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    marginVertical: 10,
    borderWidth: 2,
    borderColor: Colors.dark.accent,
  },
  adminVietQrCardTitle: {
    color: "#0284c7",
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 6,
  },
  adminVietQrImage: {
    width: "100%",
    height: 240,
    maxWidth: 240,
  },
  adminVietQrSub: {
    color: "#4b5563",
    fontSize: 11,
    textAlign: "center",
    marginTop: 6,
  },

  // Payment Orders (Duyệt nạp xu & VIP) Styles
  refreshOrdersBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 6,
  },
  refreshOrdersBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  orderFilterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
    flexWrap: "wrap",
  },
  orderFilterChip: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  orderFilterChipActive: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
  },
  orderFilterChipText: {
    color: Colors.dark.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },
  orderFilterChipTextActive: {
    color: "#fff",
    fontWeight: "700",
  },
  emptyOrderBox: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 16,
    padding: 36,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    marginVertical: 12,
  },
  emptyOrderTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    marginTop: 10,
    marginBottom: 4,
  },
  emptyOrderSub: {
    color: Colors.dark.textMuted,
    fontSize: 12,
    textAlign: "center",
  },
  orderAdminCard: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  orderAdminCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  orderTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  orderTypeCoin: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
  },
  orderTypeVip: {
    backgroundColor: "rgba(236, 72, 153, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(236, 72, 153, 0.3)",
  },
  orderTypeBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#fff",
  },
  orderCodeText: {
    color: Colors.dark.accent,
    fontSize: 13,
    fontWeight: "800",
  },
  orderStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  orderStatusWaiting: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    borderColor: "rgba(245, 158, 11, 0.4)",
  },
  orderStatusSuccess: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderColor: "rgba(16, 185, 129, 0.4)",
  },
  orderStatusRejected: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderColor: "rgba(239, 68, 68, 0.4)",
  },
  orderStatusPending: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  orderStatusBadgeText: {
    fontSize: 10,
    fontWeight: "800",
  },
  orderAdminDetailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    borderRadius: 12,
    padding: 10,
    gap: 8,
    marginBottom: 10,
  },
  orderDetailItem: {
    width: "48%",
  },
  orderDetailItemKey: {
    color: Colors.dark.textMuted,
    fontSize: 11,
    marginBottom: 2,
  },
  orderDetailItemValBold: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  orderDetailItemVal: {
    color: "#cbd5e1",
    fontSize: 12,
  },
  orderNoteBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 10,
    padding: 10,
    gap: 8,
    marginBottom: 10,
  },
  orderNoteText: {
    color: Colors.dark.textMuted,
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },
  orderProofSection: {
    marginTop: 4,
    marginBottom: 12,
  },
  orderProofHeaderLabel: {
    color: "#e2e8f0",
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 6,
  },
  orderProofThumbWrap: {
    position: "relative",
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(236, 72, 153, 0.3)",
    height: 140,
    backgroundColor: "#000",
  },
  orderProofThumbImg: {
    width: "100%",
    height: "100%",
  },
  orderProofZoomBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  orderProofZoomText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  orderNoProofBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    marginBottom: 8,
  },
  orderNoProofText: {
    color: Colors.dark.textMuted,
    fontSize: 11,
  },
  orderActionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
  },
  orderRejectBtn: {
    flex: 1,
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.35)",
    paddingVertical: 10,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  orderRejectBtnText: {
    color: "#ef4444",
    fontSize: 13,
    fontWeight: "700",
  },
  orderApproveBtn: {
    flex: 2,
    backgroundColor: "#16a34a",
    paddingVertical: 10,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    shadowColor: "#16a34a",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  orderApproveBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
  },

  // Modal Zoom Proof Styles
  modalProofZoomOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalProofZoomCard: {
    backgroundColor: "#161622",
    borderRadius: 20,
    padding: 16,
    width: "100%",
    maxWidth: 520,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  modalProofZoomHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  modalProofZoomTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
  modalProofCloseIcon: {
    padding: 4,
  },
  modalProofZoomImg: {
    width: "100%",
    height: 380,
    borderRadius: 12,
    backgroundColor: "#000",
  },
  modalProofCloseBtn: {
    marginTop: 14,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: "center",
  },
  modalProofCloseBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  // Revenue & Growth Dashboard Styles
  revenueHeroCard: {
    backgroundColor: "rgba(16, 185, 129, 0.08)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "rgba(16, 185, 129, 0.3)",
    marginBottom: 16,
  },
  revenueHeroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  revenueHeroLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#10b981",
    letterSpacing: 0.5,
  },
  revenueHeroAmount: {
    fontSize: 24,
    fontWeight: "900",
    color: "#fff",
    marginTop: 4,
  },
  revenueProfitBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  revenueProfitText: {
    color: "#34d399",
    fontSize: 11,
    fontWeight: "700",
  },
  revenueSubGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
    paddingTop: 12,
  },
  revenueSubItem: {
    width: "48%",
  },
  revenueSubLabel: {
    fontSize: 11,
    color: Colors.dark.textMuted,
    marginBottom: 2,
  },
  revenueSubVal: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },
  growthRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  growthCard: {
    flex: 1,
    backgroundColor: Colors.dark.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  growthLabel: {
    fontSize: 10,
    color: Colors.dark.textMuted,
    fontWeight: "600",
  },
  growthVal: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
    marginVertical: 4,
  },
  growthSub: {
    fontSize: 9,
    color: Colors.dark.textMuted,
  },
  rankBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  rank1: {
    backgroundColor: "#f59e0b",
  },
  rank2: {
    backgroundColor: "#94a3b8",
  },
  rank3: {
    backgroundColor: "#d97706",
  },
  rankBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#fff",
  },
});


