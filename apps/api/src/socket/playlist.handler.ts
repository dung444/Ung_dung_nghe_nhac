import { Namespace, Socket } from "socket.io";
import { prisma } from "../config/database";

export function setupPlaylistHandlers(ns: Namespace, socket: Socket) {
  const userId = socket.data.user.userId;

  socket.on("playlist:join", ({ playlistId }: { playlistId: string }) => {
    socket.join(`playlist:${playlistId}`);
  });

  socket.on("playlist:leave", ({ playlistId }: { playlistId: string }) => {
    socket.leave(`playlist:${playlistId}`);
  });

  socket.on("playlist:song:add", async ({ playlistId, songId, position }: { playlistId: string; songId: string; position?: number }) => {
    try {
      const playlist = await prisma.playlist.findUnique({ where: { id: playlistId } });
      if (!playlist || playlist.userId !== userId) return;
      const count = await prisma.playlistSong.count({ where: { playlistId } });
      await prisma.playlistSong.upsert({
        where: { playlistId_songId: { playlistId, songId } },
        create: { playlistId, songId, position: position ?? count },
        update: {},
      });
      const song = await prisma.song.findUnique({ where: { id: songId }, select: { id: true, title: true, duration: true, coverUrl: true } });
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, username: true } });
      ns.to(`playlist:${playlistId}`).emit("playlist:song:added", { song, addedBy: user, position: position ?? count });
    } catch (err) { console.error("[playlist:song:add]", err); }
  });

  socket.on("playlist:song:remove", async ({ playlistId, songId }: { playlistId: string; songId: string }) => {
    try {
      const playlist = await prisma.playlist.findUnique({ where: { id: playlistId } });
      if (!playlist || playlist.userId !== userId) return;
      await prisma.playlistSong.deleteMany({ where: { playlistId, songId } });
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, username: true } });
      ns.to(`playlist:${playlistId}`).emit("playlist:song:removed", { songId, removedBy: user });
    } catch (err) { console.error("[playlist:song:remove]", err); }
  });

  socket.on("playlist:song:reorder", async ({ playlistId, orderedSongIds }: { playlistId: string; orderedSongIds: string[] }) => {
    try {
      const playlist = await prisma.playlist.findUnique({ where: { id: playlistId } });
      if (!playlist || playlist.userId !== userId) return;
      await Promise.all(
        orderedSongIds.map((songId, idx) =>
          prisma.playlistSong.updateMany({ where: { playlistId, songId }, data: { position: idx } })
        )
      );
      ns.to(`playlist:${playlistId}`).emit("playlist:reordered", { orderedSongIds });
    } catch (err) { console.error("[playlist:reorder]", err); }
  });
}
