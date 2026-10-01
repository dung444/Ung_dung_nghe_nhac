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

export async function getCreatorStudio(userId: string): Promise<CreatorStudioStats> {
  const artist = await getOrCreateCreatorProfile(userId);

  // Fetch all songs of this creator's artist
  const songArtistRows = await prisma.songArtist.findMany({
    where: { artistId: artist.id },
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
    orderBy: { song: { createdAt: "desc" } },
  });

  const songs = songArtistRows.map((r) => {
    const s = r.song;
    return {
      ...s,
      artists: s.artists.map((a: any) => a.artist),
      genres: s.genres.map((g: any) => g.genre),
      releaseDate: s.releaseDate ? s.releaseDate.toISOString() : null,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    } as unknown as Song;
  });

  const totalPlays = songs.reduce((sum, s) => sum + (s.plays || 0), 0);
  const estimatedEarnings = Math.round(totalPlays * 25); // 25 VND / play

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
  };
}

export async function getCreatorSongs(userId: string): Promise<Song[]> {
  const artist = await getOrCreateCreatorProfile(userId);
  const rows = await prisma.songArtist.findMany({
    where: { artistId: artist.id },
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
    orderBy: { song: { createdAt: "desc" } },
  });

  return rows.map((r) => {
    const s = r.song;
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

export async function createCreatorSong(
  userId: string,
  data: {
    title: string;
    duration: number;
    fileUrl: string;
    coverUrl?: string;
    albumId?: string;
    genreIds?: string[];
    isPublic?: boolean;
    isrc?: string;
    licenseType?: "ALL_RIGHTS_RESERVED" | "CREATIVE_COMMONS" | "ROYALTY_FREE" | "PUBLIC_DOMAIN" | "CUSTOM_LICENSE";
    commercialUse?: boolean;
    allowRemix?: boolean;
  }
) {
  const artist = await getOrCreateCreatorProfile(userId);

  if (!data.title?.trim()) {
    throw new AppError("Song title is required", 400);
  }

  const song = await prisma.song.create({
    data: {
      title: data.title.trim(),
      duration: Number(data.duration) || 180,
      fileUrl: data.fileUrl || "/uploads/audio/default_track.mp3",
      coverUrl: data.coverUrl || artist.avatarUrl || "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80",
      albumId: data.albumId || null,
      isPublic: data.isPublic ?? true,
      artists: {
        create: [{ artistId: artist.id }],
      },
      genres: {
        create: (data.genreIds ?? []).map((genreId) => ({ genreId })),
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
      ownerName: artist.name,
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
  const artist = await getOrCreateCreatorProfile(userId);
  const songArtist = await prisma.songArtist.findUnique({
    where: { songId_artistId: { songId, artistId: artist.id } },
  });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!songArtist && user?.role !== "ADMIN") {
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
  const artist = await getOrCreateCreatorProfile(userId);
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
