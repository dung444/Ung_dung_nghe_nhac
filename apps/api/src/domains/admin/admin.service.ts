import { prisma } from "../../config/database";
import { AppError } from "../../middleware/error.middleware";
import type {
  AdminDashboardStats,
  AdminUserItem,
  Role,
  UpdateUserAdminInput,
} from "./admin.types";

export async function getDashboardStats(): Promise<AdminDashboardStats> {
  const [
    totalUsers,
    totalVipUsers,
    totalArtists,
    totalSongs,
    playsAggregate,
    totalAlbums,
    totalPlaylists,
    totalRooms,
    pendingClaims,
    totalClaims,
    recentUsersRaw,
    recentSongsRaw,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isPremium: true } }),
    prisma.artist.count(),
    prisma.song.count(),
    prisma.song.aggregate({ _sum: { plays: true } }),
    prisma.album.count(),
    prisma.playlist.count(),
    prisma.room.count(),
    prisma.copyrightClaim.count({ where: { status: "PENDING" } }),
    prisma.copyrightClaim.count(),
    prisma.user.findMany({
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
    }),
    prisma.song.findMany({
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
    }),
  ]);

  const stats: AdminDashboardStats = {
    totalUsers,
    totalVipUsers,
    totalArtists,
    totalSongs,
    totalPlays: playsAggregate._sum?.plays ?? 0,
    totalAlbums,
    totalPlaylists,
    totalRooms,
    pendingClaims,
    totalClaims,
    recentUsers: recentUsersRaw.map((u) => ({
      id: u.id,
      username: u.username,
      email: u.email,
      role: u.role as Role,
      isPremium: u.isPremium,
      createdAt: u.createdAt.toISOString(),
    })),
    recentSongs: recentSongsRaw.map((s) => ({
      id: s.id,
      title: s.title,
      playsCount: s.plays,
      createdAt: s.createdAt.toISOString(),
      artists: s.artists.map((a) => a.artist),
    })),
  };

  return stats;
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
