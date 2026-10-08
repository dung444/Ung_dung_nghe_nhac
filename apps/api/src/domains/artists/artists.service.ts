import { prisma } from "../../config/database";
import { AppError } from "../../middleware/error.middleware";

const artistSelect = {
  id: true, name: true, bio: true, avatarUrl: true, coverUrl: true,
  verified: true, createdAt: true, updatedAt: true,
  genres: { select: { genre: { select: { id: true, name: true, slug: true } } } },
  _count: { select: { followers: true, songs: true, albums: true } },
};

export async function getArtists(q?: { page?: number; limit?: number }) {
  const page = Math.max(1, Number(q?.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(q?.limit) || 20));
  const [artists, total] = await Promise.all([
    prisma.artist.findMany({ select: artistSelect, orderBy: { name: "asc" }, skip: (page - 1) * limit, take: limit }),
    prisma.artist.count(),
  ]);
  return { artists: artists.map(fmt), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

const LEGACY_ARTIST_MAP: Record<string, string> = {
  art1: "Hatsune Miku",
  art2: "LiSA",
  art3: "YOASOBI",
  art4: "Ado",
  art5: "Aimer",
};

async function resolveArtistEntity(idOrName: string) {
  if (!idOrName) return null;
  // 1. Try finding by direct ID
  let artist = await prisma.artist.findUnique({ where: { id: idOrName }, select: artistSelect });
  if (artist) return artist;

  // 2. Check legacy map or name lookup
  const targetName = LEGACY_ARTIST_MAP[idOrName] || idOrName;
  artist = await prisma.artist.findFirst({
    where: {
      OR: [
        { name: targetName },
        { name: { contains: targetName } },
      ],
    },
    select: artistSelect,
  });
  return artist;
}

export async function getArtistById(id: string, userId?: string) {
  const artist = await resolveArtistEntity(id);
  if (!artist) throw new AppError("Artist not found", 404);
  const realId = artist.id;
  const isFollowing = userId
    ? !!(await prisma.userFollowArtist.findUnique({ where: { userId_artistId: { userId, artistId: realId } } }))
    : false;
  return { ...fmt(artist), isFollowing };
}

export async function getArtistAlbums(artistId: string) {
  let realId = artistId;
  const artist = await resolveArtistEntity(artistId);
  if (artist) realId = artist.id;

  return prisma.album.findMany({
    where: { artistId: realId },
    include: { _count: { select: { songs: true } } },
    orderBy: { releaseDate: "desc" },
  });
}

export async function getArtistSongs(artistId: string) {
  let realId = artistId;
  const artist = await resolveArtistEntity(artistId);
  if (artist) realId = artist.id;

  const rows = await prisma.songArtist.findMany({
    where: { artistId: realId },
    include: {
      song: {
        select: {
          id: true,
          title: true,
          duration: true,
          coverUrl: true,
          plays: true,
          fileUrl: true,
          lyrics: true,
          album: { select: { id: true, title: true, coverUrl: true } },
          artists: { select: { artist: { select: { id: true, name: true, avatarUrl: true } } } },
        },
      },
    },
    orderBy: { song: { plays: "desc" } },
    take: 50,
  });
  return rows.map((r) => ({ ...r.song, artists: r.song.artists.map((a: any) => a.artist) }));
}

export async function toggleFollow(artistId: string, userId: string) {
  let realId = artistId;
  const artist = await resolveArtistEntity(artistId);
  if (artist) realId = artist.id;

  const existing = await prisma.userFollowArtist.findUnique({ where: { userId_artistId: { userId, artistId: realId } } });
  if (existing) {
    await prisma.userFollowArtist.delete({ where: { userId_artistId: { userId, artistId: realId } } });
    return { following: false };
  }
  await prisma.userFollowArtist.create({ data: { userId, artistId: realId } });
  return { following: true };
}

function fmt(a: any) {
  return { ...a, genres: a.genres?.map((g: any) => g.genre) ?? [],
    followerCount: a._count?.followers ?? 0, songCount: a._count?.songs ?? 0, albumCount: a._count?.albums ?? 0 };
}
