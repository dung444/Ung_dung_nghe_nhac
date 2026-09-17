import { Namespace, Socket } from "socket.io";
import { prisma } from "../config/database";

interface RoomState {
  currentSongId: string | null;
  position: number;
  isPlaying: boolean;
  startedAt: number;
}

// In-memory room state (use Redis for production)
const roomStates = new Map<string, RoomState>();

export function setupRoomHandlers(ns: Namespace, socket: Socket) {
  const userId = socket.data.user.userId;

  socket.on("room:join", async ({ roomId }: { roomId: string }) => {
    try {
      const room = await prisma.room.findUnique({ where: { id: roomId } });
      if (!room || !room.isActive) { socket.emit("error", "Room not found or inactive"); return; }

      await prisma.roomParticipant.upsert({
        where: { roomId_userId: { roomId, userId } },
        create: { roomId, userId },
        update: {},
      });

      socket.join(roomId);
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, username: true, avatarUrl: true } });
      ns.to(roomId).emit("room:participant:joined", { ...user, joinedAt: new Date().toISOString() });

      // Send current room state
      const state = roomStates.get(roomId);
      if (state) {
        const elapsed = state.isPlaying ? (Date.now() - state.startedAt) / 1000 : 0;
        socket.emit("room:sync", { position: state.position + elapsed, serverTime: Date.now(), isPlaying: state.isPlaying });
      }
      console.log(`[room] ${userId} joined ${roomId}`);
    } catch (err) { console.error("[room:join]", err); }
  });

  socket.on("room:leave", async ({ roomId }: { roomId: string }) => {
    socket.leave(roomId);
    await prisma.roomParticipant.deleteMany({ where: { roomId, userId } }).catch(() => {});
    ns.to(roomId).emit("room:participant:left", { userId });
  });

  socket.on("room:play", async ({ roomId, songId, position }: { roomId: string; songId: string; position: number }) => {
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room || room.ownerId !== userId) { socket.emit("error", "Only host can control playback"); return; }

    await prisma.room.update({ where: { id: roomId }, data: { currentSongId: songId } });
    const state: RoomState = { currentSongId: songId, position, isPlaying: true, startedAt: Date.now() };
    roomStates.set(roomId, state);

    const song = await prisma.song.findUnique({ where: { id: songId }, select: { id: true, title: true, duration: true, coverUrl: true } });
    ns.to(roomId).emit("room:track:changed", { song, position });
    ns.to(roomId).emit("room:sync", { position, serverTime: Date.now(), isPlaying: true });
  });

  socket.on("room:pause", async ({ roomId, position }: { roomId: string; position: number }) => {
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room || room.ownerId !== userId) return;
    const state = roomStates.get(roomId);
    if (state) { state.isPlaying = false; state.position = position; }
    ns.to(roomId).emit("room:sync", { position, serverTime: Date.now(), isPlaying: false });
  });

  socket.on("room:seek", async ({ roomId, position }: { roomId: string; position: number }) => {
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room || room.ownerId !== userId) return;
    const state = roomStates.get(roomId);
    if (state) { state.position = position; state.startedAt = Date.now(); }
    ns.to(roomId).emit("room:sync", { position, serverTime: Date.now(), isPlaying: state?.isPlaying ?? false });
  });

  socket.on("room:chat", async ({ roomId, message }: { roomId: string; message: string }) => {
    if (!message?.trim()) return;
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, username: true, avatarUrl: true } });
    ns.to(roomId).emit("room:chat:message", { ...user, message: message.trim(), sentAt: new Date().toISOString() });
  });

  socket.on("disconnect", async () => {
    // Remove from all rooms
    const rooms = await prisma.roomParticipant.findMany({ where: { userId }, select: { roomId: true } });
    for (const { roomId } of rooms) {
      ns.to(roomId).emit("room:participant:left", { userId });
    }
    await prisma.roomParticipant.deleteMany({ where: { userId } });
  });
}
