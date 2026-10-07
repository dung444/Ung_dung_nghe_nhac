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
  Alert,
  TextInput,
  Platform,
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

const PAYMENT_METHODS = [
  { id: "VIETQR_BANKING", name: "VietQR 24/7", desc: "Chuyển khoản liên ngân hàng quét mã tức thì", icon: "qr-code", badge: "KHUYÊN DÙNG" },
  { id: "MOMO", name: "Ví MoMo", desc: "Thanh toán qua ví điện tử MoMo", icon: "wallet", badge: "NHANH CHÓNG" },
  { id: "ZALOPAY", name: "Ví ZaloPay", desc: "Xác thực qua ứng dụng ZaloPay", icon: "flash", badge: "TIỆN LỢI" },
  { id: "VNPAY", name: "VNPay / Thẻ ATM", desc: "Cổng thanh toán quốc gia VNPay QR & Thẻ", icon: "card", badge: "AN TOÀN" },
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
  const { showSuccess, showError, showInfo, showWarning } = useToastStore();

  const [step, setStep] = useState<"SELECT_METHOD" | "PAYMENT_QR" | "SUCCESS">("SELECT_METHOD");
  const [selectedMethod, setSelectedMethod] = useState("VIETQR_BANKING");
  const [loading, setLoading] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<PaymentOrder | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Timer countdown 15 minutes (900 seconds)
  const [timeLeft, setTimeLeft] = useState<number>(900);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (visible) {
      setStep("SELECT_METHOD");
      setCurrentOrder(null);
      setTimeLeft(900);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [visible]);

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

  // Step 1: Create Payment Order
  const handleCreateOrder = async () => {
    setLoading(true);
    try {
      const payload: any = {
        type,
        method: selectedMethod,
      };

      if (type === "COIN_TOPUP") {
        if (selectedCoinPackage) {
          payload.packageId = selectedCoinPackage.id;
        } else if (customAmount) {
          payload.amount = customAmount;
        }
      } else {
        payload.packageId = selectedVipPackageId || "VIP_1_MONTH";
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

  const getPackageTitle = () => {
    if (type === "COIN_TOPUP") {
      return selectedCoinPackage ? selectedCoinPackage.name : `Nạp Xu Waifu (${(customAmount || 50000).toLocaleString()} ₫)`;
    }
    return "Nâng Cấp Waifu VIP Pass";
  };

  const getPackagePrice = () => {
    if (type === "COIN_TOPUP") {
      return selectedCoinPackage ? selectedCoinPackage.priceVnd : customAmount || 50000;
    }
    return 49000;
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
                  : step === "PAYMENT_QR"
                  ? "Quét Mã Thanh Toán VietQR"
                  : "Thanh Toán & Nạp Xu 🪙"}
              </Text>
            </View>
            <TouchableOpacity onPress={step === "PAYMENT_QR" ? handleCancelOrder : onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={Colors.dark.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* ──────── STEP 1: CHỌN PHƯƠNG THỨC THANH TOÁN ──────── */}
            {step === "SELECT_METHOD" && (
              <View>
                {/* Package Info Card */}
                <View style={styles.summaryCard}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Dịch vụ thanh toán:</Text>
                    <Text style={styles.summaryValBold}>{getPackageTitle()}</Text>
                  </View>
                  {type === "COIN_TOPUP" && selectedCoinPackage && (
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Số xu nhận được:</Text>
                      <Text style={[styles.summaryValBold, { color: "#f59e0b" }]}>
                        🪙 +{selectedCoinPackage.coins} Waifu Coins
                      </Text>
                    </View>
                  )}
                  <View style={styles.divider} />
                  <View style={styles.summaryRow}>
                    <Text style={styles.totalPriceLabel}>Tổng tiền cần thanh toán:</Text>
                    <Text style={styles.totalPriceVal}>{getPackagePrice().toLocaleString()} VNĐ</Text>
                  </View>
                </View>

                {/* Payment Methods */}
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

                {/* Security Guarantee Note */}
                <View style={styles.securityBox}>
                  <Ionicons name="lock-closed" size={16} color="#10b981" />
                  <Text style={styles.securityText}>
                    Giao dịch mã hóa an toàn 256-bit chuẩn Napas & Ngân hàng Nhà nước. Tự động cộng xu ngay khi nhận được tiền.
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
                      <Text style={styles.payBtnText}>Tạo Mã Thanh Toán & Quét QR</Text>
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

                {/* Confirm & Cancel Actions */}
                <TouchableOpacity
                  style={[styles.confirmBtn, loading && { opacity: 0.7 }]}
                  onPress={handleConfirmOrder}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-done" size={20} color="#fff" />
                      <Text style={styles.confirmBtnText}>Tôi Đã Chuyển Khoản • Hoàn Tất Đơn</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelOrder}>
                  <Text style={styles.cancelBtnText}>Hủy giao dịch này</Text>
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
  sectionTitle: {
    color: Colors.dark.textMuted,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 10,
  },
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
});
