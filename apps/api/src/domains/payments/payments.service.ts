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

export interface BankConfig {
  bankId: string;
  bankName: string;
  accountNo: string;
  accountName: string;
  template: "compact2" | "compact" | "qr_only" | "print";
  memoPrefix: string;
  isActive: boolean;
  updatedAt: string;
}

export const SUPPORTED_BANKS = [
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
  { id: "VIB", name: "VIB (Quốc Tế)", bin: "970441", shortName: "VIB" },
  { id: "MSB", name: "MSB (Hàng Hải)", bin: "970426", shortName: "MSB" },
];

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

// Current admin bank configuration
let bankConfig: BankConfig = {
  bankId: "MB",
  bankName: "MBBank (Ngân Hàng Quân Đội)",
  accountNo: "0987654321",
  accountName: "WAIFU PLAYER ADMIN",
  template: "compact2",
  memoPrefix: "WFP",
  isActive: true,
  updatedAt: new Date().toISOString(),
};

// In-memory mock transaction ledger for payments & top-ups
export interface TransactionRecord {
  id: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  type: "TOPUP" | "BUY_VIP";
  amount: number;
  currency: string;
  method: string;
  packageId?: string;
  packageName?: string;
  status: "SUCCESS" | "PENDING" | "FAILED";
  transactionCode: string;
  qrUrl?: string;
  createdAt: string;
}

const transactions: TransactionRecord[] = [];

export function buildVietQrUrl(params: {
  bankId: string;
  accountNo: string;
  template?: string;
  amount?: number;
  description?: string;
  accountName?: string;
}) {
  const bank = params.bankId || bankConfig.bankId || "MB";
  const acc = params.accountNo || bankConfig.accountNo || "0987654321";
  const tpl = params.template || bankConfig.template || "compact2";
  const url = new URL(`https://img.vietqr.io/image/${bank}-${acc}-${tpl}.png`);

  if (params.amount && params.amount > 0) {
    url.searchParams.set("amount", String(Math.round(params.amount)));
  }
  if (params.description) {
    url.searchParams.set("addInfo", params.description);
  }
  if (params.accountName) {
    url.searchParams.set("accountName", params.accountName);
  }
  return url.toString();
}

export async function getBankConfig() {
  return {
    config: bankConfig,
    supportedBanks: SUPPORTED_BANKS,
  };
}

export async function updateBankConfig(data: Partial<BankConfig>) {
  if (data.bankId) {
    const foundBank = SUPPORTED_BANKS.find((b) => b.id.toUpperCase() === data.bankId?.toUpperCase());
    bankConfig.bankId = data.bankId.toUpperCase();
    if (foundBank) {
      bankConfig.bankName = foundBank.name;
    } else if (data.bankName) {
      bankConfig.bankName = data.bankName;
    }
  }

  if (data.accountNo) {
    bankConfig.accountNo = data.accountNo.trim();
  }

  if (data.accountName) {
    bankConfig.accountName = data.accountName.trim().toUpperCase();
  }

  if (data.template) {
    bankConfig.template = data.template;
  }

  if (data.memoPrefix) {
    bankConfig.memoPrefix = data.memoPrefix.trim().toUpperCase();
  }

  if (typeof data.isActive === "boolean") {
    bankConfig.isActive = data.isActive;
  }

  bankConfig.updatedAt = new Date().toISOString();

  return {
    success: true,
    config: bankConfig,
    message: "Đã cập nhật cấu hình tài khoản ngân hàng & mã VietQR thành công!",
  };
}

export async function generatePaymentQr(params: {
  userId?: string;
  amount: number;
  purpose: "VIP" | "TOPUP";
  packageId?: string;
  customCode?: string;
}) {
  const amount = Number(params.amount);
  if (!amount || amount < 1000) {
    throw new AppError("Số tiền thanh toán không hợp lệ", 400);
  }

  const suffix = params.customCode || Math.random().toString(36).substring(2, 7).toUpperCase();
  const txCode = `${bankConfig.memoPrefix} ${params.purpose} ${suffix}`.trim();

  const qrUrl = buildVietQrUrl({
    bankId: bankConfig.bankId,
    accountNo: bankConfig.accountNo,
    template: bankConfig.template,
    amount,
    description: txCode,
    accountName: bankConfig.accountName,
  });

  return {
    qrUrl,
    amount,
    transactionCode: txCode,
    bankInfo: {
      bankId: bankConfig.bankId,
      bankName: bankConfig.bankName,
      accountNo: bankConfig.accountNo,
      accountName: bankConfig.accountName,
    },
    instructions: `Quét mã QR bằng ứng dụng ngân hàng bất kỳ để tự động điền ${amount.toLocaleString()} VNĐ và nội dung "${txCode}".`,
  };
}

export async function getVipPackages() {
  return {
    packages: VIP_PACKAGES,
    banner: "Ưu đãi Anime VIP Pass: Giảm giá 30% khi đăng ký gói 1 năm!",
    bankConfig,
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
  const qrUrl = buildVietQrUrl({
    bankId: bankConfig.bankId,
    accountNo: bankConfig.accountNo,
    template: bankConfig.template,
    amount,
    description: txCode,
    accountName: bankConfig.accountName,
  });

  const tx: TransactionRecord = {
    id: `tx_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    userId,
    userEmail: user.email,
    userName: user.username,
    type: "TOPUP",
    amount,
    currency: "VND",
    method: data.method || "VIETQR_BANKING",
    status: "SUCCESS",
    transactionCode: txCode,
    qrUrl,
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
  const qrUrl = buildVietQrUrl({
    bankId: bankConfig.bankId,
    accountNo: bankConfig.accountNo,
    template: bankConfig.template,
    amount: pkg.priceVnd,
    description: txCode,
    accountName: bankConfig.accountName,
  });

  const tx: TransactionRecord = {
    id: `tx_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    userId,
    userEmail: user.email,
    userName: user.username,
    type: "BUY_VIP",
    amount: pkg.priceVnd,
    currency: "VND",
    method: data.method || "VIETQR_BANKING",
    packageId: pkg.id,
    packageName: pkg.name,
    status: "SUCCESS",
    transactionCode: txCode,
    qrUrl,
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

export async function getAllTransactions() {
  return {
    transactions,
    totalCount: transactions.length,
    totalRevenue: transactions.reduce((acc, t) => acc + (t.status === "SUCCESS" ? t.amount : 0), 0),
  };
}
