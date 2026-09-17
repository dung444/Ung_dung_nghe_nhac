import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { verifyAccessToken } from "../lib/jwt";
import { env } from "../config/env";
import { setupPresenceHandlers } from "./presence.handler";
import { setupRoomHandlers } from "./room.handler";
import { setupPlaylistHandlers } from "./playlist.handler";

export let io: Server;

export function initSocketServer(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: { origin: env.CORS_ORIGIN, credentials: true },
    transports: ["websocket", "polling"],
  });

  // ─── JWT Auth middleware (applied to all namespaces) ─────────────────────────
  const authMiddleware = (socket: any, next: any) => {
    const token = socket.handshake.auth?.token ?? socket.handshake.headers?.authorization?.split(" ")[1];
    if (!token) return next(new Error("Authentication required"));
    try {
      socket.data.user = verifyAccessToken(token);
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  };

  // ─── /presence namespace ─────────────────────────────────────────────────────
  const presenceNS = io.of("/presence");
  presenceNS.use(authMiddleware);
  presenceNS.on("connection", (socket) => setupPresenceHandlers(presenceNS, socket));

  // ─── /room namespace ─────────────────────────────────────────────────────────
  const roomNS = io.of("/room");
  roomNS.use(authMiddleware);
  roomNS.on("connection", (socket) => setupRoomHandlers(roomNS, socket));

  // ─── /playlist namespace ─────────────────────────────────────────────────────
  const playlistNS = io.of("/playlist");
  playlistNS.use(authMiddleware);
  playlistNS.on("connection", (socket) => setupPlaylistHandlers(playlistNS, socket));

  console.log("📡 Socket.io: /presence, /room, /playlist namespaces ready");
  return io;
}
