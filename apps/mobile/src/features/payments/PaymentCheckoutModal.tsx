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
import { GoldCoin } from "../../components/ui/GoldCoin";
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

  // Transfer Proof States (Gửi ảnh biên lai chuyển khoản từ máy để admin duyệt)
  const [proofImageUrl, setProofImageUrl] = useState<string>("");
  const [proofFileName, setProofFileName] = useState<string>("");
  const [userNote, setUserNote] = useState<string>("");
  const [submittingProof, setSubmittingProof] = useState<boolean>(false);
  const [checkingStatus, setCheckingStatus] = useState<boolean>(false);
  const [rejectionReason, setRejectionReason] = useState<string>("");

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
      setProofFileName("");
      setUserNote("");
      setSubmittingProof(false);
      setCheckingStatus(false);
      setRejectionReason("");
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [visible, selectedCoinPackage, customAmount, selectedVipPackageId]);

  // Polling tự động kiểm tra trạng thái duyệt đơn từ Admin mỗi 3 giây
  const checkOrderApprovalStatus = async (silent = false) => {
    if (!currentOrder) return;
    if (!silent) setCheckingStatus(true);
    try {
      const res = await api.get(ENDPOINTS.orderDetail(currentOrder.id));
      const fetchedOrder: PaymentOrder | undefined = res.data?.data?.order || res.data?.order;
      if (fetchedOrder) {
        if (fetchedOrder.status === "SUCCESS") {
          setCurrentOrder(fetchedOrder);
          setStep("SUCCESS");
          if (type === "BUY_VIP" && user) {
            setUser({ ...user, isPremium: true });
          }
          showSuccess(
            "Admin đã duyệt đơn! 🎉",
            type === "COIN_TOPUP"
              ? `Admin đã phê duyệt nạp +${fetchedOrder.coins || 0} Xu Waifu!`
              : "Admin đã phê duyệt kích hoạt gói Hội Viên VIP Pass!"
          );
          onPaymentSuccess?.(fetchedOrder, res.data?.data?.balance ?? res.data?.balance);
        } else if (fetchedOrder.status === "REJECTED" || (fetchedOrder as any).status === "FAILED") {
          setCurrentOrder(fetchedOrder);
          const reason = fetchedOrder.adminNote || "Biên lai thanh toán không hợp lệ hoặc chưa nhận được tiền.";
          setRejectionReason(reason);
          showError("Đơn bị từ chối ❌", reason);
        } else if (!silent) {
          showInfo("Đang chờ Admin duyệt ⏳", "Đơn hàng vẫn đang trong hàng đợi phê duyệt. Vui lòng chờ 1 - 2 phút!");
        }
      }
    } catch (err: any) {
      if (!silent) {
        showError("Lỗi kiểm tra", err.response?.data?.error || "Không thể kiểm tra trạng thái đơn lúc này.");
      }
    } finally {
      if (!silent) setCheckingStatus(false);
    }
  };

  useEffect(() => {
    let interval: any = null;
    if (
      step === "WAITING_APPROVAL" &&
      currentOrder &&
      currentOrder.status !== "SUCCESS" &&
      currentOrder.status !== "REJECTED"
    ) {
      // Auto-poll every 3 seconds
      interval = setInterval(() => {
        checkOrderApprovalStatus(true);
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, currentOrder?.id, currentOrder?.status]);

  // Hàm chọn ảnh biên lai từ máy tính / điện thoại
  const handlePickProofFromFile = () => {
    if (typeof document !== "undefined") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = (e: any) => {
        const file = e.target?.files?.[0];
        if (file) {
          if (file.size > 10 * 1024 * 1024) {
            showError("Ảnh quá lớn", "Vui lòng chọn ảnh biên lai dưới 10MB");
            return;
          }
          setProofFileName(file.name);
          const reader = new FileReader();
          reader.onload = (event) => {
            const result = event.target?.result as string;
            if (result) {
              setProofImageUrl(result);
              showSuccess("Đã tải ảnh biên lai!", `Đã chọn ảnh: ${file.name}`);
            }
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else {
      showInfo("Thông báo", "Vui lòng dán liên kết ảnh biên lai vào ô bên dưới.");
    }
  };

  const handleRemoveProofImage = () => {
    setProofImageUrl("");
    setProofFileName("");
  };

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

  // Step 1.5: Gửi ảnh biên lai chuyển khoản từ máy để Admin duyệt (Xu hoặc VIP)
  const handleSubmitProof = async () => {
    if (!currentOrder) return;
    const finalProofUrl = proofImageUrl.trim();
    if (!finalProofUrl) {
      showError(
        "Chưa có ảnh biên lai! 📸",
        "Vui lòng nhấn 'Chọn Ảnh Biên Lai Từ Máy' để tải ảnh chụp màn hình chuyển khoản của bạn trước khi gửi."
      );
      return;
    }

    setSubmittingProof(true);
    try {
      const noteContent = userNote.trim() || `Đã chuyển khoản đơn hàng ${currentOrder.orderCode}`;
      const res = await api.post(ENDPOINTS.submitOrderProof(currentOrder.id), {
        proofImageUrl: finalProofUrl,
        note: noteContent,
        userNote: noteContent,
      });
      if (res.data?.success) {
        const updatedOrder = res.data.data?.order || {
          ...currentOrder,
          status: "WAITING_APPROVAL",
          proofImageUrl: finalProofUrl,
          userNote: noteContent,
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
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                {type === "COIN_TOPUP" && step !== "SUCCESS" && step !== "PAYMENT_QR" && (
                  <GoldCoin size={22} />
                )}
                <Text style={styles.headerTitle}>
                  {step === "SUCCESS"
                    ? "Biên Lai Thanh Toán ✨"
                    : step === "WAITING_APPROVAL"
                    ? "Chờ Admin Duyệt Biên Lai ⏳"
                    : step === "PAYMENT_QR"
                    ? "Quét Mã Thanh Toán VietQR"
                    : type === "COIN_TOPUP"
                    ? "Nạp Xu & Mệnh Giá Thanh Toán"
                    : "Nâng Cấp Waifu VIP Pass 💎"}
                </Text>
              </View>
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
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <GoldCoin size={18} />
                        <Text style={styles.sectionTitle}>CHỌN SỐ XU & MỆNH GIÁ NẠP</Text>
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <Text style={styles.sectionSubtitle}>10.000 ₫ = 50</Text>
                        <GoldCoin size={13} />
                      </View>
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
                              <GoldCoin size={22} />
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
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                              <Text style={styles.customCalcText}>Nhận:</Text>
                              <GoldCoin size={15} />
                              <Text style={{ color: "#f59e0b", fontWeight: "800" }}>{getSelectedCoins()} Xu</Text>
                            </View>
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
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <GoldCoin size={18} />
                        <Text style={[styles.summaryValBold, { color: "#f59e0b" }]}>
                          +{getSelectedCoins().toLocaleString()} Waifu Coins
                        </Text>
                      </View>
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

                {/* ─── PHẦN GỬI ẢNH BIÊN LAI TỪ MÁY ĐỂ ADMIN DUYỆT XU & VIP ─── */}
                <View style={styles.proofSection}>
                  <View style={styles.proofHeaderRow}>
                    <Ionicons name="camera" size={20} color="#ec4899" />
                    <Text style={styles.proofSectionTitle}>
                      TẢI ẢNH BIÊN LAI TỪ MÁY ĐỂ ADMIN DUYỆT ({type === "COIN_TOPUP" ? "XU" : "VIP"}) 📸
                    </Text>
                  </View>
                  <Text style={styles.proofSectionSub}>
                    Sau khi quét QR chuyển khoản, hãy chọn ảnh chụp màn hình biên lai từ thiết bị của bạn và ấn gửi. Hệ thống sẽ chờ Admin duyệt mới xác nhận thanh toán thành công!
                  </Text>

                  {/* 1. KHỐI CHỌN ẢNH TỪ MÁY TÍNH / ĐIỆN THOẠI (ƯU TIÊN HÀNG ĐẦU) */}
                  {!proofImageUrl ? (
                    <TouchableOpacity
                      style={styles.pickFileBox}
                      onPress={handlePickProofFromFile}
                      activeOpacity={0.8}
                    >
                      <View style={styles.pickFileIconCircle}>
                        <Ionicons name="cloud-upload" size={32} color="#ec4899" />
                      </View>
                      <Text style={styles.pickFileTitle}>Chọn Ảnh Biên Lai Từ Thiết Bị Của Bạn</Text>
                      <Text style={styles.pickFileSub}>
                        Hỗ trợ ảnh chụp màn hình từ máy tính hoặc điện thoại (PNG, JPG, WebP)
                      </Text>
                      <View style={styles.pickFileBadge}>
                        <Ionicons name="folder-open" size={15} color="#fff" />
                        <Text style={styles.pickFileBadgeText}>TẢI ẢNH TỪ MÁY NGAY</Text>
                      </View>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.pickedFileCard}>
                      <View style={styles.pickedFileHeader}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flex: 1 }}>
                          <Ionicons name="checkmark-circle" size={18} color="#10b981" />
                          <Text style={styles.pickedFileName} numberOfLines={1}>
                            {proofFileName || "Ảnh biên lai chuyển khoản từ máy"}
                          </Text>
                        </View>
                        <View style={styles.pickedActionsRow}>
                          <TouchableOpacity style={styles.changeFileBtn} onPress={handlePickProofFromFile}>
                            <Ionicons name="swap-horizontal" size={13} color="#fff" />
                            <Text style={styles.changeFileBtnText}>Đổi ảnh khác</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.removeFileBtn} onPress={handleRemoveProofImage}>
                            <Ionicons name="trash-outline" size={14} color="#ef4444" />
                          </TouchableOpacity>
                        </View>
                      </View>
                      <View style={styles.pickedImgBox}>
                        <Image source={{ uri: proofImageUrl }} style={styles.pickedPreviewImg} resizeMode="contain" />
                      </View>
                    </View>
                  )}

                  {/* 2. CHỌN NHANH ẢNH MẪU NGÂN HÀNG (TÙY CHỌN DỰ PHÒNG) */}
                  <View style={{ marginTop: 12 }}>
                    <Text style={styles.proofSubLabel}>Hoặc chọn nhanh ảnh mẫu biên lai ngân hàng:</Text>
                    <View style={styles.presetProofRow}>
                      {BANK_PROOF_PRESETS.map((preset) => {
                        const isChosen = proofImageUrl === preset.thumb;
                        return (
                          <TouchableOpacity
                            key={preset.id}
                            style={[styles.presetCard, isChosen && styles.presetCardActive]}
                            onPress={() => {
                              setProofImageUrl(preset.thumb);
                              setProofFileName(preset.label);
                            }}
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
                  </View>

                  {/* 3. LỜI NHẮN / GHI CHÚ CHUYỂN KHOẢN */}
                  <Text style={styles.proofSubLabel}>Ghi chú chuyển khoản cho Admin (tùy chọn):</Text>
                  <TextInput
                    style={[styles.proofInput, { height: 42 }]}
                    placeholder="VD: Em đã chuyển 50.000đ từ app MBBank lúc 20:30..."
                    placeholderTextColor={Colors.dark.textMuted}
                    value={userNote}
                    onChangeText={setUserNote}
                  />

                  {/* NÚT GỬI BIÊN LAI CHỜ ADMIN DUYỆT */}
                  <TouchableOpacity
                    style={[
                      styles.submitProofBtn,
                      (!proofImageUrl || submittingProof) && { opacity: 0.65 },
                    ]}
                    onPress={handleSubmitProof}
                    disabled={submittingProof}
                  >
                    {submittingProof ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="send" size={18} color="#fff" />
                        <Text style={styles.submitProofBtnText}>
                          Gửi Biên Lai Chờ Admin Duyệt {type === "COIN_TOPUP" ? "Xu" : "VIP"} 📤
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>

                  {!proofImageUrl && (
                    <Text style={styles.proofRequireNotice}>
                      * Bạn cần tải ảnh biên lai từ máy trước khi ấn nút gửi chờ admin duyệt.
                    </Text>
                  )}
                </View>

                {/* Nút hủy giao dịch */}
                <View style={{ marginTop: 14 }}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelOrder}>
                    <Text style={styles.cancelBtnText}>Hủy giao dịch này</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ──────── STEP 2.5: ĐANG CHỜ ADMIN DUYỆT BIÊN LAI (POLLING TỰ ĐỘNG) ──────── */}
            {step === "WAITING_APPROVAL" && currentOrder && (
              <View style={styles.waitingBox}>
                {/* Header Icon với hiệu ứng radar / hourglass */}
                <View style={styles.waitingIconCircle}>
                  <Ionicons name="hourglass" size={44} color="#f59e0b" />
                  <ActivityIndicator
                    size="large"
                    color="#f59e0b"
                    style={{ position: "absolute", transform: [{ scale: 1.5 }] }}
                  />
                </View>

                <Text style={styles.waitingTitle}>Đã Gửi Biên Lai • Đang Chờ Admin Duyệt! ⏳</Text>
                <Text style={styles.waitingSub}>
                  {type === "COIN_TOPUP"
                    ? `Yêu cầu nạp ${currentOrder.coins || 0} Xu Waifu đã được chuyển tới Admin để kiểm tra và duyệt.`
                    : `Yêu cầu kích hoạt Gói Hội Viên ${currentOrder.packageName} đã được chuyển tới Admin.`}
                </Text>

                {/* Thông báo nếu Admin từ chối */}
                {!!rejectionReason && (
                  <View style={styles.rejectedBanner}>
                    <Ionicons name="alert-circle" size={22} color="#ef4444" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rejectedBannerTitle}>Đơn Hàng Bị Từ Chối Duyệt:</Text>
                      <Text style={styles.rejectedBannerText}>{rejectionReason}</Text>
                    </View>
                  </View>
                )}

                {/* Chi tiết đơn hàng */}
                <View style={styles.receiptCard}>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Mã đơn hàng:</Text>
                    <Text style={[styles.receiptVal, { color: "#f59e0b", fontWeight: "800" }]}>
                      {currentOrder.orderCode}
                    </Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Mục thanh toán:</Text>
                    <Text style={styles.receiptVal}>{currentOrder.packageName}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Số tiền đã chuyển:</Text>
                    <Text style={[styles.receiptVal, { color: "#10b981", fontWeight: "800" }]}>
                      {currentOrder.amount.toLocaleString()} VNĐ
                    </Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Trạng thái đơn:</Text>
                    <View style={styles.waitingBadge}>
                      <ActivityIndicator size="small" color="#f59e0b" style={{ marginRight: 4 }} />
                      <Text style={styles.waitingBadgeText}>⏳ ĐANG CHỜ ADMIN DUYỆT</Text>
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
                      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                        <Text style={styles.receiptLabel}>Ảnh biên lai bạn đã tải lên từ máy:</Text>
                        <View style={styles.attachedProofBadge}>
                          <Ionicons name="checkmark-done" size={12} color="#10b981" />
                          <Text style={styles.attachedProofBadgeText}>Đã đính kèm</Text>
                        </View>
                      </View>
                      <Image
                        source={{ uri: currentOrder.proofImageUrl }}
                        style={styles.proofSubmittedImg}
                        resizeMode="cover"
                      />
                    </View>
                  )}
                </View>

                {/* Notice thông báo auto-sync mỗi 3 giây */}
                <View style={styles.waitingNotice}>
                  <Ionicons name="sync" size={18} color="#f59e0b" />
                  <Text style={styles.waitingNoticeText}>
                    Hệ thống đang tự động kiểm tra mỗi 3 giây. Ngay khi Admin bấm Duyệt trong Admin Portal, đơn hàng sẽ tự động hoàn tất và {type === "COIN_TOPUP" ? "cộng xu" : "kích hoạt VIP"} cho bạn tức thì!
                  </Text>
                </View>

                {/* Nút thủ công: Kiểm tra trạng thái duyệt ngay */}
                <TouchableOpacity
                  style={[styles.checkStatusBtn, checkingStatus && { opacity: 0.7 }]}
                  onPress={() => checkOrderApprovalStatus(false)}
                  disabled={checkingStatus}
                >
                  {checkingStatus ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="refresh" size={18} color="#fff" />
                      <Text style={styles.checkStatusBtnText}>Kiểm Tra Trạng Thái Duyệt Ngay 🔄</Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* Nếu bị từ chối: Nút tải lại biên lai */}
                {!!rejectionReason && (
                  <TouchableOpacity
                    style={styles.reUploadBtn}
                    onPress={() => setStep("PAYMENT_QR")}
                  >
                    <Ionicons name="cloud-upload" size={16} color="#ec4899" />
                    <Text style={styles.reUploadBtnText}>Tải Lại Biên Lai Mới Khác</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.finishBtnSecondary} onPress={onClose}>
                  <Text style={styles.finishBtnSecondaryText}>Tôi Đã Hiểu • Đóng Cửa Sổ</Text>
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

  // Pick file from device box
  pickFileBox: {
    backgroundColor: "rgba(236, 72, 153, 0.1)",
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#ec4899",
    borderRadius: 14,
    padding: 18,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 6,
  },
  pickFileIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(236, 72, 153, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  pickFileTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
  },
  pickFileSub: {
    color: Colors.dark.textMuted,
    fontSize: 11,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 10,
    paddingHorizontal: 8,
  },
  pickFileBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#ec4899",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  pickFileBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  // Picked file card & preview
  pickedFileCard: {
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#ec4899",
    padding: 12,
    marginVertical: 6,
  },
  pickedFileHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  pickedFileName: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    flex: 1,
  },
  pickedActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  changeFileBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(236, 72, 153, 0.3)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(236, 72, 153, 0.5)",
  },
  changeFileBtnText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  removeFileBtn: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    padding: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.4)",
  },
  pickedImgBox: {
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 10,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  pickedPreviewImg: {
    width: "100%",
    height: 180,
  },
  proofRequireNotice: {
    color: "#f43f5e",
    fontSize: 11,
    textAlign: "center",
    marginTop: 6,
    fontWeight: "600",
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
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    position: "relative",
  },
  waitingTitle: {
    color: "#f59e0b",
    fontSize: 19,
    fontWeight: "900",
    marginBottom: 6,
    textAlign: "center",
  },
  waitingSub: {
    color: Colors.dark.textMuted,
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: 16,
    marginBottom: 16,
    lineHeight: 18,
  },
  rejectedBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderWidth: 1,
    borderColor: "#ef4444",
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    width: "100%",
  },
  rejectedBannerTitle: {
    color: "#f87171",
    fontSize: 12,
    fontWeight: "800",
  },
  rejectedBannerText: {
    color: "#fca5a5",
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  waitingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
  },
  waitingBadgeText: {
    color: "#f59e0b",
    fontSize: 11,
    fontWeight: "800",
  },
  attachedProofBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  attachedProofBadgeText: {
    color: "#10b981",
    fontSize: 10,
    fontWeight: "700",
  },
  proofSubmittedImg: {
    width: "100%",
    height: 180,
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
    marginBottom: 14,
    gap: 8,
    width: "100%",
  },
  waitingNoticeText: {
    flex: 1,
    color: "#fbbf24",
    fontSize: 12,
    lineHeight: 17,
  },
  checkStatusBtn: {
    width: "100%",
    backgroundColor: "#f59e0b",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    borderRadius: 12,
    gap: 8,
    marginBottom: 10,
    shadowColor: "#f59e0b",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  checkStatusBtnText: {
    color: "#000",
    fontSize: 14,
    fontWeight: "900",
  },
  reUploadBtn: {
    width: "100%",
    backgroundColor: "rgba(236, 72, 153, 0.15)",
    borderWidth: 1,
    borderColor: "#ec4899",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 10,
  },
  reUploadBtnText: {
    color: "#ec4899",
    fontSize: 13,
    fontWeight: "800",
  },
  finishBtnSecondary: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.06)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  finishBtnSecondaryText: {
    color: Colors.dark.textMuted,
    fontSize: 14,
    fontWeight: "700",
  },
});
