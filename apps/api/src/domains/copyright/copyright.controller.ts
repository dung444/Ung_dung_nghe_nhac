import { Request, Response, NextFunction } from "express";
import * as svc from "./copyright.service";
import { RegisterCopyrightSchema, CreateCopyrightClaimSchema, ReviewCopyrightClaimSchema } from "@waifu-player/validation";

export async function getLicenses(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await svc.getLicensedSongs(req.query as any);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

export async function getSongCopyright(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await svc.getSongCopyright(req.params.songId);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function upsertSongCopyright(req: Request, res: Response, next: NextFunction) {
  try {
    const body = RegisterCopyrightSchema.parse(req.body);
    const result = await svc.upsertSongCopyright(req.params.songId, req.user!.userId, req.user!.role, body);
    res.json({ success: true, data: result, message: "Cập nhật thông tin bản quyền thành công" });
  } catch (err) {
    next(err);
  }
}

export async function createClaim(req: Request, res: Response, next: NextFunction) {
  try {
    const body = CreateCopyrightClaimSchema.parse(req.body);
    const result = await svc.createClaim(req.user!.userId, body);
    res.status(201).json({ success: true, data: result, message: "Khiếu nại bản quyền đã được ghi nhận và chờ xử lý" });
  } catch (err) {
    next(err);
  }
}

export async function getClaims(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await svc.getClaims(req.user!.userId, req.user!.role, req.query as any);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

export async function getClaimById(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await svc.getClaimById(req.params.claimId, req.user!.userId, req.user!.role);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function reviewClaim(req: Request, res: Response, next: NextFunction) {
  try {
    const body = ReviewCopyrightClaimSchema.parse(req.body);
    const result = await svc.reviewClaim(req.params.claimId, req.user!.userId, body);
    res.json({ success: true, data: result, message: "Xét duyệt khiếu nại bản quyền thành công" });
  } catch (err) {
    next(err);
  }
}

export async function getStats(_req: Request, res: Response, next: NextFunction) {
  try {
    const result = await svc.getCopyrightStats();
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
