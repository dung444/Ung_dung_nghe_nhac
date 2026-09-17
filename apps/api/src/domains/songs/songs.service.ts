import { prisma } from "../../config/database";
import { AppError } from "../../middleware/error.middleware";
import path from "path";
import fs from "fs";
import { env } from "../../config/env";

const songSelect = {
  id: true, title: true, duration: true, fileUrl: true, coverUrl: true,
  plays: true, isPublic: true, releaseDate: true, albumId: true, createdAt: true, updatedAt: true,
  album: { select: { id: true, title: true, coverUrl: true } },
  artists: { select: { artist: { select: { id: true, name: true, avatarUrl: true } } } },
  genres: { select: { genre: { select: { id: true, name: true, slug: true } } } },
};

export async function getSongs(query: { page?: number; limit?: number; genre?: string; artist?: string }) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const skip = (page - 1) * limit;

  const where: any = { isPublic: true };
  if (query.genre) where.genres = { some: { genre: { slug: query.genre } } };
  if (query.artist) where.artists = { some: { artist: { name: { contains: query.artist } } } };

  const [songs, total] = await Promise.all([
    prisma.song.findMany({ where, select: songSelect, orderBy: { plays: "desc" }, skip, take: limit }),
    prisma.song.count({ where }),
  ]);

  return { songs: songs.map(formatSong), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function getSongById(id: string) {
  const song = await prisma.song.findUnique({ where: { id }, select: songSelect });
  if (!song) throw new AppError("Song not found", 404);
  return formatSong(song);
}

export async function recordPlay(songId: string, userId: string) {
  await Promise.all([
    prisma.song.update({ where: { id: songId }, data: { plays: { increment: 1 } } }),
    prisma.listeningHistory.create({ data: { userId, songId } }),
  ]);
}

export async function toggleLike(songId: string, userId: string) {
  const existing = await prisma.likedSong.findUnique({ where: { userId_songId: { userId, songId } } });
  if (existing) {
    await prisma.likedSong.delete({ where: { userId_songId: { userId, songId } } });
    return { liked: false };
  }
  await prisma.likedSong.create({ data: { userId, songId } });
  return { liked: true };
}

export async function createSong(data: {
  title: string; duration: number; fileUrl: string; coverUrl?: string;
  albumId?: string; artistIds: string[]; genreIds?: string[]; isPublic?: boolean; releaseDate?: string;
}) {
  const song = await prisma.song.create({
    data: {
      title: data.title,
      duration: data.duration,
      fileUrl: data.fileUrl,
      coverUrl: data.coverUrl,
      albumId: data.albumId,
      isPublic: data.isPublic ?? true,
      releaseDate: data.releaseDate ? new Date(data.releaseDate) : undefined,
      artists: { create: data.artistIds.map((artistId) => ({ artistId })) },
      genres: { create: (data.genreIds ?? []).map((genreId) => ({ genreId })) },
    },
    select: songSelect,
  });
  return formatSong(song);
}

export async function deleteSong(id: string) {
  const song = await prisma.song.findUnique({ where: { id } });
  if (!song) throw new AppError("Song not found", 404);
  // Delete physical file
  const filePath = path.join(process.cwd(), song.fileUrl);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  await prisma.song.delete({ where: { id } });
}

export async function getRelatedSongs(songId: string) {
  const song = await prisma.song.findUnique({
    where: { id: songId },
    include: { genres: true, artists: true },
  });
  if (!song) throw new AppError("Song not found", 404);

  const genreIds = song.genres.map((g) => g.genreId);
  const artistIds = song.artists.map((a) => a.artistId);

  const related = await prisma.song.findMany({
    where: {
      id: { not: songId },
      isPublic: true,
      OR: [
        { genres: { some: { genreId: { in: genreIds } } } },
        { artists: { some: { artistId: { in: artistIds } } } },
      ],
    },
    select: songSelect,
    take: 10,
    orderBy: { plays: "desc" },
  });

  return related.map(formatSong);
}

// ─── Streaming ────────────────────────────────────────────────────────────────

export async function streamSong(songId: string, rangeHeader: string | undefined, res: any) {
  const song = await prisma.song.findUnique({ where: { id: songId } });
  if (!song) throw new AppError("Song not found", 404);

  const filePath = path.join(process.cwd(), song.fileUrl);
  if (!fs.existsSync(filePath)) throw new AppError("Audio file not found", 404);

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const ext = path.extname(song.fileUrl).toLowerCase();
  const mimeTypes: Record<string, string> = {
    ".mp3": "audio/mpeg", ".wav": "audio/wav", ".flac": "audio/flac",
    ".ogg": "audio/ogg", ".m4a": "audio/mp4",
  };
  const contentType = mimeTypes[ext] ?? "audio/mpeg";

  if (rangeHeader) {
    const parts = rangeHeader.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;

    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunkSize,
      "Content-Type": contentType,
    });
    fs.createReadStream(filePath, { start, end }).pipe(res);
  } else {
    res.writeHead(200, {
      "Content-Length": fileSize,
      "Content-Type": contentType,
      "Accept-Ranges": "bytes",
    });
    fs.createReadStream(filePath).pipe(res);
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatSong(song: any) {
  return {
    ...song,
    artists: song.artists?.map((sa: any) => sa.artist) ?? [],
    genres: song.genres?.map((sg: any) => sg.genre) ?? [],
  };
}
