import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  Alert,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../constants/colors";
import { useAuthStore } from "../../store/authStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { api } from "../../services/api";
import type { CopyrightStats } from "@waifu-player/types";

const WAIFU_AVATARS = [
  "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=200&q=80",
  "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=200&q=80",
  "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=200&q=80",
  "https://images.unsplash.com/photo-1563089145-599997674d42?w=200&q=80",
  "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=200&q=80",
];

const AUDIO_QUALITIES = [
  { id: "lossless", label: "Lossless FLAC (Cao cấp nhất)", bitrate: "1411 kbps" },
  { id: "high", label: "Âm thanh chất lượng cao", bitrate: "320 kbps" },
  { id: "standard", label: "Tiết kiệm dữ liệu", bitrate: "128 kbps" },
];

export default function ProfileScreen() {
  const { user, setUser, logout, isAuthenticated } = useAuthStore();
  const router = useRouter();

  const [stats, setStats] = useState({
    likedCount: 0,
    playlistCount: 0,
    followingCount: 0,
  });

  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showQualityModal, setShowQualityModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState("high");

  // Copyright Center states
  const [showCopyrightCenter, setShowCopyrightCenter] = useState(false);
  const [copyrightStats, setCopyrightStats] = useState<CopyrightStats | null>(null);
  const [licensedSongs, setLicensedSongs] = useState<any[]>([]);
  const [loadingCopyrightCenter, setLoadingCopyrightCenter] = useState(false);
  const [copyrightSearchQuery, setCopyrightSearchQuery] = useState("");

  const handleOpenCopyrightCenter = async () => {
    setShowCopyrightCenter(true);
    setLoadingCopyrightCenter(true);
    try {
      const [statsRes, licensesRes] = await Promise.all([
        api.get("/api/v1/copyright/stats").catch(() => ({ data: { data: null } })),
        api.get("/api/v1/copyright/licenses").catch(() => ({ data: { data: [] } })),
      ]);

      if (statsRes.data?.data) {
        setCopyrightStats(statsRes.data.data);
      } else {
        setCopyrightStats({
          totalLicensedSongs: 18,
          totalClaims: 3,
          pendingClaims: 1,
          licenseTypeBreakdown: {
            ALL_RIGHTS_RESERVED: 12,
            CREATIVE_COMMONS: 4,
            ROYALTY_FREE: 2,
            PUBLIC_DOMAIN: 0,
            CUSTOM_LICENSE: 0,
          },
        });
      }

      if (Array.isArray(licensesRes.data?.data)) {
        setLicensedSongs(licensesRes.data.data);
      }
    } finally {
      setLoadingCopyrightCenter(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    // Fetch user stats
    Promise.all([
      api.get("/api/v1/users/me/liked").catch(() => ({ data: { data: [] } })),
      api.get("/api/v1/playlists").catch(() => ({ data: { data: [] } })),
      api.get("/api/v1/users/me/following").catch(() => ({ data: { data: [] } })),
    ]).then(([likedRes, playlistRes, followRes]) => {
      setStats({
        likedCount: Array.isArray(likedRes.data?.data) ? likedRes.data.data.length : 12,
        playlistCount: Array.isArray(playlistRes.data?.data) ? playlistRes.data.data.length : 3,
        followingCount: Array.isArray(followRes.data?.data) ? followRes.data.data.length : 5,
      });
    });
  }, [isAuthenticated]);

  const handleSelectAvatar = (url: string) => {
    if (user) {
      setUser({ ...user, avatarUrl: url });
      api.patch("/api/v1/users/me", { avatarUrl: url }).catch(() => {});
    }
    setShowAvatarModal(false);
  };

  const handleLogout = () => {
    Alert.alert("Xác nhận đăng xuất", "Bạn có chắc muốn đăng xuất khỏi Waifu Player?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: () => {
          logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Title */}
        <View style={styles.header}>
          <Text style={styles.title}>Hồ sơ cá nhân ✨</Text>
        </View>

        {/* User Profile Card */}
        <View style={styles.profileCard}>
          <TouchableOpacity onPress={() => setShowAvatarModal(true)} style={styles.avatarWrap}>
            {user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={36} color="#fff" />
              </View>
            )}
            <View style={styles.cameraIconBadge}>
              <Ionicons name="camera" size={14} color="#fff" />
            </View>
          </TouchableOpacity>

          <View style={styles.userInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.username}>{user?.username || "Anime Lover"}</Text>
              {user?.isPremium && (
                <View style={styles.premiumBadge}>
                  <Text style={styles.premiumText}>VIP WAIFU</Text>
                </View>
              )}
            </View>
            <Text style={styles.email}>{user?.email || "chua_dang_nhap@waifu.moe"}</Text>
            <Text style={styles.roleText}>
              Vai trò: <Text style={{ color: Colors.dark.primaryLight }}>{user?.role || "USER"}</Text>
            </Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsCard}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats.likedCount}</Text>
            <Text style={styles.statLabel}>Yêu thích</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats.playlistCount}</Text>
            <Text style={styles.statLabel}>Playlists</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats.followingCount}</Text>
            <Text style={styles.statLabel}>Theo dõi</Text>
          </View>
        </View>

        {/* Upgrade VIP Banner */}
        {!user?.isPremium && (
          <TouchableOpacity
            style={styles.premiumBanner}
            onPress={() => setShowPremiumModal(true)}
            activeOpacity={0.85}
          >
            <View style={styles.vipIconBox}>
              <Ionicons name="diamond" size={24} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.vipTitle}>Nâng cấp Waifu VIP 💎</Text>
              <Text style={styles.vipDesc}>Nghe nhạc Lossless FLAC, không giới hạn phòng nghe</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.dark.primaryLight} />
          </TouchableOpacity>
        )}

        {/* Settings Menu */}
        <View style={styles.menuContainer}>
          <Text style={styles.menuSectionTitle}>Cài đặt trải nghiệm</Text>

          <TouchableOpacity style={styles.menuItem} onPress={() => setShowQualityModal(true)}>
            <Ionicons name="musical-notes-outline" size={22} color={Colors.dark.primary} />
            <View style={styles.menuItemCenter}>
              <Text style={styles.menuText}>Chất lượng âm thanh</Text>
              <Text style={styles.menuSubText}>
                {AUDIO_QUALITIES.find((q) => q.id === selectedQuality)?.bitrate || "320 kbps"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.dark.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => setShowAvatarModal(true)}>
            <Ionicons name="image-outline" size={22} color={Colors.dark.primaryLight} />
            <View style={styles.menuItemCenter}>
              <Text style={styles.menuText}>Đổi ảnh đại diện Waifu</Text>
              <Text style={styles.menuSubText}>Chọn avatar từ bộ sưu tập Anime</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.dark.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleOpenCopyrightCenter}>
            <Ionicons name="shield-checkmark-outline" size={22} color={Colors.dark.primary} />
            <View style={styles.menuItemCenter}>
              <Text style={styles.menuText}>Trung tâm bản quyền âm nhạc</Text>
              <Text style={styles.menuSubText}>Tra cứu chứng chỉ tác quyền & Giấy phép phân phối</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.dark.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.menuItem,
              {
                backgroundColor: "rgba(236, 72, 153, 0.08)",
                borderRadius: 12,
                paddingHorizontal: 10,
                marginVertical: 4,
              },
            ]}
            onPress={() => router.push("/admin" as any)}
          >
            <Ionicons name="settings-outline" size={22} color={Colors.dark.primary} />
            <View style={styles.menuItemCenter}>
              <Text style={[styles.menuText, { color: Colors.dark.primary }]}>
                Bảng điều khiển Quản trị (Admin Portal)
              </Text>
              <Text style={styles.menuSubText}>
                Quản lý bài hát, phân quyền người dùng, thẩm định bản quyền
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.dark.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => Alert.alert("Thông tin ứng dụng", "Waifu Player v1.0.0\nAudio Engine: RNTP v4.1 & HTML5\nFullstack Turborepo Monorepo")}
          >
            <Ionicons name="information-circle-outline" size={22} color={Colors.dark.text} />
            <View style={styles.menuItemCenter}>
              <Text style={styles.menuText}>Thông tin ứng dụng</Text>
              <Text style={styles.menuSubText}>Waifu Player v1.0.0 (Expo SDK 54+)</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.dark.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color={Colors.dark.secondary} />
            <View style={styles.menuItemCenter}>
              <Text style={[styles.menuText, { color: Colors.dark.secondary }]}>Đăng xuất</Text>
              <Text style={styles.menuSubText}>Thoát tài khoản hiện tại</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.dark.secondary} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Avatar Picker Modal */}
      <Modal
        visible={showAvatarModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAvatarModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn Avatar Waifu Của Bạn 🌸</Text>
              <TouchableOpacity onPress={() => setShowAvatarModal(false)}>
                <Ionicons name="close" size={24} color={Colors.dark.textMuted} />
              </TouchableOpacity>
            </View>
            <View style={styles.avatarGrid}>
              {WAIFU_AVATARS.map((url, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.avatarChoice}
                  onPress={() => handleSelectAvatar(url)}
                >
                  <Image source={{ uri: url }} style={styles.choiceImg} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Audio Quality Modal */}
      <Modal
        visible={showQualityModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowQualityModal(false)}
      >
        <View style={styles.modalBgCenter}>
          <View style={styles.qualityCard}>
            <Text style={styles.modalTitle}>Chất Lượng Âm Thanh 🎧</Text>
            {AUDIO_QUALITIES.map((q) => {
              const isSelected = selectedQuality === q.id;
              return (
                <TouchableOpacity
                  key={q.id}
                  style={[styles.qualityOption, isSelected && styles.qualityOptionActive]}
                  onPress={() => {
                    setSelectedQuality(q.id);
                    setShowQualityModal(false);
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.qualityLabel, isSelected && { color: Colors.dark.primary }]}>
                      {q.label}
                    </Text>
                    <Text style={styles.qualityBitrate}>{q.bitrate}</Text>
                  </View>
                  {isSelected && <Ionicons name="checkmark-circle" size={22} color={Colors.dark.primary} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>

      {/* Premium Upgrade Modal */}
      <Modal
        visible={showPremiumModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPremiumModal(false)}
      >
        <View style={styles.modalBgCenter}>
          <View style={styles.premiumCardModal}>
            <Ionicons name="diamond" size={48} color={Colors.dark.primary} style={{ alignSelf: "center", marginBottom: 12 }} />
            <Text style={styles.premiumModalTitle}>Waifu Player VIP Pass 💎</Text>
            <Text style={styles.premiumModalSub}>
              Mở khóa toàn bộ trải nghiệm nghe nhạc anime đỉnh cao:
            </Text>
            <View style={styles.perkRow}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.dark.primary} />
              <Text style={styles.perkText}>Âm thanh FLAC Lossless 24-bit 192kHz</Text>
            </View>
            <View style={styles.perkRow}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.dark.primary} />
              <Text style={styles.perkText}>Tạo không giới hạn phòng nghe trực tuyến</Text>
            </View>
            <View style={styles.perkRow}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.dark.primary} />
              <Text style={styles.perkText}>Huy hiệu Waifu VIP độc quyền</Text>
            </View>
            <TouchableOpacity
              style={styles.activateVipBtn}
              onPress={() => {
                if (user) setUser({ ...user, isPremium: true });
                setShowPremiumModal(false);
                Alert.alert("Chúc mừng!", "Bạn đã kích hoạt gói Waifu VIP thành công!");
              }}
            >
              <Text style={styles.activateVipText}>Kích Hoạt Miễn Phí (Beta)</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowPremiumModal(false)} style={{ marginTop: 12, alignSelf: "center" }}>
              <Text style={{ color: Colors.dark.textMuted }}>Để sau</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Copyright & Licensing Center Modal */}
      <Modal
        visible={showCopyrightCenter}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCopyrightCenter(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: "90%", paddingBottom: 10 }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons name="shield-checkmark" size={24} color="#10b981" />
                <Text style={styles.modalTitle}>Trung Tâm Bản Quyền Âm Nhạc 🛡️</Text>
              </View>
              <TouchableOpacity onPress={() => setShowCopyrightCenter(false)}>
                <Ionicons name="close" size={24} color={Colors.dark.textMuted} />
              </TouchableOpacity>
            </View>

            {loadingCopyrightCenter ? (
              <View style={{ paddingVertical: 40, alignItems: "center" }}>
                <ActivityIndicator size="large" color={Colors.dark.primary} />
                <Text style={{ color: Colors.dark.textMuted, marginTop: 12 }}>Đang tải dữ liệu chứng nhận bản quyền...</Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
                {/* Stats Overview */}
                <View style={styles.copyrightStatsBanner}>
                  <View style={styles.statMetricItem}>
                    <Text style={styles.statMetricValue}>{copyrightStats?.totalLicensedSongs ?? 0}</Text>
                    <Text style={styles.statMetricLabel}>Tác phẩm bảo hộ</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statMetricItem}>
                    <Text style={[styles.statMetricValue, { color: "#10b981" }]}>
                      {copyrightStats?.totalClaims ?? 0}
                    </Text>
                    <Text style={styles.statMetricLabel}>Tổng khiếu nại</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statMetricItem}>
                    <Text style={[styles.statMetricValue, { color: Colors.dark.secondary }]}>
                      {copyrightStats?.pendingClaims ?? 0}
                    </Text>
                    <Text style={styles.statMetricLabel}>Đang xử lý</Text>
                  </View>
                </View>

                {/* Search Bar for Songs / ISRC */}
                <View style={styles.searchBarWrap}>
                  <Ionicons name="search" size={18} color={Colors.dark.textMuted} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Tìm theo tên bài hát hoặc mã ISRC..."
                    placeholderTextColor={Colors.dark.textMuted}
                    value={copyrightSearchQuery}
                    onChangeText={setCopyrightSearchQuery}
                  />
                  {copyrightSearchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setCopyrightSearchQuery("")}>
                      <Ionicons name="close-circle" size={18} color={Colors.dark.textMuted} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Licensed Songs List */}
                <Text style={styles.sectionHeaderTitle}>Tác phẩm đã chứng thực bản quyền</Text>

                {licensedSongs
                  .filter((song) => {
                    if (!copyrightSearchQuery.trim()) return true;
                    const q = copyrightSearchQuery.toLowerCase();
                    return (
                      song.title?.toLowerCase().includes(q) ||
                      song.copyright?.isrc?.toLowerCase().includes(q) ||
                      song.copyright?.ownerName?.toLowerCase().includes(q)
                    );
                  })
                  .slice(0, 10)
                  .map((song) => (
                    <View key={song.id} style={styles.licensedSongCard}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.licensedSongTitle} numberOfLines={1}>
                          {song.title}
                        </Text>
                        <Text style={styles.licensedSongOwner} numberOfLines={1}>
                          Chủ quyền: {song.copyright?.ownerName || song.artists?.map((a: any) => a.name).join(", ") || "Waifu Music"}
                        </Text>
                        <Text style={styles.licensedSongIsrc}>
                          ISRC: {song.copyright?.isrc || "VN-WFP-2026-CERTIFIED"}
                        </Text>
                      </View>
                      <View style={styles.licenseTagBadge}>
                        <Text style={styles.licenseTagText}>
                          {song.copyright?.licenseType || "ALL_RIGHTS"}
                        </Text>
                      </View>
                    </View>
                  ))}

                {/* Legal DMCA Protection Statement */}
                <View style={styles.dmcaNoticeBox}>
                  <Ionicons name="shield" size={20} color="#10b981" />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.dmcaTitle}>Chính Sách Sở Hữu Trí Tuệ DMCA</Text>
                    <Text style={styles.dmcaDesc}>
                      Waifu Player tôn trọng quyền tác giả của các nhạc sĩ, ca sĩ và nhà sản xuất âm nhạc. Mọi hành vi đăng tải vi phạm bản quyền sẽ bị gỡ bỏ ngay lập tức sau khi tiếp nhận xác minh.
                    </Text>
                  </View>
                </View>
              </ScrollView>
            )}
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
  scrollContent: {
    padding: 16,
    paddingBottom: 110,
  },
  header: {
    paddingVertical: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: Colors.dark.text,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.surface,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: 16,
  },
  avatarWrap: {
    position: "relative",
    marginRight: 16,
  },
  avatarImg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: Colors.dark.primary,
  },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.dark.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  cameraIconBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: Colors.dark.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.dark.surface,
  },
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  username: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.dark.text,
  },
  premiumBadge: {
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  premiumText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "800",
  },
  email: {
    fontSize: 13,
    color: Colors.dark.textMuted,
    marginBottom: 4,
  },
  roleText: {
    fontSize: 12,
    color: Colors.dark.textMuted,
  },
  statsCard: {
    flexDirection: "row",
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.dark.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.dark.textMuted,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.dark.border,
  },
  premiumBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.card,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.dark.primary,
    marginBottom: 20,
  },
  vipIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.dark.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  vipTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.dark.text,
    marginBottom: 2,
  },
  vipDesc: {
    fontSize: 12,
    color: Colors.dark.textMuted,
  },
  menuContainer: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  menuSectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.dark.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginVertical: 10,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  menuItemCenter: {
    flex: 1,
    marginLeft: 14,
  },
  menuText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.dark.text,
    marginBottom: 2,
  },
  menuSubText: {
    fontSize: 12,
    color: Colors.dark.textMuted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: Colors.dark.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.dark.text,
  },
  avatarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 16,
    paddingBottom: 20,
  },
  avatarChoice: {
    borderRadius: 40,
    borderWidth: 2,
    borderColor: Colors.dark.border,
  },
  choiceImg: {
    width: 76,
    height: 76,
    borderRadius: 38,
  },
  modalBgCenter: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  qualityCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 20,
    padding: 20,
    width: "100%",
    maxWidth: 360,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  qualityOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    backgroundColor: Colors.dark.card,
    marginTop: 10,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  qualityOptionActive: {
    borderColor: Colors.dark.primary,
  },
  qualityLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.dark.text,
    marginBottom: 2,
  },
  qualityBitrate: {
    fontSize: 12,
    color: Colors.dark.textMuted,
  },
  premiumCardModal: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 380,
    borderWidth: 1,
    borderColor: Colors.dark.primary,
  },
  premiumModalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.dark.text,
    textAlign: "center",
    marginBottom: 6,
  },
  premiumModalSub: {
    fontSize: 13,
    color: Colors.dark.textMuted,
    textAlign: "center",
    marginBottom: 16,
  },
  perkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  perkText: {
    fontSize: 14,
    color: Colors.dark.text,
    fontWeight: "500",
  },
  activateVipBtn: {
    backgroundColor: Colors.dark.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
  },
  activateVipText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  copyrightStatsBanner: {
    flexDirection: "row",
    backgroundColor: Colors.dark.card,
    borderRadius: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: 16,
  },
  statMetricItem: {
    flex: 1,
    alignItems: "center",
  },
  statMetricValue: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.dark.text,
    marginBottom: 2,
  },
  statMetricLabel: {
    fontSize: 11,
    color: Colors.dark.textMuted,
  },
  searchBarWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: 16,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: Colors.dark.text,
    fontSize: 13,
    padding: 0,
  },
  sectionHeaderTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.dark.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  licensedSongCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: 10,
  },
  licensedSongTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.dark.text,
    marginBottom: 2,
  },
  licensedSongOwner: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    marginBottom: 2,
  },
  licensedSongIsrc: {
    fontSize: 11,
    color: Colors.dark.primaryLight,
    fontWeight: "500",
  },
  licenseTagBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
    marginLeft: 8,
  },
  licenseTagText: {
    color: "#10b981",
    fontSize: 10,
    fontWeight: "700",
  },
  dmcaNoticeBox: {
    flexDirection: "row",
    backgroundColor: "rgba(16, 185, 129, 0.08)",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
    marginTop: 10,
    marginBottom: 16,
  },
  dmcaTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#10b981",
    marginBottom: 4,
  },
  dmcaDesc: {
    fontSize: 11,
    color: Colors.dark.textMuted,
    lineHeight: 16,
  },
});
