import { prisma } from "../../config/database";
import { AppError } from "../../middleware/error.middleware";

const songSel = { id: true, title: true, duration: true, coverUrl: true, plays: true,
  artists: { select: { artist: { select: { id: true, name: true } } } } };

export async function getHistory(userId: string, page = 1, limit = 20) {
  const [items, total] = await Promise.all([
    prisma.listeningHistory.findMany({
      where: { userId }, orderBy: { playedAt: "desc" },
      skip: (page-1)*limit, take: limit,
      include: { song: { select: songSel } },
    }),
    prisma.listeningHistory.count({ where: { userId } }),
  ]);
  return {
    items: items.map((i: any) => ({ ...i, song: { ...i.song, artists: i.song.artists.map((a: any) => a.artist) } })),
    pagination: { page, limit, total, totalPages: Math.ceil(total/limit) },
  };
}

export async function clearHistory(userId: string) {
  await prisma.listeningHistory.deleteMany({ where: { userId } });
}

export async function getLikedSongs(userId: string, page = 1, limit = 20) {
  const [items, total] = await Promise.all([
    prisma.likedSong.findMany({
      where: { userId }, orderBy: { likedAt: "desc" },
      skip: (page-1)*limit, take: limit,
      include: { song: { select: songSel } },
    }),
    prisma.likedSong.count({ where: { userId } }),
  ]);
  return {
    songs: items.map((i: any) => ({ ...i.song, artists: i.song.artists.map((a: any) => a.artist), likedAt: i.likedAt })),
    pagination: { page, limit, total, totalPages: Math.ceil(total/limit) },
  };
}

export async function getFollowedArtists(userId: string) {
  const rows = await prisma.userFollowArtist.findMany({
    where: { userId }, orderBy: { followedAt: "desc" },
    include: { artist: { select: { id: true, name: true, avatarUrl: true, verified: true } } },
  });
  return rows.map((r: any) => r.artist);
}

export async function updateProfile(userId: string, data: { displayName?: string; avatarUrl?: string }) {
  return prisma.user.update({
    where: { id: userId }, data,
    select: { id: true, email: true, username: true, displayName: true, avatarUrl: true, isPremium: true, role: true },
  });
}
