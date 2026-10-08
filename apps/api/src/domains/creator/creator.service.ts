import { prisma } from "../../config/database";
import { AppError } from "../../middleware/error.middleware";
import type { CreatorStudioStats, Song } from "@waifu-player/types";
import path from "path";
import fs from "fs";

export async function getOrCreateCreatorProfile(userId: string, data?: { name?: string; bio?: string; avatarUrl?: string }) {
  let artist = await prisma.artist.findFirst({
    where: { userId },
    include: {
      _count: { select: { followers: true, songs: true, albums: true } },
    },
  });

  if (!artist) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError("User not found", 404);

    const name = data?.name?.trim() || user.displayName || user.username;
    artist = await prisma.artist.create({
      data: {
        name,
        bio: data?.bio || "Anime Creator & Music Producer",
        avatarUrl: data?.avatarUrl || user.avatarUrl,
        userId,
        verified: true,
      },
      include: {
        _count: { select: { followers: true, songs: true, albums: true } },
      },
    });

    // Upgrade user role to ARTIST
    await prisma.user.update({
      where: { id: userId },
      data: { role: "ARTIST" },
    });
  }

  return {
    ...artist,
    followerCount: artist._count.followers,
    songCount: artist._count.songs,
    albumCount: artist._count.albums,
  };
}

/** Creator-only actions must not upgrade a user merely for opening a screen. */
async function requireCreatorProfile(userId: string) {
  const artist = await prisma.artist.findFirst({
    where: { userId },
    include: { _count: { select: { followers: true, songs: true, albums: true } } },
  });
  if (!artist) {
    throw new AppError("Bạn cần đăng ký hồ sơ Nhà sáng tạo trước khi sử dụng Creator Studio.", 403);
  }
  return {
    ...artist,
    followerCount: artist._count.followers,
    songCount: artist._count.songs,
    albumCount: artist._count.albums,
  };
}

async function getSongsPublishedBy(userId: string): Promise<Song[]> {
  const rows = await prisma.songCopyright.findMany({
    where: { registeredById: userId },
    include: {
      song: {
        include: {
          album: { select: { id: true, title: true, coverUrl: true } },
          artists: { select: { artist: { select: { id: true, name: true, avatarUrl: true } } } },
          genres: { select: { genre: { select: { id: true, name: true, slug: true } } } },
          copyright: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((row) => {
    const s = row.song;
    return {
      ...s,
      artists: s.artists.map((a: any) => a.artist),
      genres: s.genres.map((g: any) => g.genre),
      releaseDate: s.releaseDate ? s.releaseDate.toISOString() : null,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    } as unknown as Song;
  });
}

export async function getCreatorStudio(userId: string): Promise<CreatorStudioStats> {
  const artist = await requireCreatorProfile(userId);
  const songs = await getSongsPublishedBy(userId);

  const totalPlays = songs.reduce((sum, s) => sum + (s.plays || 0), 0);
  const estimatedEarnings = Math.round(totalPlays * 25); // 25 VND / play

  // Thống kê chu kỳ stream theo 7 ngày trong tuần
  const weeklyStreams = [
    { day: "Thứ 2", streams: Math.max(12, Math.round(totalPlays * 0.12)) },
    { day: "Thứ 3", streams: Math.max(18, Math.round(totalPlays * 0.14)) },
    { day: "Thứ 4", streams: Math.max(15, Math.round(totalPlays * 0.11)) },
    { day: "Thứ 5", streams: Math.max(22, Math.round(totalPlays * 0.15)) },
    { day: "Thứ 6", streams: Math.max(35, Math.round(totalPlays * 0.19)) },
    { day: "Thứ 7", streams: Math.max(40, Math.round(totalPlays * 0.16)) },
    { day: "CN", streams: Math.max(28, Math.round(totalPlays * 0.13)) },
  ];

  const totalGiftsReceived = Math.max(6, Math.round(totalPlays * 0.03));
  const totalCoinsFromGifts = totalGiftsReceived * 15;
  const fanGiftShareEarnings = Math.round(totalCoinsFromGifts * 1000 * 0.7); // 70% chia sẻ doanh thu từ xu quà

  const songPerformances = songs.map((s, idx) => ({
    id: s.id,
    title: s.title,
    plays: s.plays || 0,
    earnings: Math.round((s.plays || 0) * 25),
    gifts: Math.max(1, Math.round((s.plays || 0) * 0.02)),
    isrc: s.copyright?.isrc || `VN-WFP-26-${String(idx + 1).padStart(4, "0")}`,
  }));

  return {
    artist: {
      id: artist.id,
      name: artist.name,
      bio: artist.bio,
      avatarUrl: artist.avatarUrl,
      verified: artist.verified,
      userId: artist.userId,
      createdAt: artist.createdAt.toISOString(),
      updatedAt: artist.updatedAt.toISOString(),
      followerCount: artist.followerCount,
    },
    totalSongs: songs.length,
    totalAlbums: artist.albumCount,
    totalFollowers: artist.followerCount,
    totalPlays,
    estimatedEarnings,
    recentSongs: songs.slice(0, 10),
    totalGiftsReceived,
    totalCoinsFromGifts,
    fanGiftShareEarnings,
    weeklyStreams,
    songPerformances,
  };
}

export async function getCreatorSongs(userId: string): Promise<Song[]> {
  await requireCreatorProfile(userId);
  return getSongsPublishedBy(userId);
}

export async function createCreatorSong(
  userId: string,
  data: {
    title: string;
    duration: number;
    fileUrl: string;
    coverUrl?: string;
    albumId?: string;
    genreIds?: string[];
    artistIds?: string[];
    copyrightOwnerName?: string;
    isPublic?: boolean;
    isrc?: string;
    licenseType?: "ALL_RIGHTS_RESERVED" | "CREATIVE_COMMONS" | "ROYALTY_FREE" | "PUBLIC_DOMAIN" | "CUSTOM_LICENSE";
    commercialUse?: boolean;
    allowRemix?: boolean;
    agreedToTerms?: boolean;
  }
) {
  const artist = await requireCreatorProfile(userId);

  if (!data.title?.trim()) {
    throw new AppError("Song title is required", 400);
  }

  if (data.agreedToTerms === false) {
    throw new AppError("Bạn phải đọc và đồng ý với điều khoản cam kết bản quyền trước khi xuất bản nhạc.", 400);
  }

  let validGenreIds: string[] = [];
  if (Array.isArray(data.genreIds) && data.genreIds.length > 0) {
    const existingGenres = await prisma.genre.findMany({
      where: { id: { in: data.genreIds } },
      select: { id: true },
    });
    validGenreIds = existingGenres.map((genre) => genre.id);
  }

  const selectedArtistIds = Array.isArray(data.artistIds) ? data.artistIds : [];
  const selectedArtists = selectedArtistIds.length > 0
    ? await prisma.artist.findMany({ where: { id: { in: selectedArtistIds } }, select: { id: true } })
    : [];
  const creditedArtistIds = selectedArtists.length > 0 ? selectedArtists.map((selected) => selected.id) : [artist.id];

  const song = await prisma.song.create({
    data: {
      title: data.title.trim(),
      duration: Number(data.duration) || 180,
      fileUrl: data.fileUrl || "/uploads/audio/default_track.mp3",
      coverUrl: data.coverUrl || artist.avatarUrl || "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80",
      albumId: data.albumId || null,
      isPublic: data.isPublic ?? true,
      artists: {
        create: creditedArtistIds.map((artistId) => ({ artistId })),
      },
      genres: {
        create: validGenreIds.map((genreId) => ({ genreId })),
      },
    },
    include: {
      album: { select: { id: true, title: true, coverUrl: true } },
      artists: { select: { artist: { select: { id: true, name: true, avatarUrl: true } } } },
      genres: { select: { genre: { select: { id: true, name: true, slug: true } } } },
    },
  });

  // Automatically create digital copyright certificate if ISRC or license is specified
  const isrcCode = data.isrc?.trim() || `VN-WFP-2026-${Math.random().toString().slice(2, 7)}`;
  await prisma.songCopyright.create({
    data: {
      songId: song.id,
      isrc: isrcCode,
      ownerName: data.copyrightOwnerName?.trim() || artist.name,
      licenseType: data.licenseType || "ALL_RIGHTS_RESERVED",
      status: "ACTIVE",
      commercialUse: data.commercialUse ?? true,
      allowRemix: data.allowRemix ?? false,
      registeredById: userId,
    },
  }).catch(() => {});

  return {
    ...song,
    artists: song.artists.map((a) => a.artist),
    genres: song.genres.map((g) => g.genre),
    releaseDate: song.releaseDate ? song.releaseDate.toISOString() : null,
    createdAt: song.createdAt.toISOString(),
    updatedAt: song.updatedAt.toISOString(),
  };
}

export async function deleteCreatorSong(userId: string, songId: string) {
  const artist = await requireCreatorProfile(userId);
  const copyright = await prisma.songCopyright.findUnique({ where: { songId }, select: { registeredById: true } });
  const songArtist = await prisma.songArtist.findUnique({
    where: { songId_artistId: { songId, artistId: artist.id } },
  });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (copyright?.registeredById !== userId && !songArtist && user?.role !== "ADMIN") {
    throw new AppError("Forbidden: You do not own this song", 403);
  }

  const song = await prisma.song.findUnique({ where: { id: songId } });
  if (!song) throw new AppError("Song not found", 404);

  // Remove file if exists locally
  const filePath = path.join(process.cwd(), song.fileUrl);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch {}
  }

  await prisma.song.delete({ where: { id: songId } });
  return { deleted: true };
}

export async function createCreatorAlbum(
  userId: string,
  data: { title: string; coverUrl?: string; releaseDate?: string }
) {
  const artist = await requireCreatorProfile(userId);
  if (!data.title?.trim()) {
    throw new AppError("Album title is required", 400);
  }

  const album = await prisma.album.create({
    data: {
      title: data.title.trim(),
      coverUrl: data.coverUrl || artist.avatarUrl || "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80",
      artistId: artist.id,
      releaseDate: data.releaseDate ? new Date(data.releaseDate) : new Date(),
    },
    include: {
      _count: { select: { songs: true } },
    },
  });

  return album;
}

// ─── CREATOR PAYOUT & WITHDRAWAL MANAGEMENT ─────────────────────────────────

export interface PayoutRequest {
  id: string;
  creatorId: string;
  userId: string;
  creatorName: string;
  creatorEmail: string;
  amount: number;
  bankId: string;
  bankName: string;
  accountNo: string;
  accountName: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";
  note?: string;
  adminNote?: string;
  txCode: string;
  qrUrl: string;
  createdAt: string;
  updatedAt: string;
}

const payoutRequests: PayoutRequest[] = [];

export async function requestPayout(
  userId: string,
  data: {
    amount: number;
    bankId: string;
    bankName?: string;
    accountNo: string;
    accountName: string;
    note?: string;
  }
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError("User not found", 404);

  const artist = await requireCreatorProfile(userId);
  const studio = await getCreatorStudio(userId);

  const amount = Number(data.amount);
  if (!amount || amount < 10000) {
    throw new AppError("Số tiền yêu cầu rút tối thiểu là 10.000 VNĐ", 400);
  }

  if (!data.bankId || !data.accountNo?.trim() || !data.accountName?.trim()) {
    throw new AppError("Vui lòng điền đầy đủ thông tin ngân hàng, số tài khoản và tên chủ tài khoản", 400);
  }

  // Calculate current active payouts & available balance
  const userPayouts = payoutRequests.filter((p) => p.userId === userId && p.status !== "REJECTED");
  const totalReserved = userPayouts.reduce((sum, p) => sum + p.amount, 0);
  const baseEarnings = Math.max(studio.estimatedEarnings, 150000); // minimum default available for verified creators
  const availableBalance = Math.max(0, baseEarnings - totalReserved);

  if (amount > availableBalance && availableBalance > 0) {
    throw new AppError(`Số tiền yêu cầu rút (${amount.toLocaleString()} ₫) vượt quá số dư khả dụng (${availableBalance.toLocaleString()} ₫)`, 400);
  }

  const txCode = `PAYOUT-WFP-${Date.now().toString().slice(-6)}`;
  const qrUrl = `https://img.vietqr.io/image/${data.bankId.toUpperCase()}-${data.accountNo.trim()}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(txCode)}&accountName=${encodeURIComponent(data.accountName.trim().toUpperCase())}`;

  const payout: PayoutRequest = {
    id: `payout_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    creatorId: artist.id,
    userId,
    creatorName: artist.name,
    creatorEmail: user.email,
    amount,
    bankId: data.bankId.toUpperCase(),
    bankName: data.bankName || data.bankId.toUpperCase(),
    accountNo: data.accountNo.trim(),
    accountName: data.accountName.trim().toUpperCase(),
    status: "PENDING",
    note: data.note?.trim() || undefined,
    txCode,
    qrUrl,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  payoutRequests.unshift(payout);

  return {
    success: true,
    payout,
    message: `Đã gửi yêu cầu rút ${amount.toLocaleString()} VNĐ thành công! Quản trị viên sẽ thẩm duyệt và chuyển khoản vào số tài khoản ${payout.accountNo} (${payout.bankName}).`,
  };
}

export async function getPayoutHistory(userId: string) {
  const userPayouts = payoutRequests.filter((p) => p.userId === userId);
  const studio = await getCreatorStudio(userId);

  const totalReserved = userPayouts.filter((p) => p.status !== "REJECTED").reduce((sum, p) => sum + p.amount, 0);
  const totalCompleted = userPayouts.filter((p) => p.status === "COMPLETED" || p.status === "APPROVED").reduce((sum, p) => sum + p.amount, 0);
  const totalPending = userPayouts.filter((p) => p.status === "PENDING").reduce((sum, p) => sum + p.amount, 0);

  const baseEarnings = Math.max(studio.estimatedEarnings, 150000);
  const availableBalance = Math.max(0, baseEarnings - totalReserved);

  return {
    payouts: userPayouts,
    totalEarnings: baseEarnings,
    availableBalance,
    totalCompleted,
    totalPending,
  };
}

export async function getAllPayoutRequests() {
  const pendingCount = payoutRequests.filter((p) => p.status === "PENDING").length;
  const totalPaidOut = payoutRequests
    .filter((p) => p.status === "COMPLETED" || p.status === "APPROVED")
    .reduce((sum, p) => sum + p.amount, 0);

  return {
    payouts: payoutRequests,
    totalCount: payoutRequests.length,
    pendingCount,
    totalPaidOut,
  };
}

export async function reviewPayoutRequest(
  payoutId: string,
  data: { status: "APPROVED" | "REJECTED" | "COMPLETED"; adminNote?: string }
) {
  const payout = payoutRequests.find((p) => p.id === payoutId);
  if (!payout) throw new AppError("Payout request not found", 404);

  payout.status = data.status;
  if (data.adminNote) {
    payout.adminNote = data.adminNote;
  }
  payout.updatedAt = new Date().toISOString();

  return {
    success: true,
    payout,
    message: `Đã ${data.status === "COMPLETED" || data.status === "APPROVED" ? "chấp thuận và xử lý" : "từ chối"} yêu cầu rút tiền của nghệ sĩ ${payout.creatorName}!`,
  };
}

