import { prisma } from "../../config/database";
import { AppError } from "../../middleware/error.middleware";

const albumSelect = {
  id: true, title: true, coverUrl: true, releaseDate: true, createdAt: true,
  artist: { select: { id: true, name: true, avatarUrl: true } },
  _count: { select: { songs: true } },
};

export async function getAlbums(q?: { page?: number; limit?: number }) {
  const page = q?.page ?? 1; const limit = q?.limit ?? 20;
  const [albums, total] = await Promise.all([
    prisma.album.findMany({ select: albumSelect, orderBy: { releaseDate: "desc" }, skip: (page-1)*limit, take: limit }),
    prisma.album.count(),
  ]);
  return { albums, pagination: { page, limit, total, totalPages: Math.ceil(total/limit) } };
}

export async function getAlbumById(id: string) {
  const album = await prisma.album.findUnique({
    where: { id },
    include: {
      artist: { select: { id: true, name: true, avatarUrl: true } },
      songs: {
        select: { id: true, title: true, duration: true, coverUrl: true, plays: true,
          artists: { select: { artist: { select: { id: true, name: true } } } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!album) throw new AppError("Album not found", 404);
  return { ...album, songs: album.songs.map((s: any) => ({ ...s, artists: s.artists.map((a: any) => a.artist) })) };
}
