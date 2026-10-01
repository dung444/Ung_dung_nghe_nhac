import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import * as ctrl from "./payments.controller";

export const paymentsRouter = Router();

paymentsRouter.get("/packages", ctrl.getPackages);
paymentsRouter.post("/topup", authenticate, ctrl.handleTopup);
paymentsRouter.post("/buy-vip", authenticate, ctrl.handleBuyVip);
paymentsRouter.get("/history", authenticate, ctrl.getHistory);
