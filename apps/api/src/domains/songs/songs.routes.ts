import { Router } from "express";
import { authenticate, requireAdmin } from "../../middleware/auth.middleware";
import { uploadAudio } from "../../middleware/upload.middleware";
import * as ctrl from "./songs.controller";

export const songsRouter = Router();

songsRouter.get("/",              ctrl.getSongs);
songsRouter.get("/:id",          ctrl.getSongById);
songsRouter.get("/:id/stream",   ctrl.streamSong);
songsRouter.get("/:id/related",  ctrl.getRelatedSongs);
songsRouter.post("/:id/play",    authenticate, ctrl.recordPlay);
songsRouter.post("/:id/like",    authenticate, ctrl.toggleLike);
songsRouter.post("/",            authenticate, requireAdmin, uploadAudio.single("audio"), ctrl.createSong);
songsRouter.delete("/:id",       authenticate, requireAdmin, ctrl.deleteSong);
