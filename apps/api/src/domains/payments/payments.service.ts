import { prisma } from "../../config/database";
import { AppError } from "../../middleware/error.middleware";

export interface VipPackage {
  id: string;
  name: string;
  durationDays: number;
  priceVnd: number;
  coins: number;
  discountBadge?: string;
  features: string[];
}

export const VIP_PACKAGES: VipPackage[] = [
  {
    id: "VIP_1_MONTH",
    name: "VIP Anime Waifu Pass (1 Tháng)",
    durationDays: 30,
    priceVnd: 49000,
    coins: 49,
    features: [
      "Mở khóa toàn bộ kho nhạc bản quyền quốc tế ISRC",
      "Âm thanh chất lượng cao 24-bit Lossless FLAC",
      "Tải nhạc không giới hạn & nghe offline",
      "Không quảng cáo làm gián đoạn bài hát",
    ],
  },
  {
    id: "VIP_3_MONTHS",
    name: "VIP Sakura Season Pass (3 Tháng)",
    durationDays: 90,
    priceVnd: 129000,
    coins: 129,
    discountBadge: "TIẾT KIỆM 15%",
    features: [
      "Toàn bộ đặc quyền của gói VIP 1 Tháng",
      "Huy hiệu thành viên VIP Sakura phát sáng",
      "Tạo phòng nghe Live Room không giới hạn thành viên",
      "Ưu tiên thẩm định và bảo hộ tác quyền tác phẩm",
    ],
  },
  {
    id: "VIP_1_YEAR",
    name: "VIP Lifetime Anime Master (1 Năm)",
    durationDays: 365,
    priceVnd: 449000,
    coins: 449,
    discountBadge: "SIÊU TIẾT KIỆM 30%",
    features: [
      "Toàn bộ đặc quyền VIP cao cấp nhất",
      "Huy hiệu Vương Miện Vàng Waifu Hoàng Gia",
      "Tặng 100 Điểm Sáng Tạo & Hỗ trợ phân phối nhạc",
      "Bảo hộ bản quyền âm nhạc DMCA chuẩn quốc tế",
    ],
  },
];

// In-memory mock transaction ledger for payments & top-ups
interface TransactionRecord {
  id: string;
  userId: string;
  type: "TOPUP" | "BUY_VIP";
  amount: number;
  currency: string;
  method: string;
  packageId?: string;
  status: "SUCCESS" | "PENDING" | "FAILED";
  transactionCode: string;
  createdAt: string;
}

const transactions: TransactionRecord[] = [];

export async function getVipPackages() {
  return {
    packages: VIP_PACKAGES,
    banner: "Ưu đãi Anime VIP Pass: Giảm giá 30% khi đăng ký gói 1 năm!",
  };
}

export async function topup(userId: string, data: { amount: number; method: string; transactionCode?: string }) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError("User not found", 404);

  const amount = Number(data.amount);
  if (!amount || amount < 10000) {
    throw new AppError("Số tiền nạp tối thiểu là 10.000 VNĐ", 400);
  }

  const txCode = data.transactionCode || `TOPUP-WFP-${Date.now().toString().slice(-6)}`;
  const tx: TransactionRecord = {
    id: `tx_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    userId,
    type: "TOPUP",
    amount,
    currency: "VND",
    method: data.method || "VIETQR_BANKING",
    status: "SUCCESS",
    transactionCode: txCode,
    createdAt: new Date().toISOString(),
  };

  transactions.unshift(tx);

  return {
    success: true,
    transaction: tx,
    message: `Nạp thành công ${amount.toLocaleString()} VNĐ vào tài khoản!`,
  };
}

export async function buyVip(userId: string, data: { packageId: string; method?: string; transactionCode?: string }) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError("User not found", 404);

  const pkg = VIP_PACKAGES.find((p) => p.id === data.packageId);
  if (!pkg) {
    throw new AppError("Gói VIP không hợp lệ", 400);
  }

  // Upgrade user to isPremium: true in database
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { isPremium: true },
    select: { id: true, email: true, username: true, displayName: true, avatarUrl: true, isPremium: true, role: true },
  });

  const txCode = data.transactionCode || `VIP-WFP-${Date.now().toString().slice(-6)}`;
  const tx: TransactionRecord = {
    id: `tx_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    userId,
    type: "BUY_VIP",
    amount: pkg.priceVnd,
    currency: "VND",
    method: data.method || "DIRECT_PAYMENT",
    packageId: pkg.id,
    status: "SUCCESS",
    transactionCode: txCode,
    createdAt: new Date().toISOString(),
  };

  transactions.unshift(tx);

  return {
    success: true,
    user: updatedUser,
    package: pkg,
    transaction: tx,
    message: `Chúc mừng bạn đã kích hoạt thành công ${pkg.name}! Toàn bộ kho nhạc bản quyền và chất lượng Lossless đã được mở khóa.`,
  };
}

export async function getTransactionHistory(userId: string) {
  const userTx = transactions.filter((t) => t.userId === userId);
  return {
    transactions: userTx,
    totalCount: userTx.length,
  };
}
