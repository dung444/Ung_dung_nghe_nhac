import { prisma } from "../../config/database";
import { AppError } from "../../middleware/error.middleware";

const songInPlaylist = {
  position: true, addedAt: true,
  song: { select: { id: true, title: true, duration: true, coverUrl: true, plays: true,
    artists: { select: { artist: { select: { id: true, name: true } } } } } },
};

export async function getUserPlaylists(userId: string) {
  return prisma.playlist.findMany({
    where: { userId },
    include: { _count: { select: { songs: true } } },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getPlaylistById(id: string, userId?: string) {
  const playlist = await prisma.playlist.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, username: true, avatarUrl: true } },
      songs: { select: songInPlaylist, orderBy: { position: "asc" } },
    },
  });
  if (!playlist) throw new AppError("Playlist not found", 404);
  if (!playlist.isPublic && playlist.userId !== userId)
    throw new AppError("Playlist is private", 403);
  return {
    ...playlist,
    songs: playlist.songs.map((ps: any) => ({
      ...ps, song: { ...ps.song, artists: ps.song.artists.map((a: any) => a.artist) },
    })),
  };
}

export async function createPlaylist(userId: string, data: { name: string; description?: string; isPublic?: boolean }) {
  return prisma.playlist.create({ data: { ...data, userId } });
}

export async function updatePlaylist(id: string, userId: string, data: { name?: string; description?: string; isPublic?: boolean }) {
  const playlist = await prisma.playlist.findUnique({ where: { id } });
  if (!playlist) throw new AppError("Playlist not found", 404);
  if (playlist.userId !== userId) throw new AppError("Forbidden", 403);
  return prisma.playlist.update({ where: { id }, data });
}

export async function deletePlaylist(id: string, userId: string) {
  const playlist = await prisma.playlist.findUnique({ where: { id } });
  if (!playlist) throw new AppError("Playlist not found", 404);
  if (playlist.userId !== userId) throw new AppError("Forbidden", 403);
  await prisma.playlist.delete({ where: { id } });
}

export async function addSong(playlistId: string, userId: string, songId: string, position?: number) {
  const playlist = await prisma.playlist.findUnique({ where: { id: playlistId } });
  if (!playlist) throw new AppError("Playlist not found", 404);
  if (playlist.userId !== userId) throw new AppError("Forbidden", 403);
  const song = await prisma.song.findUnique({ where: { id: songId } });
  if (!song) throw new AppError("Song not found", 404);
  const existing = await prisma.playlistSong.findUnique({ where: { playlistId_songId: { playlistId, songId } } });
  if (existing) throw new AppError("Song already in playlist", 409);
  const count = await prisma.playlistSong.count({ where: { playlistId } });
  await prisma.playlistSong.create({ data: { playlistId, songId, position: position ?? count } });
}

export async function removeSong(playlistId: string, userId: string, songId: string) {
  const playlist = await prisma.playlist.findUnique({ where: { id: playlistId } });
  if (!playlist) throw new AppError("Playlist not found", 404);
  if (playlist.userId !== userId) throw new AppError("Forbidden", 403);
  await prisma.playlistSong.deleteMany({ where: { playlistId, songId } });
}

export async function reorderSongs(playlistId: string, userId: string, orderedSongIds: string[]) {
  const playlist = await prisma.playlist.findUnique({ where: { id: playlistId } });
  if (!playlist) throw new AppError("Playlist not found", 404);
  if (playlist.userId !== userId) throw new AppError("Forbidden", 403);
  await Promise.all(
    orderedSongIds.map((songId, idx) =>
      prisma.playlistSong.updateMany({ where: { playlistId, songId }, data: { position: idx } })
    )
  );
}
