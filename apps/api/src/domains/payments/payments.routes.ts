import { Router } from "express";
import { authenticate, requireAdmin } from "../../middleware/auth.middleware";
import * as ctrl from "./payments.controller";

export const paymentsRouter = Router();

// Public / User routes
paymentsRouter.get("/packages", ctrl.getPackages);
paymentsRouter.get("/bank-config", ctrl.handleGetBankConfig);
paymentsRouter.post("/generate-qr", ctrl.handleGenerateQr);

// Authenticated user routes
paymentsRouter.post("/topup", authenticate, ctrl.handleTopup);
paymentsRouter.post("/buy-vip", authenticate, ctrl.handleBuyVip);
paymentsRouter.get("/history", authenticate, ctrl.getHistory);

// Admin-only routes
paymentsRouter.put("/bank-config", authenticate, requireAdmin, ctrl.handleUpdateBankConfig);
paymentsRouter.get("/admin/transactions", authenticate, requireAdmin, ctrl.handleGetAllTransactions);

