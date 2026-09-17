import { Router } from "express";
import * as ctrl from "./albums.controller";
export const albumsRouter = Router();
albumsRouter.get("/",    ctrl.getAlbums);
albumsRouter.get("/:id", ctrl.getAlbumById);
