import fs from "fs";
import path from "path";
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

// ─── WAIFU GIFTS & COIN LEADERBOARD ──────────────────────────────────────────

export interface AnimeGift {
  id: string;
  name: string;
  emoji: string;
  coins: number;
  description: string;
}

export const ANIME_GIFTS: AnimeGift[] = [
  { id: "sakura", name: "Hoa Anh Đào", emoji: "🌸", coins: 5, description: "Cánh hoa anh đào mùa xuân lãng mạn" },
  { id: "dango", name: "Bánh Dango", emoji: "🍡", coins: 10, description: "Xiên bánh Dango 3 màu ngọt ngào" },
  { id: "heart", name: "Trái Tim Waifu", emoji: "💖", coins: 20, description: "Tình yêu và năng lượng waifu bùng nổ" },
  { id: "boba", name: "Trà Sữa Maid Cafe", emoji: "☕", coins: 50, description: "Ly trà sữa do hầu gái phép thuật pha chế" },
  { id: "magic_wand", name: "Gậy Phép Mahou", emoji: "🪄", coins: 100, description: "Gậy phép thuật biến hóa thần kỳ" },
  { id: "crown", name: "Vương Miện Nữ Thần", emoji: "👑", coins: 500, description: "Vương miện vàng tôn vinh bài hát siêu phẩm" },
];

export interface CoinPackage {
  id: string;
  name: string;
  coins: number;
  priceVnd: number;
  bonusText?: string;
}

export const COIN_PACKAGES: CoinPackage[] = [
  { id: "COIN_50", name: "Túi Xu Đồng (50 Xu)", coins: 50, priceVnd: 10000 },
  { id: "COIN_120", name: "Hộp Xu Bạc (120 Xu)", coins: 120, priceVnd: 20000, bonusText: "+20% Tặng Thêm" },
  { id: "COIN_350", name: "Rương Xu Vàng (350 Xu)", coins: 350, priceVnd: 50000, bonusText: "+40% Phổ Biến" },
  { id: "COIN_800", name: "Kho Báu Sakura (800 Xu)", coins: 800, priceVnd: 100000, bonusText: "+60% Siêu Hời" },
  { id: "COIN_2000", name: "Kho Báu Hoàng Gia (2000 Xu)", coins: 2000, priceVnd: 200000, bonusText: "+100% Gấp Đôi Xu" },
  { id: "COIN_5500", name: "Đại Phú Hào Waifu (5500 Xu)", coins: 5500, priceVnd: 500000, bonusText: "+120% Cực Khủng" },
];

const userCoinBalances = new Map<string, number>();

export interface SongGiftRecord {
  id: string;
  songId: string;
  userId: string;
  username: string;
  userAvatar?: string | null;
  giftId: string;
  giftName: string;
  giftEmoji: string;
  count: number;
  totalCoins: number;
  message?: string;
  createdAt: string;
}

const songGiftLedger: SongGiftRecord[] = [];

export async function getUserCoins(userId: string): Promise<number> {
  if (!userCoinBalances.has(userId)) {
    userCoinBalances.set(userId, 100);
  }
  return userCoinBalances.get(userId) ?? 100;
}

export async function topupCoins(userId: string, data: { packageId: string; method?: string }) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError("User not found", 404);

  const pkg = COIN_PACKAGES.find((p) => p.id === data.packageId);
  if (!pkg) throw new AppError("Gói xu không hợp lệ", 400);

  const current = await getUserCoins(userId);
  const newBalance = current + pkg.coins;
  userCoinBalances.set(userId, newBalance);

  const tx: TransactionRecord = {
    id: `tx_coin_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    userId,
    userEmail: user.email,
    userName: user.username,
    type: "TOPUP",
    amount: pkg.priceVnd,
    currency: "VND",
    method: data.method || "VIETQR_COIN",
    status: "SUCCESS",
    transactionCode: `COIN-${pkg.id}-${Date.now().toString().slice(-4)}`,
    createdAt: new Date().toISOString(),
  };
  transactions.unshift(tx);

  return {
    success: true,
    addedCoins: pkg.coins,
    balance: newBalance,
    package: pkg,
    message: `Đã nạp thành công ${pkg.coins} Xu vào tài khoản! Số dư hiện tại: ${newBalance} Xu.`,
  };
}

export async function sendGiftToSong(
  userId: string,
  data: { songId: string; giftId: string; count?: number; message?: string }
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError("User not found", 404);

  const song = await prisma.song.findUnique({
    where: { id: data.songId },
    include: { artists: { select: { artist: { select: { id: true, name: true } } } } },
  });
  if (!song) throw new AppError("Bài hát không tồn tại", 404);

  const gift = ANIME_GIFTS.find((g) => g.id === data.giftId);
  if (!gift) throw new AppError("Món quà không hợp lệ", 400);

  const count = Math.max(1, Number(data.count) || 1);
  const requiredCoins = gift.coins * count;

  const currentCoins = await getUserCoins(userId);
  if (currentCoins < requiredCoins) {
    throw new AppError(
      `Số dư xu không đủ (Cần ${requiredCoins} Xu, hiện có ${currentCoins} Xu). Hãy nạp thêm xu!`,
      400
    );
  }

  const remaining = currentCoins - requiredCoins;
  userCoinBalances.set(userId, remaining);

  const record: SongGiftRecord = {
    id: `gift_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    songId: data.songId,
    userId,
    username: user.displayName || user.username,
    userAvatar: user.avatarUrl,
    giftId: gift.id,
    giftName: gift.name,
    giftEmoji: gift.emoji,
    count,
    totalCoins: requiredCoins,
    message: data.message?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };

  songGiftLedger.unshift(record);

  return {
    success: true,
    gift,
    count,
    totalCoins: requiredCoins,
    remainingCoins: remaining,
    song: {
      id: song.id,
      title: song.title,
      artists: song.artists.map((a: any) => a.artist),
    },
    message: `Đã tặng ${count}x ${gift.emoji} ${gift.name} cho bài hát "${song.title}" thành công!`,
  };
}

export async function getGiftCatalog() {
  return {
    gifts: ANIME_GIFTS,
    coinPackages: COIN_PACKAGES,
  };
}

export async function getGiftLeaderboard(limit = 20) {
  const songAggregates = new Map<string, { totalCoins: number; giftCount: number; recentGifts: SongGiftRecord[] }>();

  for (const item of songGiftLedger) {
    if (!songAggregates.has(item.songId)) {
      songAggregates.set(item.songId, { totalCoins: 0, giftCount: 0, recentGifts: [] });
    }
    const current = songAggregates.get(item.songId)!;
    current.totalCoins += item.totalCoins;
    current.giftCount += item.count;
    if (current.recentGifts.length < 3) {
      current.recentGifts.push(item);
    }
  }

  const songs = await prisma.song.findMany({
    where: { isPublic: true },
    select: {
      id: true,
      title: true,
      duration: true,
      coverUrl: true,
      fileUrl: true,
      plays: true,
      artists: { select: { artist: { select: { id: true, name: true } } } },
    },
    take: 50,
  });

  const ranked = songs.map((s) => {
    const stats = songAggregates.get(s.id) || {
      totalCoins: Math.floor((s.plays % 100) * 8 + 15),
      giftCount: Math.floor((s.plays % 20) + 3),
      recentGifts: [],
    };
    return {
      id: s.id,
      title: s.title,
      duration: s.duration,
      coverUrl: s.coverUrl,
      fileUrl: s.fileUrl,
      plays: s.plays,
      artists: s.artists.map((a: any) => a.artist),
      totalCoins: stats.totalCoins,
      giftCount: stats.giftCount,
      recentGifts: stats.recentGifts,
    };
  });

  ranked.sort((a, b) => b.totalCoins - a.totalCoins);

  return ranked.slice(0, limit).map((s, idx) => ({
    rank: idx + 1,
    ...s,
  }));
}

export async function getSongGiftStats(songId: string) {
  const songGifts = songGiftLedger.filter((g) => g.songId === songId);
  const totalCoins = songGifts.reduce((acc, g) => acc + g.totalCoins, 0);
  const giftCount = songGifts.reduce((acc, g) => acc + g.count, 0);

  const supporterMap = new Map<string, { username: string; userAvatar?: string | null; totalCoins: number }>();
  for (const g of songGifts) {
    if (!supporterMap.has(g.userId)) {
      supporterMap.set(g.userId, { username: g.username, userAvatar: g.userAvatar, totalCoins: 0 });
    }
    supporterMap.get(g.userId)!.totalCoins += g.totalCoins;
  }

  const topSupporters = Array.from(supporterMap.values())
    .sort((a, b) => b.totalCoins - a.totalCoins)
    .slice(0, 10);

  return {
    songId,
    totalCoins,
    giftCount,
    recentGifts: songGifts.slice(0, 10),
    topSupporters,
  };
}

// ─── PAYMENT ORDERS & CHECKOUT WORKFLOW ──────────────────────────────────────

export interface PaymentOrder {
  id: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  orderCode: string;
  type: "COIN_TOPUP" | "BUY_VIP";
  packageId?: string;
  packageName: string;
  amount: number;
  coins?: number;
  currency: string;
  method: "VIETQR_BANKING" | "MOMO" | "ZALOPAY" | "VNPAY" | string;
  status: "PENDING" | "WAITING_APPROVAL" | "SUCCESS" | "FAILED" | "CANCELLED" | "EXPIRED" | "REJECTED";
  proofImageUrl?: string;
  userNote?: string;
  adminNote?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  qrUrl: string;
  bankInfo: {
    bankId: string;
    bankName: string;
    accountNo: string;
    accountName: string;
  };
  instructions: string;
  expiresAt: string;
  createdAt: string;
  completedAt?: string;
}

const paymentOrders = new Map<string, PaymentOrder>();

const PAYMENT_DATA_FILE = path.join(process.cwd(), "uploads", "payment_data.json");

function savePaymentDataToDisk() {
  try {
    const uploadDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const data = {
      orders: Array.from(paymentOrders.entries()),
      transactions,
      userBalances: Array.from(userCoinBalances.entries()),
      bankConfig,
    };
    fs.writeFileSync(PAYMENT_DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving payment data to disk:", err);
  }
}

function loadPaymentDataFromDisk() {
  try {
    if (fs.existsSync(PAYMENT_DATA_FILE)) {
      const raw = fs.readFileSync(PAYMENT_DATA_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.orders)) {
        for (const [k, v] of parsed.orders) {
          paymentOrders.set(k, v);
        }
      }
      if (Array.isArray(parsed.transactions)) {
        transactions.length = 0;
        transactions.push(...parsed.transactions);
      }
      if (Array.isArray(parsed.userBalances)) {
        for (const [k, v] of parsed.userBalances) {
          userCoinBalances.set(k, v);
        }
      }
      if (parsed.bankConfig) {
        Object.assign(bankConfig, parsed.bankConfig);
      }
    }
  } catch (err) {
    console.error("Error loading payment data from disk:", err);
  }
}

loadPaymentDataFromDisk();

export async function createPaymentOrder(
  userId: string,
  data: {
    type: "COIN_TOPUP" | "BUY_VIP";
    packageId?: string;
    amount?: number;
    method?: string;
  }
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError("User not found", 404);

  let amount = 0;
  let packageName = "";
  let coins: number | undefined = undefined;

  if (data.type === "COIN_TOPUP") {
    if (data.packageId) {
      const pkg = COIN_PACKAGES.find((p) => p.id === data.packageId);
      if (!pkg) throw new AppError("Gói xu không hợp lệ", 400);
      amount = pkg.priceVnd;
      packageName = pkg.name;
      coins = pkg.coins;
    } else if (data.amount && data.amount >= 10000) {
      amount = Math.round(Number(data.amount));
      coins = Math.floor(amount / 200);
      packageName = `Nạp ${coins} Xu Waifu Tùy Chọn`;
    } else {
      throw new AppError("Vui lòng chọn gói xu hoặc nhập số tiền tối thiểu 10.000 VNĐ", 400);
    }
  } else if (data.type === "BUY_VIP") {
    const pkg = VIP_PACKAGES.find((p) => p.id === data.packageId);
    if (!pkg) throw new AppError("Gói VIP không hợp lệ", 400);
    amount = pkg.priceVnd;
    packageName = pkg.name;
    coins = pkg.coins;
  } else {
    throw new AppError("Loại đơn hàng thanh toán không hợp lệ", 400);
  }

  const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const orderCode = `${bankConfig.memoPrefix} ${data.type === "COIN_TOPUP" ? "COIN" : "VIP"} ${randomSuffix}`;

  const qrUrl = buildVietQrUrl({
    bankId: bankConfig.bankId,
    accountNo: bankConfig.accountNo,
    template: bankConfig.template,
    amount,
    description: orderCode,
    accountName: bankConfig.accountName,
  });

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  const method = data.method || "VIETQR_BANKING";

  const order: PaymentOrder = {
    id: orderId,
    userId,
    userEmail: user.email,
    userName: user.displayName || user.username,
    orderCode,
    type: data.type,
    packageId: data.packageId,
    packageName,
    amount,
    coins,
    currency: "VND",
    method,
    status: "PENDING",
    qrUrl,
    bankInfo: {
      bankId: bankConfig.bankId,
      bankName: bankConfig.bankName,
      accountNo: bankConfig.accountNo,
      accountName: bankConfig.accountName,
    },
    instructions: `Quét mã VietQR bằng app ngân hàng hoặc chuyển khoản chính xác ${amount.toLocaleString()} VNĐ với nội dung "${orderCode}".`,
    expiresAt,
    createdAt: new Date().toISOString(),
  };

  paymentOrders.set(orderId, order);

  const tx: TransactionRecord = {
    id: `tx_${orderId}`,
    userId,
    userEmail: user.email,
    userName: user.username,
    type: data.type === "COIN_TOPUP" ? "TOPUP" : "BUY_VIP",
    amount,
    currency: "VND",
    method,
    packageId: data.packageId,
    packageName,
    status: "PENDING",
    transactionCode: orderCode,
    qrUrl,
    createdAt: order.createdAt,
  };
  transactions.unshift(tx);

  savePaymentDataToDisk();

  return {
    success: true,
    order,
  };
}

export async function getPaymentOrder(orderId: string, userId: string) {
  const order = paymentOrders.get(orderId);
  if (!order) throw new AppError("Đơn hàng thanh toán không tồn tại", 404);

  if (order.userId !== userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.role !== "ADMIN") throw new AppError("Không có quyền xem đơn hàng này", 403);
  }

  if (order.status === "PENDING" && new Date(order.expiresAt).getTime() < Date.now()) {
    order.status = "EXPIRED";
  }

  return {
    success: true,
    order,
  };
}

export async function confirmPaymentOrder(orderId: string, userId: string) {
  const order = paymentOrders.get(orderId);
  if (!order) throw new AppError("Đơn hàng thanh toán không tồn tại", 404);

  if (order.userId !== userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.role !== "ADMIN") throw new AppError("Không có quyền xác nhận đơn hàng này", 403);
  }

  if (order.status === "CANCELLED") {
    throw new AppError("Đơn hàng đã bị hủy, không thể thanh toán", 400);
  }
  if (order.status === "EXPIRED") {
    throw new AppError("Đơn hàng đã hết hạn thanh toán, vui lòng tạo đơn mới", 400);
  }

  let newBalance = await getUserCoins(order.userId);

  if (order.status !== "SUCCESS") {
    order.status = "SUCCESS";
    order.completedAt = new Date().toISOString();

    if (order.type === "COIN_TOPUP" && order.coins) {
      newBalance += order.coins;
      userCoinBalances.set(order.userId, newBalance);
    } else if (order.type === "BUY_VIP") {
      await prisma.user.update({
        where: { id: order.userId },
        data: { isPremium: true },
      });
    }

    const tx = transactions.find((t) => t.id === `tx_${order.id}` || t.transactionCode === order.orderCode);
    if (tx) {
      tx.status = "SUCCESS";
    }
  }

  savePaymentDataToDisk();

  return {
    success: true,
    order,
    balance: newBalance,
    message:
      order.type === "COIN_TOPUP"
        ? `Thanh toán thành công! Đã nạp ${order.coins} Xu vào tài khoản. Số dư hiện tại: ${newBalance} Xu.`
        : `Thanh toán thành công! Gói ${order.packageName} đã được kích hoạt.`,
  };
}

export async function cancelPaymentOrder(orderId: string, userId: string) {
  const order = paymentOrders.get(orderId);
  if (!order) throw new AppError("Đơn hàng không tồn tại", 404);

  if (order.userId !== userId) {
    throw new AppError("Không có quyền hủy đơn hàng này", 403);
  }

  if (order.status !== "PENDING") {
    throw new AppError("Chỉ có thể hủy đơn hàng đang chờ thanh toán", 400);
  }

  order.status = "CANCELLED";

  const tx = transactions.find((t) => t.id === `tx_${order.id}` || t.transactionCode === order.orderCode);
  if (tx) {
    tx.status = "FAILED";
  }

  savePaymentDataToDisk();

  return {
    success: true,
    order,
    message: "Đã hủy đơn hàng thanh toán thành công",
  };
}

export async function getUserOrders(userId: string) {
  const userOrders = Array.from(paymentOrders.values())
    .filter((o) => o.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return {
    orders: userOrders,
    totalCount: userOrders.length,
  };
}

export async function submitPaymentProof(
  orderId: string,
  userId: string,
  data: { proofImageUrl: string; note?: string }
) {
  const order = paymentOrders.get(orderId);
  if (!order) throw new AppError("Đơn hàng không tồn tại", 404);

  if (order.userId !== userId) {
    throw new AppError("Không có quyền gửi biên lai cho đơn này", 403);
  }

  if (!data.proofImageUrl) {
    throw new AppError("Vui lòng cung cấp ảnh biên lai chuyển khoản", 400);
  }

  order.proofImageUrl = data.proofImageUrl;
  if (data.note) order.userNote = data.note.trim();
  order.status = "WAITING_APPROVAL";

  // Keep transaction record in sync
  const tx = transactions.find((t) => t.id === `tx_${order.id}` || t.transactionCode === order.orderCode);
  if (tx) {
    tx.status = "PENDING";
  }

  savePaymentDataToDisk();

  return {
    success: true,
    order,
    message: "Đã gửi ảnh biên lai chuyển khoản thành công! Đang chờ Admin duyệt.",
  };
}

export async function adminReviewPaymentOrder(
  orderId: string,
  adminUserId: string,
  data: { action: "APPROVE" | "REJECT"; adminNote?: string }
) {
  let order = paymentOrders.get(orderId);
  if (!order) {
    order = Array.from(paymentOrders.values()).find((o) => o.id === orderId || o.orderCode === orderId);
  }
  if (!order) {
    loadPaymentDataFromDisk();
    order = paymentOrders.get(orderId) || Array.from(paymentOrders.values()).find((o) => o.id === orderId || o.orderCode === orderId);
  }
  if (!order) throw new AppError("Đơn hàng không tồn tại", 404);

  if (data.action !== "APPROVE" && data.action !== "REJECT") {
    throw new AppError("Hành động không hợp lệ", 400);
  }

  order.reviewedAt = new Date().toISOString();
  order.reviewedBy = adminUserId;
  if (data.adminNote) order.adminNote = data.adminNote.trim();

  let newBalance = await getUserCoins(order.userId);

  if (data.action === "APPROVE") {
    order.status = "SUCCESS";
    order.completedAt = new Date().toISOString();

    if (order.type === "COIN_TOPUP" && order.coins) {
      newBalance += order.coins;
      userCoinBalances.set(order.userId, newBalance);
    } else if (order.type === "BUY_VIP") {
      await prisma.user.update({
        where: { id: order.userId },
        data: { isPremium: true },
      });
    }

    const tx = transactions.find((t) => t.id === `tx_${order.id}` || t.transactionCode === order.orderCode);
    if (tx) {
      tx.status = "SUCCESS";
    }

    savePaymentDataToDisk();

    return {
      success: true,
      order,
      balance: newBalance,
      message:
        order.type === "COIN_TOPUP"
          ? `Đã duyệt đơn! Nạp thành công ${order.coins} Xu cho người dùng.`
          : `Đã duyệt đơn! Kích hoạt thành công gói ${order.packageName}.`,
    };
  } else {
    order.status = "REJECTED";

    const tx = transactions.find((t) => t.id === `tx_${order.id}` || t.transactionCode === order.orderCode);
    if (tx) {
      tx.status = "FAILED";
    }

    savePaymentDataToDisk();

    return {
      success: true,
      order,
      message: "Đã từ chối đơn thanh toán.",
    };
  }
}

export async function getAdminPaymentOrders(query?: { status?: string; type?: string }) {
  let list = Array.from(paymentOrders.values());

  if (query?.status) {
    list = list.filter((o) => o.status === query.status);
  }
  if (query?.type) {
    list = list.filter((o) => o.type === query.type);
  }

  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const pendingCount = Array.from(paymentOrders.values()).filter(
    (o) => o.status === "WAITING_APPROVAL" || o.status === "PENDING"
  ).length;

  return {
    orders: list,
    pendingCount,
    totalCount: list.length,
  };
}
