import { Router } from "express";
import { authenticate, requireAdmin } from "../../middleware/auth.middleware";
import * as ctrl from "./payments.controller";

export const paymentsRouter = Router();

// Public / User routes
paymentsRouter.get("/packages", ctrl.getPackages);
paymentsRouter.get("/bank-config", ctrl.handleGetBankConfig);
paymentsRouter.post("/generate-qr", ctrl.handleGenerateQr);
paymentsRouter.get("/gifts", ctrl.handleGetGiftCatalog);
paymentsRouter.get("/gifts/leaderboard", ctrl.handleGetGiftLeaderboard);
paymentsRouter.get("/gifts/song/:songId", ctrl.handleGetSongGiftStats);

// Authenticated user routes
paymentsRouter.post("/topup", authenticate, ctrl.handleTopup);
paymentsRouter.post("/buy-vip", authenticate, ctrl.handleBuyVip);
paymentsRouter.get("/history", authenticate, ctrl.getHistory);
paymentsRouter.get("/coins/balance", authenticate, ctrl.handleGetUserCoins);
paymentsRouter.post("/coins/topup", authenticate, ctrl.handleTopupCoins);
paymentsRouter.post("/gifts/send", authenticate, ctrl.handleSendGift);

// Payment Orders & Checkout Workflow
paymentsRouter.post("/orders/create", authenticate, ctrl.handleCreatePaymentOrder);
paymentsRouter.get("/orders", authenticate, ctrl.handleGetUserOrders);
paymentsRouter.get("/orders/:orderId", authenticate, ctrl.handleGetPaymentOrder);
paymentsRouter.post("/orders/:orderId/confirm", authenticate, ctrl.handleConfirmPaymentOrder);
paymentsRouter.post("/orders/:orderId/cancel", authenticate, ctrl.handleCancelPaymentOrder);

// Admin-only routes
paymentsRouter.put("/bank-config", authenticate, requireAdmin, ctrl.handleUpdateBankConfig);
paymentsRouter.get("/admin/transactions", authenticate, requireAdmin, ctrl.handleGetAllTransactions);

