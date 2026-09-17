import express from "express";
import cors from "cors";
import path from "path";
import { env } from "./config/env";
import { errorHandler } from "./middleware/error.middleware";

// Route imports
import { authRouter } from "./domains/auth/auth.routes";
import { songsRouter } from "./domains/songs/songs.routes";
import { artistsRouter } from "./domains/artists/artists.routes";
import { albumsRouter } from "./domains/albums/albums.routes";
import { playlistsRouter } from "./domains/playlists/playlists.routes";
import { queueRouter } from "./domains/queue/queue.routes";
import { searchRouter } from "./domains/search/search.routes";
import { usersRouter } from "./domains/users/users.routes";
import { roomsRouter } from "./domains/rooms/rooms.routes";

export function createApp() {
  const app = express();

  // ─── Core Middleware ─────────────────────────────────────────────────────────
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // ─── Static Files (uploads) ──────────────────────────────────────────────────
  app.use("/uploads", express.static(path.join(process.cwd(), env.UPLOAD_DIR)));

  // ─── Health Check ────────────────────────────────────────────────────────────
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // ─── API Routes ──────────────────────────────────────────────────────────────
  const api = express.Router();
  api.use("/auth", authRouter);
  api.use("/songs", songsRouter);
  api.use("/artists", artistsRouter);
  api.use("/albums", albumsRouter);
  api.use("/playlists", playlistsRouter);
  api.use("/queue", queueRouter);
  api.use("/search", searchRouter);
  api.use("/users", usersRouter);
  api.use("/rooms", roomsRouter);

  app.use("/api/v1", api);

  // ─── 404 ─────────────────────────────────────────────────────────────────────
  app.use((_req, res) => {
    res.status(404).json({ success: false, error: "Route not found" });
  });

  // ─── Global Error Handler ────────────────────────────────────────────────────
  app.use(errorHandler);

  return app;
}
