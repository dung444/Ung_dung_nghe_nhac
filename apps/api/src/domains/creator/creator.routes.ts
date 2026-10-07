import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { uploadAudio, uploadCover } from "../../middleware/upload.middleware";
import * as ctrl from "./creator.controller";

export const creatorRouter = Router();

creatorRouter.use(authenticate);

creatorRouter.get("/studio", ctrl.getStudio);
creatorRouter.post("/register", ctrl.registerCreator);
creatorRouter.get("/songs", ctrl.getMySongs);
creatorRouter.post("/songs", uploadAudio.single("audio"), ctrl.publishSong);
creatorRouter.post("/upload/audio", uploadAudio.single("file"), ctrl.uploadAudioFile);
creatorRouter.post("/upload/cover", uploadCover.single("file"), ctrl.uploadCoverFile);
creatorRouter.delete("/songs/:id", ctrl.deleteSong);
creatorRouter.post("/albums", ctrl.createAlbum);
