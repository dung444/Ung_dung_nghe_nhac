import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import * as ctrl from "./rooms.controller";
export const roomsRouter = Router();
roomsRouter.get("/",    ctrl.list);
roomsRouter.post("/",   authenticate, ctrl.create);
roomsRouter.get("/:id", ctrl.getById);
roomsRouter.delete("/:id", authenticate, ctrl.close);
