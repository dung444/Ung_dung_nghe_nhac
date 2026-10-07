import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/colors";
import { api } from "../../services/api";
import { ENDPOINTS } from "../../constants/api";
import { useAuthStore } from "../../store/authStore";
import { useToastStore } from "../../store/toastStore";
import type { CoinPackage, PaymentOrder } from "@waifu-player/types";

export interface PaymentCheckoutModalProps {
  visible: boolean;
  type: "COIN_TOPUP" | "BUY_VIP";
  selectedCoinPackage?: CoinPackage | null;
  selectedVipPackageId?: string;
  customAmount?: number;
  onClose: () => void;
  onPaymentSuccess?: (order: PaymentOrder, newBalance?: number) => void;
}

export const DEFAULT_COIN_PACKAGES: CoinPackage[] = [
  { id: "COIN_50", name: "Túi Xu Đồng (50 Xu)", coins: 50, priceVnd: 10000 },
  { id: "COIN_120", name: "Hộp Xu Bạc (120 Xu)", coins: 120, priceVnd: 20000, bonusText: "+20% Tặng Thêm" },
  { id: "COIN_350", name: "Rương Xu Vàng (350 Xu)", coins: 350, priceVnd: 50000, bonusText: "+40% Phổ Biến" },
  { id: "COIN_800", name: "Kho Báu Sakura (800 Xu)", coins: 800, priceVnd: 100000, bonusText: "+60% Siêu Hời" },
  { id: "COIN_2000", name: "Kho Báu Hoàng Gia (2000 Xu)", coins: 2000, priceVnd: 200000, bonusText: "+100% Gấp Đôi Xu" },
  { id: "COIN_5500", name: "Đại Phú Hào Waifu (5500 Xu)", coins: 5500, priceVnd: 500000, bonusText: "+120% Cực Khủng" },
];

export const VIP_PACKAGES_LIST = [
  {
    id: "VIP_1_MONTH",
    name: "VIP Anime Waifu Pass (1 Tháng)",
    priceVnd: 49000,
    duration: "30 Ngày",
    badge: "PHỔ BIẾN",
    desc: "Mở khóa 100% Lossless 24-bit FLAC & nghe không quảng cáo",
  },
  {
    id: "VIP_3_MONTHS",
    name: "VIP Sakura Season Pass (3 Tháng)",
    priceVnd: 129000,
    duration: "90 Ngày",
    badge: "TIẾT KIỆM 15%",
    desc: "Huy hiệu Sakura phát sáng, live room không giới hạn",
  },
  {
    id: "VIP_1_YEAR",
    name: "VIP Lifetime Anime Master (1 Năm)",
    priceVnd: 449000,
    duration: "365 Ngày",
    badge: "SIÊU TIẾT KIỆM 30%",
    desc: "Vương miện vàng hoàng gia, tặng 100 điểm bản quyền",
  },
];

const PAYMENT_METHODS = [
  { id: "VIETQR_BANKING", name: "VietQR 24/7", desc: "Chuyển khoản liên ngân hàng quét mã tức thì", icon: "qr-code", badge: "KHUYÊN DÙNG" },
  { id: "MOMO", name: "Ví MoMo", desc: "Thanh toán qua ví điện tử MoMo", icon: "wallet", badge: "NHANH CHÓNG" },
  { id: "ZALOPAY", name: "Ví ZaloPay", desc: "Xác thực qua ứng dụng ZaloPay", icon: "flash", badge: "TIỆN LỢI" },
  { id: "VNPAY", name: "VNPay / Thẻ ATM", desc: "Cổng thanh toán quốc gia VNPay QR & Thẻ", icon: "card", badge: "AN TOÀN" },
];

export const BANK_PROOF_PRESETS = [
  {
    id: "mb",
    bankName: "MBBank",
    thumb: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=500&auto=format&fit=crop&q=60",
    label: "Biên lai MBBank 24/7",
  },
  {
    id: "vcb",
    bankName: "Vietcombank",
    thumb: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=500&auto=format&fit=crop&q=60",
    label: "Biên lai VCB Digibank",
  },
  {
    id: "momo",
    bankName: "Ví MoMo",
    thumb: "https://images.unsplash.com/photo-1616077168079-7e09a677fb2c?w=500&auto=format&fit=crop&q=60",
    label: "Biên lai Ví MoMo",
  },
  {
    id: "tcb",
    bankName: "Techcombank",
    thumb: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=500&auto=format&fit=crop&q=60",
    label: "Biên lai Techcombank",
  },
];

export function PaymentCheckoutModal({
  visible,
  type,
  selectedCoinPackage,
  selectedVipPackageId,
  customAmount,
  onClose,
  onPaymentSuccess,
}: PaymentCheckoutModalProps) {
  const { user, setUser } = useAuthStore();
  const { showSuccess, showError, showInfo } = useToastStore();

  const [step, setStep] = useState<"SELECT_METHOD" | "PAYMENT_QR" | "WAITING_APPROVAL" | "SUCCESS">("SELECT_METHOD");
  const [selectedMethod, setSelectedMethod] = useState("VIETQR_BANKING");
  const [loading, setLoading] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<PaymentOrder | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Transfer Proof States (Gửi ảnh biên lai chuyển khoản để admin duyệt)
  const [proofImageUrl, setProofImageUrl] = useState<string>("");
  const [userNote, setUserNote] = useState<string>("");
  const [submittingProof, setSubmittingProof] = useState<boolean>(false);

  // Coin selection states
  const [activeCoinPkg, setActiveCoinPkg] = useState<CoinPackage | null>(
    selectedCoinPackage || DEFAULT_COIN_PACKAGES[2]
  );
  const [isCustomMode, setIsCustomMode] = useState<boolean>(!selectedCoinPackage && !!customAmount);
  const [customVndInput, setCustomVndInput] = useState<string>(customAmount ? String(customAmount) : "50000");

  // VIP selection states
  const [activeVipId, setActiveVipId] = useState<string>(selectedVipPackageId || "VIP_1_MONTH");

  // Timer countdown 15 minutes (900 seconds)
  const [timeLeft, setTimeLeft] = useState<number>(900);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (visible) {
      setStep("SELECT_METHOD");
      setCurrentOrder(null);
      setTimeLeft(900);

      if (selectedCoinPackage) {
        setActiveCoinPkg(selectedCoinPackage);
        setIsCustomMode(false);
      } else if (customAmount) {
        setCustomVndInput(String(customAmount));
        setIsCustomMode(true);
      } else {
        setActiveCoinPkg(DEFAULT_COIN_PACKAGES[2]);
        setIsCustomMode(false);
      }

      if (selectedVipPackageId) {
        setActiveVipId(selectedVipPackageId);
      }

      setProofImageUrl("");
      setUserNote("");
      setSubmittingProof(false);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [visible, selectedCoinPackage, customAmount, selectedVipPackageId]);

  useEffect(() => {
    if (step === "PAYMENT_QR" && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [step]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleCopy = (text: string, label: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    setCopiedKey(label);
    showInfo("Đã sao chép 📋", `${label}: ${text}`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Helper calculations for dynamic display
  const getSelectedCoins = () => {
    if (type !== "COIN_TOPUP") return 0;
    if (isCustomMode) {
      const amt = Number(customVndInput) || 0;
      return Math.floor(amt / 200);
    }
    return activeCoinPkg?.coins || 350;
  };

  const getSelectedPrice = () => {
    if (type === "COIN_TOPUP") {
      if (isCustomMode) {
        return Number(customVndInput) || 50000;
      }
      return activeCoinPkg?.priceVnd || 50000;
    }
    const vip = VIP_PACKAGES_LIST.find((v) => v.id === activeVipId);
    return vip?.priceVnd || 49000;
  };

  const getSelectedTitle = () => {
    if (type === "COIN_TOPUP") {
      if (isCustomMode) {
        return `Nạp ${getSelectedCoins()} Xu Waifu Tùy Chọn`;
      }
      return activeCoinPkg?.name || "Rương Xu Vàng (350 Xu)";
    }
    const vip = VIP_PACKAGES_LIST.find((v) => v.id === activeVipId);
    return vip?.name || "VIP Anime Waifu Pass (1 Tháng)";
  };

  // Step 1: Create Payment Order
  const handleCreateOrder = async () => {
    setLoading(true);
    try {
      const payload: any = {
        type,
        method: selectedMethod,
      };

      if (type === "COIN_TOPUP") {
        if (!isCustomMode && activeCoinPkg) {
          payload.packageId = activeCoinPkg.id;
        } else {
          const amt = Math.max(10000, Number(customVndInput) || 10000);
          payload.amount = amt;
        }
      } else {
        payload.packageId = activeVipId;
      }

      const res = await api.post(ENDPOINTS.createOrder, payload);
      if (res.data?.success && res.data?.data?.order) {
        setCurrentOrder(res.data.data.order);
        setStep("PAYMENT_QR");
        setTimeLeft(900);
      } else {
        throw new Error(res.data?.message || "Không thể tạo mã thanh toán");
      }
    } catch (err: any) {
      showError("Lỗi thanh toán", err.response?.data?.error || err.message || "Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  // Step 1.5: Gửi ảnh biên lai chuyển khoản để Admin duyệt (Xu hoặc VIP)
  const handleSubmitProof = async () => {
    if (!currentOrder) return;
    const finalProofUrl = proofImageUrl.trim() || BANK_PROOF_PRESETS[0].thumb;
    setSubmittingProof(true);
    try {
      const res = await api.post(ENDPOINTS.submitOrderProof(currentOrder.id), {
        proofImageUrl: finalProofUrl,
        userNote: userNote.trim() || `Đã chuyển khoản đơn hàng ${currentOrder.orderCode}`,
      });
      if (res.data?.success) {
        const updatedOrder = res.data.data?.order || {
          ...currentOrder,
          status: "WAITING_APPROVAL",
          proofImageUrl: finalProofUrl,
          userNote: userNote.trim() || `Đã chuyển khoản đơn hàng ${currentOrder.orderCode}`,
        };
        setCurrentOrder(updatedOrder);
        setStep("WAITING_APPROVAL");
        showSuccess(
          "Gửi biên lai thành công! 📤",
          "Đơn hàng đang chờ Admin kiểm tra và duyệt " + (type === "COIN_TOPUP" ? "xu" : "VIP") + "."
        );
      } else {
        throw new Error(res.data?.message || "Không thể gửi ảnh biên lai");
      }
    } catch (err: any) {
      showError("Gửi biên lai thất bại", err.response?.data?.error || err.message || "Vui lòng thử lại!");
    } finally {
      setSubmittingProof(false);
    }
  };

  // Step 2: Confirm Payment Order
  const handleConfirmOrder = async () => {
    if (!currentOrder) return;
    setLoading(true);
    try {
      const res = await api.post(ENDPOINTS.confirmOrder(currentOrder.id));
      if (res.data?.success) {
        const updatedOrder = res.data.data?.order || { ...currentOrder, status: "SUCCESS" };
        setCurrentOrder(updatedOrder);
        setStep("SUCCESS");

        if (type === "BUY_VIP" && user) {
          setUser({ ...user, isPremium: true });
        }

        showSuccess("Thanh toán thành công! 🎉", res.data.message || "Giao dịch đã được ghi nhận hoàn tất.");
        onPaymentSuccess?.(updatedOrder, res.data.data?.balance);
      } else {
        throw new Error(res.data?.message || "Xác nhận thanh toán không thành công");
      }
    } catch (err: any) {
      showError("Xác nhận thất bại", err.response?.data?.error || "Vui lòng kiểm tra lại chuyển khoản.");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Cancel Payment Order
  const handleCancelOrder = async () => {
    if (!currentOrder) {
      onClose();
      return;
    }
    try {
      await api.post(ENDPOINTS.cancelOrder(currentOrder.id)).catch(() => {});
      showInfo("Đã hủy đơn hàng", "Giao dịch đã được đóng.");
      onClose();
    } catch {
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleWrap}>
              <View style={styles.headerBadge}>
                <Ionicons name="shield-checkmark" size={14} color="#10b981" />
                <Text style={styles.headerBadgeText}>CỔNG THANH TOÁN BẢO MẬT</Text>
              </View>
              <Text style={styles.headerTitle}>
                {step === "SUCCESS"
                  ? "Biên Lai Thanh Toán ✨"
                  : step === "WAITING_APPROVAL"
                  ? "Chờ Admin Duyệt Biên Lai ⏳"
                  : step === "PAYMENT_QR"
                  ? "Quét Mã Thanh Toán VietQR"
                  : type === "COIN_TOPUP"
                  ? "Nạp Xu & Mệnh Giá Thanh Toán 🪙"
                  : "Nâng Cấp Waifu VIP Pass 💎"}
              </Text>
            </View>
            <TouchableOpacity onPress={step === "PAYMENT_QR" ? handleCancelOrder : onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={Colors.dark.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* ──────── STEP 1: CHỌN SỐ XU / MỆNH GIÁ & PHƯƠNG THỨC ──────── */}
            {step === "SELECT_METHOD" && (
              <View>
                {/* 1. SELECTION FOR COIN TOPUP */}
                {type === "COIN_TOPUP" && (
                  <View style={{ marginBottom: 18 }}>
                    <View style={styles.sectionTitleRow}>
                      <Text style={styles.sectionTitle}>CHỌN SỐ XU & MỆNH GIÁ NẠP 🪙</Text>
                      <Text style={styles.sectionSubtitle}>10.000 ₫ = 50 Xu</Text>
                    </View>

                    {/* 2-Column Grid of Coin Packages */}
                    <View style={styles.coinGrid}>
                      {DEFAULT_COIN_PACKAGES.map((pkg) => {
                        const isSelected = !isCustomMode && activeCoinPkg?.id === pkg.id;
                        return (
                          <TouchableOpacity
                            key={pkg.id}
                            style={[styles.coinGridCard, isSelected && styles.coinGridCardActive]}
                            onPress={() => {
                              setActiveCoinPkg(pkg);
                              setIsCustomMode(false);
                            }}
                            activeOpacity={0.8}
                          >
                            {/* Bonus Badge */}
                            {pkg.bonusText && (
                              <View style={styles.coinBonusBadge}>
                                <Text style={styles.coinBonusText}>{pkg.bonusText}</Text>
                              </View>
                            )}

                            {/* Coin Number */}
                            <View style={styles.coinRowCenter}>
                              <Text style={styles.coinEmoji}>🪙</Text>
                              <Text style={[styles.coinNumberText, isSelected && { color: "#f59e0b" }]}>
                                {pkg.coins.toLocaleString()} Xu
                              </Text>
                            </View>

                            {/* Price in VND */}
                            <Text style={[styles.coinPriceText, isSelected && { color: "#fff", fontWeight: "800" }]}>
                              {pkg.priceVnd.toLocaleString()} ₫
                            </Text>

                            {/* Active Checkmark */}
                            {isSelected && (
                              <View style={styles.selectedCheckBadge}>
                                <Ionicons name="checkmark-circle" size={16} color="#f59e0b" />
                              </View>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {/* Custom Amount Option */}
                    <TouchableOpacity
                      style={[styles.customToggleBox, isCustomMode && styles.customToggleBoxActive]}
                      onPress={() => setIsCustomMode(!isCustomMode)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name="create-outline"
                        size={18}
                        color={isCustomMode ? Colors.dark.primaryLight : Colors.dark.textMuted}
                      />
                      <Text style={[styles.customToggleText, isCustomMode && { color: "#fff", fontWeight: "700" }]}>
                        Hoặc tự nhập số tiền nạp tùy chọn (VNĐ)
                      </Text>
                      <Ionicons name={isCustomMode ? "chevron-up" : "chevron-down"} size={16} color={Colors.dark.textMuted} />
                    </TouchableOpacity>

                    {isCustomMode && (
                      <View style={styles.customInputContainer}>
                        <View style={styles.customInputRow}>
                          <TextInput
                            style={styles.customInput}
                            placeholder="Nhập số tiền VNĐ (VD: 150000)..."
                            placeholderTextColor={Colors.dark.textMuted}
                            value={customVndInput}
                            onChangeText={setCustomVndInput}
                            keyboardType="numeric"
                          />
                          <View style={styles.customCalcBox}>
                            <Text style={styles.customCalcText}>
                              Nhận: <Text style={{ color: "#f59e0b", fontWeight: "800" }}>🪙 {getSelectedCoins()} Xu</Text>
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.customHintText}>
                          Tối thiểu 10.000 VNĐ. Hệ thống tự động quy đổi: 1.000 VNĐ = 5 Xu Waifu.
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {/* 2. SELECTION FOR VIP PASS */}
                {type === "BUY_VIP" && (
                  <View style={{ marginBottom: 18 }}>
                    <Text style={styles.sectionTitle}>CHỌN GÓI HỘI VIÊN WAIFU VIP 💎</Text>
                    <View style={{ gap: 10, marginTop: 8 }}>
                      {VIP_PACKAGES_LIST.map((pkg) => {
                        const isSelected = activeVipId === pkg.id;
                        return (
                          <TouchableOpacity
                            key={pkg.id}
                            style={[styles.vipChoiceCard, isSelected && styles.vipChoiceCardActive]}
                            onPress={() => setActiveVipId(pkg.id)}
                            activeOpacity={0.85}
                          >
                            <View style={{ flex: 1 }}>
                              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                <Text style={[styles.vipChoiceName, isSelected && { color: Colors.dark.primaryLight }]}>
                                  {pkg.name}
                                </Text>
                                <View style={styles.vipBadge}>
                                  <Text style={styles.vipBadgeText}>{pkg.badge}</Text>
                                </View>
                              </View>
                              <Text style={styles.vipChoiceDesc}>{pkg.desc}</Text>
                            </View>
                            <View style={{ alignItems: "flex-end" }}>
                              <Text style={[styles.vipChoicePrice, isSelected && { color: "#fff" }]}>
                                {pkg.priceVnd.toLocaleString()} ₫
                              </Text>
                              <Text style={styles.vipChoiceDuration}>/ {pkg.duration}</Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* 3. ORDER SUMMARY CARD */}
                <View style={styles.summaryCard}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Gói đã chọn:</Text>
                    <Text style={styles.summaryValBold}>{getSelectedTitle()}</Text>
                  </View>
                  {type === "COIN_TOPUP" && (
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Số xu nhận được:</Text>
                      <Text style={[styles.summaryValBold, { color: "#f59e0b" }]}>
                        🪙 +{getSelectedCoins().toLocaleString()} Waifu Coins
                      </Text>
                    </View>
                  )}
                  <View style={styles.divider} />
                  <View style={styles.summaryRow}>
                    <Text style={styles.totalPriceLabel}>Tổng tiền thanh toán:</Text>
                    <Text style={styles.totalPriceVal}>{getSelectedPrice().toLocaleString()} VNĐ</Text>
                  </View>
                </View>

                {/* 4. PAYMENT METHODS */}
                <Text style={styles.sectionTitle}>CHỌN HÌNH THỨC THANH TOÁN</Text>
                <View style={styles.methodsList}>
                  {PAYMENT_METHODS.map((method) => {
                    const isSelected = selectedMethod === method.id;
                    return (
                      <TouchableOpacity
                        key={method.id}
                        style={[styles.methodCard, isSelected && styles.methodCardActive]}
                        onPress={() => setSelectedMethod(method.id)}
                        activeOpacity={0.8}
                      >
                        <View style={[styles.methodIconBox, isSelected && styles.methodIconBoxActive]}>
                          <Ionicons
                            name={method.icon as any}
                            size={22}
                            color={isSelected ? Colors.dark.primaryLight : "#94a3b8"}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                            <Text style={[styles.methodName, isSelected && { color: "#fff" }]}>
                              {method.name}
                            </Text>
                            <View style={[styles.methodTag, isSelected && styles.methodTagActive]}>
                              <Text style={[styles.methodTagText, isSelected && { color: Colors.dark.primaryLight }]}>
                                {method.badge}
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.methodDesc}>{method.desc}</Text>
                        </View>
                        <Ionicons
                          name={isSelected ? "radio-button-on" : "radio-button-off"}
                          size={20}
                          color={isSelected ? Colors.dark.primaryLight : Colors.dark.textMuted}
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Security Note */}
                <View style={styles.securityBox}>
                  <Ionicons name="lock-closed" size={16} color="#10b981" />
                  <Text style={styles.securityText}>
                    Giao dịch mã hóa an toàn 256-bit chuẩn Napas 247. Tự động nhận diện và cộng xu ngay khi nhận được tiền.
                  </Text>
                </View>

                {/* Continue Button */}
                <TouchableOpacity
                  style={[styles.payBtn, loading && { opacity: 0.7 }]}
                  onPress={handleCreateOrder}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.payBtnText}>
                        Tạo Mã Thanh Toán & Quét QR ({getSelectedPrice().toLocaleString()} ₫)
                      </Text>
                      <Ionicons name="arrow-forward" size={18} color="#fff" />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* ──────── STEP 2: MÀN HÌNH QUÉT MÃ QR & CHUYỂN KHOẢN ──────── */}
            {step === "PAYMENT_QR" && currentOrder && (
              <View>
                {/* Countdown Timer Header */}
                <View style={styles.timerBar}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Ionicons name="time-outline" size={16} color="#f59e0b" />
                    <Text style={styles.timerLabel}>Thời hạn thanh toán còn lại:</Text>
                  </View>
                  <Text style={styles.timerCount}>{formatTimer(timeLeft)}</Text>
                </View>

                {/* QR Code Container */}
                <View style={styles.qrCard}>
                  <View style={styles.qrHeader}>
                    <Text style={styles.qrTitle}>Mã QR Chuyển Khoản Tự Động</Text>
                    <Text style={styles.qrSubtitle}>Quét bằng ứng dụng Ngân hàng (MB, VCB, MoMo, Techcombank...)</Text>
                  </View>

                  <View style={styles.qrImageBox}>
                    <Image source={{ uri: currentOrder.qrUrl }} style={styles.qrImage} resizeMode="contain" />
                    <View style={styles.qrAmountBadge}>
                      <Text style={styles.qrAmountBadgeText}>
                        {currentOrder.amount.toLocaleString()} VNĐ
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Transfer Info Details with 1-Tap Copy */}
                <View style={styles.detailsBox}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailKey}>Ngân hàng thụ hưởng:</Text>
                    <Text style={styles.detailValBold}>{currentOrder.bankInfo.bankName}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <View>
                      <Text style={styles.detailKey}>Số tài khoản:</Text>
                      <Text style={[styles.detailValBold, { color: Colors.dark.accent, fontSize: 16 }]}>
                        {currentOrder.bankInfo.accountNo}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.copyButton}
                      onPress={() => handleCopy(currentOrder.bankInfo.accountNo, "Số tài khoản")}
                    >
                      <Ionicons
                        name={copiedKey === "Số tài khoản" ? "checkmark" : "copy-outline"}
                        size={14}
                        color="#fff"
                      />
                      <Text style={styles.copyButtonText}>
                        {copiedKey === "Số tài khoản" ? "Đã chép" : "Sao chép"}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailKey}>Chủ tài khoản:</Text>
                    <Text style={styles.detailValBold}>{currentOrder.bankInfo.accountName}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <View>
                      <Text style={styles.detailKey}>Số tiền chính xác:</Text>
                      <Text style={[styles.detailValBold, { color: "#10b981", fontSize: 16 }]}>
                        {currentOrder.amount.toLocaleString()} VNĐ
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.copyButton}
                      onPress={() => handleCopy(String(currentOrder.amount), "Số tiền")}
                    >
                      <Ionicons
                        name={copiedKey === "Số tiền" ? "checkmark" : "copy-outline"}
                        size={14}
                        color="#fff"
                      />
                      <Text style={styles.copyButtonText}>
                        {copiedKey === "Số tiền" ? "Đã chép" : "Sao chép"}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={styles.detailKey}>Nội dung chuyển khoản (bắt buộc):</Text>
                      <Text style={[styles.detailValBold, { color: "#f59e0b", fontSize: 15 }]} numberOfLines={1}>
                        {currentOrder.orderCode}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.copyButton, { backgroundColor: "#f59e0b" }]}
                      onPress={() => handleCopy(currentOrder.orderCode, "Nội dung")}
                    >
                      <Ionicons
                        name={copiedKey === "Nội dung" ? "checkmark" : "copy-outline"}
                        size={14}
                        color="#fff"
                      />
                      <Text style={styles.copyButtonText}>
                        {copiedKey === "Nội dung" ? "Đã chép" : "Sao chép"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Important Notice */}
                <View style={styles.warningBox}>
                  <Ionicons name="information-circle" size={16} color="#fbbf24" />
                  <Text style={styles.warningText}>
                    Vui lòng giữ nguyên nội dung chuyển khoản "{currentOrder.orderCode}" để hệ thống tự động nhận diện và cộng xu ngay lập tức!
                  </Text>
                </View>

                {/* ─── PHẦN GỬI ẢNH BIÊN LAI ĐỂ ADMIN DUYỆT XU & VIP ─── */}
                <View style={styles.proofSection}>
                  <View style={styles.proofHeaderRow}>
                    <Ionicons name="camera" size={18} color="#ec4899" />
                    <Text style={styles.proofSectionTitle}>
                      GỬI ẢNH BIÊN LAI ĐỂ ADMIN DUYỆT ({type === "COIN_TOPUP" ? "XU" : "VIP"}) 📸
                    </Text>
                  </View>
                  <Text style={styles.proofSectionSub}>
                    Chuyển khoản xong? Bạn có thể gửi ảnh chụp màn hình biên lai để Admin duyệt và kích hoạt {type === "COIN_TOPUP" ? "xu" : "VIP"} cho bạn ngay.
                  </Text>

                  {/* 1. Chọn nhanh ảnh mẫu thực tế */}
                  <Text style={styles.proofSubLabel}>1. Chọn nhanh mẫu ngân hàng (MB, VCB, MoMo, Tech):</Text>
                  <View style={styles.presetProofRow}>
                    {BANK_PROOF_PRESETS.map((preset) => {
                      const isChosen = proofImageUrl === preset.thumb;
                      return (
                        <TouchableOpacity
                          key={preset.id}
                          style={[styles.presetCard, isChosen && styles.presetCardActive]}
                          onPress={() => setProofImageUrl(preset.thumb)}
                          activeOpacity={0.8}
                        >
                          <Image source={{ uri: preset.thumb }} style={styles.presetImg} />
                          <Text style={[styles.presetName, isChosen && { color: "#ec4899", fontWeight: "700" }]}>
                            {preset.bankName}
                          </Text>
                          {isChosen && (
                            <View style={styles.presetCheck}>
                              <Ionicons name="checkmark-circle" size={14} color="#ec4899" />
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* 2. Dán link ảnh chụp màn hình */}
                  <Text style={styles.proofSubLabel}>2. Hoặc dán đường dẫn (URL) ảnh biên lai của bạn:</Text>
                  <TextInput
                    style={styles.proofInput}
                    placeholder="https://i.imgur.com/... hoặc link ảnh biên lai..."
                    placeholderTextColor={Colors.dark.textMuted}
                    value={proofImageUrl}
                    onChangeText={setProofImageUrl}
                    autoCapitalize="none"
                  />

                  {/* 3. Lời nhắn / ghi chú */}
                  <Text style={styles.proofSubLabel}>3. Ghi chú chuyển khoản (tùy chọn):</Text>
                  <TextInput
                    style={[styles.proofInput, { height: 42 }]}
                    placeholder="VD: Em đã chuyển 50k từ app ngân hàng lúc 20:30..."
                    placeholderTextColor={Colors.dark.textMuted}
                    value={userNote}
                    onChangeText={setUserNote}
                  />

                  {/* Xem trước ảnh nếu có */}
                  {!!proofImageUrl && (
                    <View style={styles.proofPreviewBox}>
                      <Text style={styles.proofPreviewLabel}>Ảnh biên lai đính kèm:</Text>
                      <Image source={{ uri: proofImageUrl }} style={styles.proofPreviewImg} resizeMode="cover" />
                    </View>
                  )}

                  {/* Nút gửi biên lai cho Admin */}
                  <TouchableOpacity
                    style={[styles.submitProofBtn, submittingProof && { opacity: 0.7 }]}
                    onPress={handleSubmitProof}
                    disabled={submittingProof}
                  >
                    {submittingProof ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="cloud-upload" size={18} color="#fff" />
                        <Text style={styles.submitProofBtnText}>
                          Gửi Ảnh Biên Lai Chờ Admin Duyệt {type === "COIN_TOPUP" ? "Xu" : "VIP"} 📤
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Hoặc Tự động xác nhận ngay */}
                <View style={{ marginTop: 14 }}>
                  <TouchableOpacity
                    style={[styles.confirmBtn, loading && { opacity: 0.7 }]}
                    onPress={handleConfirmOrder}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="flash" size={18} color="#10b981" />
                        <Text style={styles.confirmBtnText}>Đã Chuyển Tiền • Kiểm Tra Tự Động Ngay</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelOrder}>
                    <Text style={styles.cancelBtnText}>Hủy giao dịch này</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ──────── STEP 2.5: ĐANG CHỜ ADMIN DUYỆT BIÊN LAI ──────── */}
            {step === "WAITING_APPROVAL" && currentOrder && (
              <View style={styles.waitingBox}>
                <View style={styles.waitingIconCircle}>
                  <Ionicons name="time" size={60} color="#f59e0b" />
                </View>
                <Text style={styles.waitingTitle}>Đã Gửi Biên Lai • Chờ Admin Duyệt! ⏳</Text>
                <Text style={styles.waitingSub}>
                  {type === "COIN_TOPUP"
                    ? `Yêu cầu nạp ${currentOrder.coins || 0} Xu Waifu đã được chuyển tới Admin để đối soát.`
                    : `Yêu cầu kích hoạt Gói Hội Viên ${currentOrder.packageName} đã được gửi tới Admin.`}
                </Text>

                <View style={styles.receiptCard}>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Mã đơn hàng:</Text>
                    <Text style={[styles.receiptVal, { color: "#f59e0b", fontWeight: "700" }]}>{currentOrder.orderCode}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Mục thanh toán:</Text>
                    <Text style={styles.receiptVal}>{currentOrder.packageName}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Số tiền:</Text>
                    <Text style={[styles.receiptVal, { color: "#10b981", fontWeight: "700" }]}>
                      {currentOrder.amount.toLocaleString()} VNĐ
                    </Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Trạng thái đơn:</Text>
                    <View style={styles.waitingBadge}>
                      <Text style={styles.waitingBadgeText}>⏳ ĐANG CHỜ DUYỆT</Text>
                    </View>
                  </View>
                  {!!currentOrder.userNote && (
                    <View style={[styles.receiptRow, { flexDirection: "column", alignItems: "flex-start", gap: 4 }]}>
                      <Text style={styles.receiptLabel}>Lời nhắn của bạn:</Text>
                      <Text style={[styles.receiptVal, { color: "#cbd5e1" }]}>{currentOrder.userNote}</Text>
                    </View>
                  )}
                  {!!currentOrder.proofImageUrl && (
                    <View style={{ marginTop: 10 }}>
                      <Text style={styles.receiptLabel}>Ảnh biên lai đã đính kèm:</Text>
                      <Image
                        source={{ uri: currentOrder.proofImageUrl }}
                        style={styles.proofSubmittedImg}
                        resizeMode="cover"
                      />
                    </View>
                  )}
                </View>

                <View style={styles.waitingNotice}>
                  <Ionicons name="information-circle-outline" size={18} color="#f59e0b" />
                  <Text style={styles.waitingNoticeText}>
                    Admin sẽ kiểm tra giao dịch và phê duyệt trong 1 - 5 phút. Khi duyệt xong, hệ thống sẽ tự động cộng xu / kích hoạt VIP cho bạn.
                  </Text>
                </View>

                <TouchableOpacity style={styles.finishBtn} onPress={onClose}>
                  <Text style={styles.finishBtnText}>Tôi Đã Hiểu • Đóng Cửa Sổ</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ──────── STEP 3: BIÊN LAI THANH TOÁN THÀNH CÔNG ──────── */}
            {step === "SUCCESS" && currentOrder && (
              <View style={styles.successBox}>
                <View style={styles.successIconCircle}>
                  <Ionicons name="checkmark-circle" size={64} color="#10b981" />
                </View>
                <Text style={styles.successTitle}>Giao Dịch Thành Công! ✨</Text>
                <Text style={styles.successSub}>
                  {type === "COIN_TOPUP"
                    ? `Đã nạp thành công ${currentOrder.coins || 0} Waifu Coins vào tài khoản của bạn!`
                    : "Đặc quyền Waifu VIP Pass đã được kích hoạt thành công!"}
                </Text>

                <View style={styles.receiptCard}>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Mã đơn hàng:</Text>
                    <Text style={styles.receiptVal}>{currentOrder.orderCode}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Gói dịch vụ:</Text>
                    <Text style={styles.receiptVal}>{currentOrder.packageName}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Số tiền đã trả:</Text>
                    <Text style={[styles.receiptVal, { color: "#10b981", fontWeight: "700" }]}>
                      {currentOrder.amount.toLocaleString()} VNĐ
                    </Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Phương thức:</Text>
                    <Text style={styles.receiptVal}>{currentOrder.method}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Thời gian:</Text>
                    <Text style={styles.receiptVal}>{new Date().toLocaleTimeString("vi-VN")}</Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.finishBtn} onPress={onClose}>
                  <Text style={styles.finishBtnText}>Hoàn Tất & Tiếp Tục Thưởng Thức</Text>
                  <Ionicons name="sparkles" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: Colors.dark.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "92%",
    paddingBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },
  headerBadgeText: {
    color: "#10b981",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 14,
  },

  // Coin Grid & Denominations Styles
  sectionTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    color: Colors.dark.textMuted,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 8,
  },
  sectionSubtitle: {
    color: "#f59e0b",
    fontSize: 11,
    fontWeight: "700",
  },
  coinGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 12,
  },
  coinGridCard: {
    width: "48%",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    position: "relative",
  },
  coinGridCardActive: {
    borderColor: "#f59e0b",
    backgroundColor: "rgba(245, 158, 11, 0.1)",
  },
  coinBonusBadge: {
    position: "absolute",
    top: -8,
    right: 8,
    backgroundColor: "#ec4899",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  coinBonusText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "800",
  },
  coinRowCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  coinEmoji: {
    fontSize: 18,
  },
  coinNumberText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
  },
  coinPriceText: {
    color: Colors.dark.textMuted,
    fontSize: 13,
    fontWeight: "600",
  },
  selectedCheckBadge: {
    position: "absolute",
    bottom: 6,
    right: 6,
  },

  // Custom Input Box
  customToggleBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginBottom: 8,
  },
  customToggleBoxActive: {
    borderColor: Colors.dark.primaryLight,
    backgroundColor: "rgba(236, 72, 153, 0.08)",
  },
  customToggleText: {
    color: Colors.dark.textMuted,
    fontSize: 12,
    flex: 1,
  },
  customInputContainer: {
    marginBottom: 14,
  },
  customInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  customInput: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: "#fff",
    fontSize: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  customCalcBox: {
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.25)",
  },
  customCalcText: {
    color: "#fff",
    fontSize: 12,
  },
  customHintText: {
    color: Colors.dark.textMuted,
    fontSize: 11,
    marginTop: 4,
    paddingHorizontal: 2,
  },

  // VIP Choice Styles
  vipChoiceCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.08)",
  },
  vipChoiceCardActive: {
    borderColor: Colors.dark.primaryLight,
    backgroundColor: "rgba(236, 72, 153, 0.1)",
  },
  vipChoiceName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  vipBadge: {
    backgroundColor: "rgba(236, 72, 153, 0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  vipBadgeText: {
    color: Colors.dark.primaryLight,
    fontSize: 9,
    fontWeight: "800",
  },
  vipChoiceDesc: {
    color: Colors.dark.textMuted,
    fontSize: 11,
    marginTop: 3,
  },
  vipChoicePrice: {
    color: Colors.dark.primaryLight,
    fontSize: 16,
    fontWeight: "900",
  },
  vipChoiceDuration: {
    color: Colors.dark.textMuted,
    fontSize: 10,
  },

  // Summary Card Styles
  summaryCard: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 4,
  },
  summaryLabel: {
    color: Colors.dark.textMuted,
    fontSize: 13,
  },
  summaryValBold: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginVertical: 10,
  },
  totalPriceLabel: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  totalPriceVal: {
    color: Colors.dark.primaryLight,
    fontSize: 18,
    fontWeight: "900",
  },

  // Payment Methods List Styles
  methodsList: {
    gap: 10,
    marginBottom: 16,
  },
  methodCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    gap: 12,
  },
  methodCardActive: {
    borderColor: Colors.dark.primaryLight,
    backgroundColor: "rgba(236, 72, 153, 0.08)",
  },
  methodIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    justifyContent: "center",
    alignItems: "center",
  },
  methodIconBoxActive: {
    backgroundColor: "rgba(236, 72, 153, 0.15)",
  },
  methodName: {
    color: Colors.dark.textMuted,
    fontSize: 14,
    fontWeight: "600",
  },
  methodTag: {
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  methodTagActive: {
    backgroundColor: "rgba(236, 72, 153, 0.15)",
  },
  methodTagText: {
    color: Colors.dark.textMuted,
    fontSize: 9,
    fontWeight: "700",
  },
  methodDesc: {
    color: Colors.dark.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  securityBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(16, 185, 129, 0.08)",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
    marginBottom: 20,
  },
  securityText: {
    color: "#10b981",
    fontSize: 11,
    flex: 1,
    lineHeight: 16,
  },
  payBtn: {
    backgroundColor: Colors.dark.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    shadowColor: Colors.dark.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 4,
  },
  payBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },

  // QR Step Styles
  timerBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
    marginBottom: 14,
  },
  timerLabel: {
    color: "#f59e0b",
    fontSize: 12,
    fontWeight: "600",
  },
  timerCount: {
    color: "#f59e0b",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 1,
  },
  qrCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  qrHeader: {
    alignItems: "center",
    marginBottom: 12,
  },
  qrTitle: {
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "800",
  },
  qrSubtitle: {
    color: "#64748b",
    fontSize: 11,
    textAlign: "center",
    marginTop: 2,
  },
  qrImageBox: {
    width: 240,
    height: 240,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  qrImage: {
    width: 230,
    height: 230,
  },
  qrAmountBadge: {
    position: "absolute",
    bottom: -6,
    backgroundColor: "#0f172a",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  qrAmountBadgeText: {
    color: "#10b981",
    fontSize: 13,
    fontWeight: "800",
  },
  detailsBox: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginBottom: 14,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  detailKey: {
    color: Colors.dark.textMuted,
    fontSize: 12,
  },
  detailValBold: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 2,
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  copyButtonText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  warningBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(251, 191, 36, 0.08)",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(251, 191, 36, 0.25)",
    marginBottom: 16,
  },
  warningText: {
    color: "#fbbf24",
    fontSize: 11,
    flex: 1,
    lineHeight: 16,
  },
  confirmBtn: {
    backgroundColor: "#10b981",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  confirmBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
  cancelBtn: {
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 6,
  },
  cancelBtnText: {
    color: Colors.dark.textMuted,
    fontSize: 13,
    fontWeight: "600",
  },

  // Success Step Styles
  successBox: {
    alignItems: "center",
    paddingVertical: 20,
  },
  successIconCircle: {
    marginBottom: 12,
  },
  successTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 6,
  },
  successSub: {
    color: Colors.dark.textMuted,
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: 16,
    marginBottom: 20,
    lineHeight: 18,
  },
  receiptCard: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginBottom: 24,
    gap: 10,
  },
  receiptRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  receiptLabel: {
    color: Colors.dark.textMuted,
    fontSize: 12,
  },
  receiptVal: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  finishBtn: {
    width: "100%",
    backgroundColor: Colors.dark.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  finishBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },

  // Proof Upload Section Styles
  proofSection: {
    marginTop: 18,
    backgroundColor: "rgba(236, 72, 153, 0.08)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(236, 72, 153, 0.25)",
  },
  proofHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  proofSectionTitle: {
    color: "#ec4899",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  proofSectionSub: {
    color: Colors.dark.textMuted,
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 12,
  },
  proofSubLabel: {
    color: "#e2e8f0",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 8,
    marginBottom: 6,
  },
  presetProofRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  presetCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 10,
    padding: 6,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    position: "relative",
  },
  presetCardActive: {
    borderColor: "#ec4899",
    backgroundColor: "rgba(236, 72, 153, 0.15)",
  },
  presetImg: {
    width: "100%",
    height: 38,
    borderRadius: 6,
    marginBottom: 4,
  },
  presetName: {
    color: Colors.dark.textMuted,
    fontSize: 10,
    fontWeight: "600",
  },
  presetCheck: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#000",
    borderRadius: 10,
  },
  proofInput: {
    backgroundColor: "rgba(0,0,0,0.3)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: "#fff",
    fontSize: 12,
  },
  proofPreviewBox: {
    marginTop: 10,
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  proofPreviewLabel: {
    color: Colors.dark.textMuted,
    fontSize: 11,
    marginBottom: 6,
  },
  proofPreviewImg: {
    width: "100%",
    height: 120,
    borderRadius: 8,
  },
  submitProofBtn: {
    marginTop: 14,
    backgroundColor: "#ec4899",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#ec4899",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  submitProofBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },

  // Waiting Approval Step Styles
  waitingBox: {
    alignItems: "center",
    paddingVertical: 20,
  },
  waitingIconCircle: {
    marginBottom: 12,
  },
  waitingTitle: {
    color: "#f59e0b",
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 6,
    textAlign: "center",
  },
  waitingSub: {
    color: Colors.dark.textMuted,
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: 16,
    marginBottom: 20,
    lineHeight: 18,
  },
  waitingBadge: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
  },
  waitingBadgeText: {
    color: "#f59e0b",
    fontSize: 11,
    fontWeight: "800",
  },
  proofSubmittedImg: {
    width: "100%",
    height: 150,
    borderRadius: 10,
    marginTop: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  waitingNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(245, 158, 11, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.2)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    gap: 8,
  },
  waitingNoticeText: {
    flex: 1,
    color: "#fbbf24",
    fontSize: 12,
    lineHeight: 17,
  },
});
