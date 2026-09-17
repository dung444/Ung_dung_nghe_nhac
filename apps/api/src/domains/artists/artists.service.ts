import { prisma } from "../../config/database";
import { AppError } from "../../middleware/error.middleware";

const artistSelect = {
  id: true, name: true, bio: true, avatarUrl: true, coverUrl: true,
  verified: true, createdAt: true, updatedAt: true,
  genres: { select: { genre: { select: { id: true, name: true, slug: true } } } },
  _count: { select: { followers: true, songs: true, albums: true } },
};

export async function getArtists(q?: { page?: number; limit?: number }) {
  const page = q?.page ?? 1; const limit = q?.limit ?? 20;
  const [artists, total] = await Promise.all([
    prisma.artist.findMany({ select: artistSelect, orderBy: { name: "asc" }, skip: (page - 1) * limit, take: limit }),
    prisma.artist.count(),
  ]);
  return { artists: artists.map(fmt), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function getArtistById(id: string, userId?: string) {
  const artist = await prisma.artist.findUnique({ where: { id }, select: artistSelect });
  if (!artist) throw new AppError("Artist not found", 404);
  const isFollowing = userId
    ? !!(await prisma.userFollowArtist.findUnique({ where: { userId_artistId: { userId, artistId: id } } }))
    : false;
  return { ...fmt(artist), isFollowing };
}

export async function getArtistAlbums(artistId: string) {
  return prisma.album.findMany({
    where: { artistId },
    include: { _count: { select: { songs: true } } },
    orderBy: { releaseDate: "desc" },
  });
}

export async function getArtistSongs(artistId: string) {
  const rows = await prisma.songArtist.findMany({
    where: { artistId },
    include: {
      song: {
        select: { id: true, title: true, duration: true, coverUrl: true, plays: true,
          artists: { select: { artist: { select: { id: true, name: true } } } } },
      },
    },
    orderBy: { song: { plays: "desc" } },
    take: 20,
  });
  return rows.map((r) => ({ ...r.song, artists: r.song.artists.map((a: any) => a.artist) }));
}

export async function toggleFollow(artistId: string, userId: string) {
  const existing = await prisma.userFollowArtist.findUnique({ where: { userId_artistId: { userId, artistId } } });
  if (existing) {
    await prisma.userFollowArtist.delete({ where: { userId_artistId: { userId, artistId } } });
    return { following: false };
  }
  await prisma.userFollowArtist.create({ data: { userId, artistId } });
  return { following: true };
}

function fmt(a: any) {
  return { ...a, genres: a.genres?.map((g: any) => g.genre) ?? [],
    followerCount: a._count?.followers ?? 0, songCount: a._count?.songs ?? 0, albumCount: a._count?.albums ?? 0 };
}
