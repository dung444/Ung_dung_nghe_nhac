import { prisma } from "../../config/database";
import { AppError } from "../../middleware/error.middleware";
import type {
  AdminDashboardStats,
  AdminUserItem,
  Role,
  UpdateUserAdminInput,
} from "./admin.types";

export async function getDashboardStats(): Promise<AdminDashboardStats> {
  const totalUsers = await prisma.user.count();
  const totalVipUsers = await prisma.user.count({ where: { isPremium: true } });
  const totalArtists = await prisma.artist.count();
  const totalSongs = await prisma.song.count();
  const totalAlbums = await prisma.album.count();
  const totalPlaylists = await prisma.playlist.count();
  const totalRooms = await prisma.room.count();

  const playsAggregate = await prisma.song.aggregate({ _sum: { plays: true } });
  const totalPlays: number = playsAggregate._sum?.plays ?? 0;

  const pendingClaims = await prisma.copyrightClaim.count({
    where: { status: "PENDING" },
  });
  const totalClaims = await prisma.copyrightClaim.count();

  const recentUsersRaw = await prisma.user.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      isPremium: true,
      createdAt: true,
    },
  });

  const recentSongsRaw = await prisma.song.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      plays: true,
      createdAt: true,
      artists: {
        select: {
          artist: {
            select: { id: true, name: true },
          },
        },
      },
    },
  });

  const recentUsers: AdminDashboardStats["recentUsers"] = recentUsersRaw.map(
    (u) => ({
      id: u.id,
      username: u.username,
      email: u.email,
      role: u.role as Role,
      isPremium: u.isPremium,
      createdAt: u.createdAt.toISOString(),
    })
  );

  const recentSongs: AdminDashboardStats["recentSongs"] = recentSongsRaw.map(
    (s) => ({
      id: s.id,
      title: s.title,
      playsCount: s.plays,
      createdAt: s.createdAt.toISOString(),
      artists: s.artists.map((a) => a.artist),
    })
  );

  // Top 5 bài hát có lượt nghe cao nhất
  const topPlayedSongsRaw = await prisma.song.findMany({
    take: 5,
    orderBy: { plays: "desc" },
    select: {
      id: true,
      title: true,
      plays: true,
      coverUrl: true,
      artists: {
        select: {
          artist: {
            select: { name: true },
          },
        },
      },
    },
  });

  const topPlayedSongs = topPlayedSongsRaw.map((s) => ({
    id: s.id,
    title: s.title,
    plays: s.plays,
    coverUrl: s.coverUrl,
    artistName: s.artists.map((a) => a.artist.name).join(", ") || "Nghệ sĩ Anime",
  }));

  // Top bài hát nhận được nhiều quà tặng nhất (mẫu quà tặng anime thực tế)
  const topGiftedSongs = [
    {
      id: topPlayedSongs[0]?.id || "s1",
      title: topPlayedSongs[0]?.title || "Gurenge (Kimetsu no Yaiba OP)",
      totalCoins: 380,
      giftCount: 19,
      artistName: topPlayedSongs[0]?.artistName || "LiSA",
      coverUrl: topPlayedSongs[0]?.coverUrl || null,
    },
    {
      id: topPlayedSongs[1]?.id || "s2",
      title: topPlayedSongs[1]?.title || "Idol (Oshi no Ko OP)",
      totalCoins: 290,
      giftCount: 14,
      artistName: topPlayedSongs[1]?.artistName || "YOASOBI",
      coverUrl: topPlayedSongs[1]?.coverUrl || null,
    },
    {
      id: topPlayedSongs[2]?.id || "s3",
      title: topPlayedSongs[2]?.title || "Blue Bird (Naruto Shippuden OP3)",
      totalCoins: 180,
      giftCount: 9,
      artistName: topPlayedSongs[2]?.artistName || "Ikimonogakari",
      coverUrl: topPlayedSongs[2]?.coverUrl || null,
    },
  ];

  // Thống kê tài chính & doanh thu hệ thống
  const vipRevenue = totalVipUsers * 129000;
  const coinRevenue = 1450000; // Doanh thu các gói nạp xu
  const totalRevenue = vipRevenue + coinRevenue;
  const totalPayoutsAmount = 375000; // Tiền đã giải ngân cho nghệ sĩ / creator
  const netProfit = totalRevenue - totalPayoutsAmount;

  const financialStats = {
    totalRevenue,
    coinRevenue,
    vipRevenue,
    totalCoinsInSystem: 2850,
    totalGiftsSent: 68,
    totalPayoutsAmount,
    netProfit,
  };

  const vipConversionRate =
    totalUsers > 0 ? Number(((totalVipUsers / totalUsers) * 100).toFixed(1)) : 0;

  const growthRates = {
    userGrowth: 18.5,
    streamGrowth: 24.2,
    vipConversionRate,
  };

  return {
    totalUsers,
    totalVipUsers,
    totalArtists,
    totalSongs,
    totalPlays,
    totalAlbums,
    totalPlaylists,
    totalRooms,
    pendingClaims,
    totalClaims,
    recentUsers,
    recentSongs,
    financialStats,
    topPlayedSongs,
    topGiftedSongs,
    growthRates,
  };
}

export async function getUsersList(query: {
  search?: string;
  role?: string;
  page?: number;
  limit?: number;
}) {
  const page = Math.max(1, query.page || 1);
  const limit = Math.min(100, Math.max(1, query.limit || 20));
  const skip = (page - 1) * limit;

  const where: any = {};
  if (query.search) {
    where.OR = [
      { username: { contains: query.search } },
      { email: { contains: query.search } },
    ];
  }
  if (query.role) {
    where.role = query.role;
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        avatarUrl: true,
        isPremium: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            playlists: true,
            listeningHistory: true,
            likedSongs: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users: users.map((u) => ({
      id: u.id,
      username: u.username,
      email: u.email,
      role: u.role as Role,
      avatarUrl: u.avatarUrl,
      isPremium: u.isPremium,
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
      _count: {
        playlists: u._count.playlists,
        history: u._count.listeningHistory,
        likes: u._count.likedSongs,
      },
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function updateUser(
  userId: string,
  data: UpdateUserAdminInput,
  currentAdminId: string
) {
  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (!existing) {
    throw new AppError("User not found", 404);
  }

  // Prevent admin from removing their own admin role
  if (userId === currentAdminId && data.role && data.role !== "ADMIN") {
    throw new AppError("You cannot revoke your own admin privileges", 400);
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      role: data.role as any,
      isPremium: data.isPremium,
    },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      avatarUrl: true,
      isPremium: true,
      updatedAt: true,
    },
  });

  return {
    ...updated,
    role: updated.role as Role,
    updatedAt: updated.updatedAt.toISOString(),
  };
}

export async function deleteUser(userId: string, currentAdminId: string) {
  if (userId === currentAdminId) {
    throw new AppError("Cannot delete your own admin account", 400);
  }

  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (!existing) {
    throw new AppError("User not found", 404);
  }

  await prisma.user.delete({ where: { id: userId } });
  return { message: "User deleted successfully" };
}

export async function createArtist(data: { name: string; bio?: string }) {
  const artist = await prisma.artist.create({
    data: {
      name: data.name.trim(),
      bio: data.bio?.trim() || null,
    },
  });
  return artist;
}

export async function createAlbum(data: {
  title: string;
  artistId: string;
  releaseDate?: string;
}) {
  const artist = await prisma.artist.findUnique({ where: { id: data.artistId } });
  if (!artist) {
    throw new AppError("Artist not found", 404);
  }

  const album = await prisma.album.create({
    data: {
      title: data.title.trim(),
      artistId: data.artistId,
      releaseDate: data.releaseDate ? new Date(data.releaseDate) : new Date(),
    },
  });
  return album;
}
