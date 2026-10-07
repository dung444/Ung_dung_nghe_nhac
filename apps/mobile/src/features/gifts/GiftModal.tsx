import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/colors";
import { api } from "../../services/api";
import { ENDPOINTS } from "../../constants/api";
import { useAuthStore } from "../../store/authStore";
import { useToastStore } from "../../store/toastStore";
import type { Song } from "@waifu-player/types";

interface AnimeGift {
  id: string;
  name: string;
  emoji: string;
  coins: number;
  description: string;
}

interface CoinPackage {
  id: string;
  name: string;
  coins: number;
  priceVnd: number;
  bonusText?: string;
}

const DEFAULT_GIFTS: AnimeGift[] = [
  { id: "sakura", name: "Hoa Anh Đào", emoji: "🌸", coins: 5, description: "Cánh hoa anh đào mùa xuân lãng mạn" },
  { id: "dango", name: "Bánh Dango", emoji: "🍡", coins: 10, description: "Xiên bánh Dango 3 màu ngọt ngào" },
  { id: "heart", name: "Trái Tim Waifu", emoji: "💖", coins: 20, description: "Tình yêu và năng lượng waifu bùng nổ" },
  { id: "boba", name: "Trà Sữa Maid Cafe", emoji: "☕", coins: 50, description: "Ly trà sữa hầu gái phép thuật" },
  { id: "magic_wand", name: "Gậy Phép Mahou", emoji: "🪄", coins: 100, description: "Gậy phép thuật biến hóa thần kỳ" },
  { id: "crown", name: "Vương Miện Nữ Thần", emoji: "👑", coins: 500, description: "Vương miện vàng tôn vinh bài hát siêu phẩm" },
];

const DEFAULT_COIN_PACKAGES: CoinPackage[] = [
  { id: "COIN_50", name: "Túi Xu Đồng (50 Xu)", coins: 50, priceVnd: 10000 },
  { id: "COIN_120", name: "Hộp Xu Bạc (120 Xu)", coins: 120, priceVnd: 20000, bonusText: "+20% Tặng Thêm" },
  { id: "COIN_350", name: "Rương Xu Vàng (350 Xu)", coins: 350, priceVnd: 50000, bonusText: "+40% Tặng Thêm" },
  { id: "COIN_800", name: "Kho Báu Sakura (800 Xu)", coins: 800, priceVnd: 100000, bonusText: "+60% Siêu Hời" },
  { id: "COIN_2000", name: "Kho Báu Hoàng Gia (2000 Xu)", coins: 2000, priceVnd: 200000, bonusText: "+100% Gấp Đôi" },
];

import { PaymentCheckoutModal } from "../payments/PaymentCheckoutModal";

interface GiftModalProps {
  visible: boolean;
  song: Song | null;
  onClose: () => void;
  onGiftSuccess?: () => void;
}

export function GiftModal({ visible, song, onClose, onGiftSuccess }: GiftModalProps) {
  const { isAuthenticated } = useAuthStore();
  const { showSuccess, showWarning, showError } = useToastStore();

  const [gifts, setGifts] = useState<AnimeGift[]>(DEFAULT_GIFTS);
  const [coinPackages, setCoinPackages] = useState<CoinPackage[]>(DEFAULT_COIN_PACKAGES);
  const [userCoins, setUserCoins] = useState<number>(100);

  const [selectedGiftId, setSelectedGiftId] = useState<string>("heart");
  const [giftCount, setGiftCount] = useState<number>(1);
  const [giftMessage, setGiftMessage] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  // Top-up Modal State & Checkout Flow
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [selectedPkgForCheckout, setSelectedPkgForCheckout] = useState<CoinPackage | null>(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  const loadCoinsAndGifts = async () => {
    try {
      const catalogRes = await api.get(ENDPOINTS.gifts).catch(() => null);
      if (catalogRes?.data?.success) {
        if (catalogRes.data.data.gifts) setGifts(catalogRes.data.data.gifts);
        if (catalogRes.data.data.coinPackages) setCoinPackages(catalogRes.data.data.coinPackages);
      }

      if (isAuthenticated) {
        const balanceRes = await api.get(ENDPOINTS.coinBalance).catch(() => null);
        if (balanceRes?.data?.success && balanceRes.data.data?.coins !== undefined) {
          setUserCoins(balanceRes.data.data.coins);
        }
      }
    } catch {}
  };

  useEffect(() => {
    if (visible) {
      loadCoinsAndGifts();
    }
  }, [visible, isAuthenticated]);

  const selectedGift = gifts.find((g) => g.id === selectedGiftId) || gifts[0];
  const totalCost = (selectedGift?.coins || 0) * giftCount;

  const handleSendGift = async () => {
    if (!song) return;
    if (!isAuthenticated) {
      showWarning("Chưa đăng nhập", "Vui lòng đăng nhập để tặng quà cho bài hát!");
      return;
    }
    if (userCoins < totalCost) {
      showWarning("Số dư xu không đủ", `Bạn cần ${totalCost} Xu, hiện chỉ có ${userCoins} Xu. Hãy nạp thêm xu!`);
      setShowTopupModal(true);
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post(ENDPOINTS.sendGift, {
        songId: song.id,
        giftId: selectedGift.id,
        count: giftCount,
        message: giftMessage.trim() || undefined,
      });

      if (res.data?.success) {
        const remaining = res.data.data?.remainingCoins ?? userCoins - totalCost;
        setUserCoins(remaining);
        showSuccess(
          "Tặng quà thành công! ✨",
          `Đã tặng ${giftCount}x ${selectedGift.emoji} ${selectedGift.name} cho "${song.title}"!`
        );
        onGiftSuccess?.();
        onClose();
        setGiftMessage("");
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.error || "Không thể gửi quà tặng. Vui lòng thử lại!";
      showError("Tặng quà thất bại", errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBuyCoinPackage = (pkg: CoinPackage) => {
    if (!isAuthenticated) {
      showWarning("Chưa đăng nhập", "Vui lòng đăng nhập trước khi nạp xu!");
      return;
    }
    setSelectedPkgForCheckout(pkg);
    setShowTopupModal(false);
    setShowCheckoutModal(true);
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Text style={styles.headerTitle}>Tặng Quà Anime Waifu 🎁✨</Text>
                <Text style={styles.headerSub}>Ủng hộ bài hát & nhận huy hiệu fan cứng</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color={Colors.dark.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Song Meta Banner */}
            {song && (
              <View style={styles.songCard}>
                {song.coverUrl ? (
                  <Image source={{ uri: song.coverUrl }} style={styles.songThumb} />
                ) : (
                  <View style={[styles.songThumb, styles.thumbFallback]}>
                    <Ionicons name="musical-note" size={18} color={Colors.dark.primary} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.songTitle} numberOfLines={1}>
                    {song.title}
                  </Text>
                  <Text style={styles.songArtist} numberOfLines={1}>
                    {song.artists?.map((a) => a.name).join(", ") || "Nghệ sĩ Waifu"}
                  </Text>
                </View>
                {/* Coin balance indicator */}
                <TouchableOpacity style={styles.coinBadge} onPress={() => setShowTopupModal(true)}>
                  <Text style={styles.coinBadgeIcon}>🪙</Text>
                  <Text style={styles.coinBadgeVal}>{userCoins} Xu</Text>
                  <Ionicons name="add-circle" size={14} color="#f59e0b" style={{ marginLeft: 3 }} />
                </TouchableOpacity>
              </View>
            )}

            {/* Gift Items Grid */}
            <Text style={styles.sectionLabel}>CHỌN QUÀ TẶNG Ý NGHĨA 🌸</Text>
            <View style={styles.giftGrid}>
              {gifts.map((item) => {
                const isSelected = item.id === selectedGiftId;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.giftBox, isSelected && styles.giftBoxActive]}
                    onPress={() => setSelectedGiftId(item.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.giftEmoji}>{item.emoji}</Text>
                    <Text style={styles.giftName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <View style={styles.giftPriceRow}>
                      <Text style={styles.giftPriceCoin}>🪙</Text>
                      <Text style={styles.giftPriceText}>{item.coins} xu</Text>
                    </View>
                    {isSelected && <View style={styles.activeCheck}><Ionicons name="checkmark" size={11} color="#fff" /></View>}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Count Selector */}
            <View style={styles.countRow}>
              <Text style={styles.countLabel}>Số lượng gửi:</Text>
              <View style={styles.multiplierList}>
                {[1, 5, 10, 50].map((num) => (
                  <TouchableOpacity
                    key={num}
                    style={[styles.multiplierBtn, giftCount === num && styles.multiplierBtnActive]}
                    onPress={() => setGiftCount(num)}
                  >
                    <Text style={[styles.multiplierText, giftCount === num && styles.multiplierTextActive]}>
                      x{num}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Note input */}
            <TextInput
              style={styles.inputMessage}
              placeholder="Để lại lời nhắn dễ thương cho bài hát... 💬"
              placeholderTextColor={Colors.dark.textMuted}
              value={giftMessage}
              onChangeText={setGiftMessage}
              maxLength={120}
            />

            {/* Submit Bar */}
            <View style={styles.submitBar}>
              <View>
                <Text style={styles.totalPriceLabel}>Tổng chi phí:</Text>
                <Text style={styles.totalPriceVal}>
                  🪙 {totalCost} Xu
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.sendBtn, submitting && { opacity: 0.6 }]}
                onPress={handleSendGift}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={16} color="#fff" />
                    <Text style={styles.sendBtnText}>Tặng Quà Ngay ✨</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Nạp Xu (Top-up Coins) */}
      <Modal visible={showTopupModal} transparent animationType="fade" onRequestClose={() => setShowTopupModal(false)}>
        <View style={styles.overlay}>
          <View style={styles.topupCard}>
            <View style={styles.header}>
              <View>
                <Text style={styles.headerTitle}>Nạp Xu Waifu Coin 🪙</Text>
                <Text style={styles.headerSub}>Dùng xu để tặng quà và tương tác cùng cộng đồng</Text>
              </View>
              <TouchableOpacity onPress={() => setShowTopupModal(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color={Colors.dark.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380, marginTop: 10 }}>
              {coinPackages.map((pkg) => (
                <TouchableOpacity
                  key={pkg.id}
                  style={styles.packageRow}
                  onPress={() => handleBuyCoinPackage(pkg)}
                  activeOpacity={0.8}
                >
                  <View style={styles.pkgLeft}>
                    <Text style={styles.pkgIcon}>🪙</Text>
                    <View>
                      <Text style={styles.pkgName}>{pkg.name}</Text>
                      {pkg.bonusText && <Text style={styles.pkgBonus}>{pkg.bonusText}</Text>}
                    </View>
                  </View>
                  <View style={styles.pkgBuyBtn}>
                    <Text style={styles.pkgPriceText}>{pkg.priceVnd.toLocaleString()} đ</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.topupFooter}>
              <Text style={styles.topupFooterText}>
                Hỗ trợ thanh toán VietQR Banking tự động qua MB, Vietcombank, Techcombank, MoMo.
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Thanh Toán Mua Xu (Fintech Checkout Flow) */}
      <PaymentCheckoutModal
        visible={showCheckoutModal}
        type="COIN_TOPUP"
        selectedCoinPackage={selectedPkgForCheckout}
        onClose={() => setShowCheckoutModal(false)}
        onPaymentSuccess={(_order, newBalance) => {
          if (newBalance !== undefined) {
            setUserCoins(newBalance);
          }
          setShowCheckoutModal(false);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Colors.dark.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.dark.text,
  },
  headerSub: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  songCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.card,
    borderRadius: 14,
    padding: 10,
    gap: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  songThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  thumbFallback: {
    backgroundColor: Colors.dark.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  songTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.dark.text,
  },
  songArtist: {
    fontSize: 12,
    color: Colors.dark.textMuted,
  },
  coinBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.4)",
  },
  coinBadgeIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  coinBadgeVal: {
    fontSize: 12,
    fontWeight: "800",
    color: "#f59e0b",
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.dark.primaryLight,
    letterSpacing: 1,
    marginBottom: 10,
  },
  giftGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  giftBox: {
    width: "31%",
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.dark.border,
    position: "relative",
  },
  giftBoxActive: {
    borderColor: Colors.dark.primary,
    backgroundColor: "rgba(236, 72, 153, 0.15)",
  },
  activeCheck: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: Colors.dark.primary,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  giftEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  giftName: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.dark.text,
    textAlign: "center",
  },
  giftPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 3,
  },
  giftPriceCoin: {
    fontSize: 10,
  },
  giftPriceText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#f59e0b",
  },
  countRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  countLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.dark.text,
  },
  multiplierList: {
    flexDirection: "row",
    gap: 6,
  },
  multiplierBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: Colors.dark.card,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  multiplierBtnActive: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
  },
  multiplierText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.dark.textMuted,
  },
  multiplierTextActive: {
    color: "#fff",
  },
  inputMessage: {
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: Colors.dark.text,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: 16,
  },
  submitBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
  },
  totalPriceLabel: {
    fontSize: 11,
    color: Colors.dark.textMuted,
  },
  totalPriceVal: {
    fontSize: 18,
    fontWeight: "800",
    color: "#f59e0b",
  },
  sendBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 16,
    gap: 6,
  },
  sendBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
  topupCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  packageRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.dark.card,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  pkgLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  pkgIcon: {
    fontSize: 22,
  },
  pkgName: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.dark.text,
  },
  pkgBonus: {
    fontSize: 11,
    fontWeight: "800",
    color: "#10b981",
    marginTop: 2,
  },
  pkgBuyBtn: {
    backgroundColor: "rgba(245, 158, 11, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f59e0b",
  },
  pkgPriceText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#f59e0b",
  },
  topupFooter: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
  topupFooterText: {
    fontSize: 11,
    color: Colors.dark.textMuted,
    textAlign: "center",
  },
});
