import { Namespace, Socket } from "socket.io";

// Track online users: userId -> socketId
const onlineUsers = new Map<string, string>();

export function setupPresenceHandlers(ns: Namespace, socket: Socket) {
  const userId = socket.data.user.userId;

  // Mark user online
  onlineUsers.set(userId, socket.id);
  socket.join(`user:${userId}`);
  console.log(`[presence] ${userId} connected`);

  // Broadcast to all: this user is online
  socket.broadcast.emit("friend:activity", {
    userId,
    action: "idle",
    timestamp: Date.now(),
  });

  // Client reports they started playing a song
  socket.on("user:playing", (data: { songId: string; songTitle: string; artistName: string; coverUrl?: string }) => {
    socket.broadcast.emit("friend:activity", {
      userId,
      action: "playing",
      song: data,
      timestamp: Date.now(),
    });
  });

  // Client reports paused
  socket.on("user:paused", () => {
    socket.broadcast.emit("friend:activity", {
      userId,
      action: "paused",
      timestamp: Date.now(),
    });
  });

  // On disconnect
  socket.on("disconnect", () => {
    onlineUsers.delete(userId);
    socket.broadcast.emit("friend:activity", {
      userId,
      action: "idle",
      timestamp: Date.now(),
    });
    console.log(`[presence] ${userId} disconnected`);
  });
}
