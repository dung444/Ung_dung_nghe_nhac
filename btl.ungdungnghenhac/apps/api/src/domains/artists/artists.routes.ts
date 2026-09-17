import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import * as ctrl from "./artists.controller";
export const artistsRouter = Router();
artistsRouter.get("/",            ctrl.getArtists);
artistsRouter.get("/:id",         ctrl.getArtistById);
artistsRouter.get("/:id/albums",  ctrl.getAlbums);
artistsRouter.get("/:id/songs",   ctrl.getSongs);
artistsRouter.post("/:id/follow", authenticate, ctrl.toggleFollow);
