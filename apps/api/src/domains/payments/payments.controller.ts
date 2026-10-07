import { Request, Response, NextFunction } from "express";
import * as svc from "./payments.service";

export const getPackages = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await svc.getVipPackages();
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

export const handleGetBankConfig = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await svc.getBankConfig();
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

export const handleUpdateBankConfig = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await svc.updateBankConfig(req.body);
    res.json(result);
  } catch (e) {
    next(e);
  }
};

export const handleGenerateQr = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await svc.generatePaymentQr({
      userId: req.user?.userId,
      amount: req.body.amount,
      purpose: req.body.purpose || "VIP",
      packageId: req.body.packageId,
      customCode: req.body.customCode,
    });
    res.json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
};

export const handleTopup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await svc.topup(req.user!.userId, req.body);
    res.json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
};

export const handleBuyVip = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await svc.buyVip(req.user!.userId, req.body);
    res.json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
};

export const getHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await svc.getTransactionHistory(req.user!.userId);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

export const handleGetAllTransactions = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await svc.getAllTransactions();
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

export const handleGetGiftCatalog = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await svc.getGiftCatalog();
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

export const handleGetUserCoins = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const coins = await svc.getUserCoins(req.user!.userId);
    res.json({ success: true, data: { coins } });
  } catch (e) {
    next(e);
  }
};

export const handleTopupCoins = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await svc.topupCoins(req.user!.userId, req.body);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

export const handleSendGift = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await svc.sendGiftToSong(req.user!.userId, req.body);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

export const handleGetGiftLeaderboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Number(req.query.limit) || 20;
    const data = await svc.getGiftLeaderboard(limit);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

export const handleGetSongGiftStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await svc.getSongGiftStats(req.params.songId);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

