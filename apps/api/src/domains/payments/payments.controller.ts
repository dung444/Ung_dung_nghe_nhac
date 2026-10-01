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
