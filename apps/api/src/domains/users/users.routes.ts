import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { uploadCover } from "../../middleware/upload.middleware";
import * as ctrl from "./users.controller";

export const usersRouter = Router();
usersRouter.use(authenticate);
usersRouter.get("/me/history",   ctrl.getHistory);
usersRouter.delete("/me/history",ctrl.clearHistory);
usersRouter.get("/me/liked",     ctrl.getLiked);
usersRouter.get("/me/following", ctrl.getFollowing);
usersRouter.patch("/me",         ctrl.updateMe);
usersRouter.post("/me/avatar",   uploadCover.single("avatar"), ctrl.uploadAvatar);
