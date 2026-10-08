import bcrypt from "bcrypt";
import { prisma } from "../../config/database";
import { AppError } from "../../middleware/error.middleware";

const songSel = {
  id: true,
  title: true,
  duration: true,
  coverUrl: true,
  plays: true,
  artists: { select: { artist: { select: { id: true, name: true } } } },
};

export async function getHistory(userId: string, page = 1, limit = 20) {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.max(1, Math.min(100, Number(limit) || 20));
  const [items, total] = await Promise.all([
    prisma.listeningHistory.findMany({
      where: { userId },
      orderBy: { playedAt: "desc" },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
      include: { song: { select: songSel } },
    }),
    prisma.listeningHistory.count({ where: { userId } }),
  ]);
  const formatted = items.map((i: any) => ({
    ...i,
    song: { ...i.song, artists: i.song.artists.map((a: any) => a.artist) },
  }));
  return {
    data: formatted,
    items: formatted,
    pagination: { page: safePage, limit: safeLimit, total, totalPages: Math.ceil(total / safeLimit) },
  };
}

export async function clearHistory(userId: string) {
  await prisma.listeningHistory.deleteMany({ where: { userId } });
}

export async function getLikedSongs(userId: string, page = 1, limit = 20) {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.max(1, Math.min(100, Number(limit) || 20));
  const [items, total] = await Promise.all([
    prisma.likedSong.findMany({
      where: { userId },
      orderBy: { likedAt: "desc" },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
      include: { song: { select: songSel } },
    }),
    prisma.likedSong.count({ where: { userId } }),
  ]);
  const formatted = items.map((i: any) => ({
    ...i.song,
    artists: i.song.artists.map((a: any) => a.artist),
    likedAt: i.likedAt,
  }));
  return {
    data: formatted,
    songs: formatted,
    pagination: { page: safePage, limit: safeLimit, total, totalPages: Math.ceil(total / safeLimit) },
  };
}

export async function getFollowedArtists(userId: string) {
  const rows = await prisma.userFollowArtist.findMany({
    where: { userId },
    orderBy: { followedAt: "desc" },
    include: { artist: { select: { id: true, name: true, avatarUrl: true, verified: true } } },
  });
  return rows.map((r: any) => r.artist);
}

export async function updateProfile(
  userId: string,
  data: {
    displayName?: string;
    avatarUrl?: string;
    username?: string;
    currentPassword?: string;
    newPassword?: string;
  }
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError("Người dùng không tồn tại", 404);

  const updateData: any = {};

  if (data.displayName !== undefined) {
    updateData.displayName = data.displayName ? data.displayName.trim() : null;
  }

  if (data.avatarUrl !== undefined) {
    updateData.avatarUrl = data.avatarUrl ? data.avatarUrl.trim() : null;
  }

  if (data.username && data.username.trim() !== user.username) {
    const cleanUsername = data.username.trim();
    if (cleanUsername.length < 3) {
      throw new AppError("Tên người dùng phải có ít nhất 3 ký tự", 400);
    }
    const existing = await prisma.user.findUnique({ where: { username: cleanUsername } });
    if (existing && existing.id !== userId) {
      throw new AppError("Tên người dùng đã được sử dụng bởi tài khoản khác", 400);
    }
    updateData.username = cleanUsername;
  }

  if (data.newPassword) {
    if (!data.currentPassword) {
      throw new AppError("Vui lòng nhập mật khẩu hiện tại để đổi mật khẩu", 400);
    }
    const isMatch = await bcrypt.compare(data.currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new AppError("Mật khẩu hiện tại không chính xác", 400);
    }
    if (data.newPassword.length < 6) {
      throw new AppError("Mật khẩu mới phải có ít nhất 6 ký tự", 400);
    }
    updateData.passwordHash = await bcrypt.hash(data.newPassword, 10);
  }

  return prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      isPremium: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}
