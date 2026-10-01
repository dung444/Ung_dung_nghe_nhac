import { Request, Response, NextFunction } from "express";
import * as svc from "./users.service";

const uid = (r: Request) => r.user!.userId;

export const getHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const result = await svc.getHistory(uid(req), page, limit);
    res.json({ success: true, ...result });
  } catch (e) {
    next(e);
  }
};

export const clearHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await svc.clearHistory(uid(req));
    res.json({ success: true, message: "History cleared" });
  } catch (e) {
    next(e);
  }
};

export const getLiked = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const result = await svc.getLikedSongs(uid(req), page, limit);
    res.json({ success: true, ...result });
  } catch (e) {
    next(e);
  }
};

export const getFollowing = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({ success: true, data: await svc.getFollowedArtists(uid(req)) });
  } catch (e) {
    next(e);
  }
};

export const updateMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({ success: true, data: await svc.updateProfile(uid(req), req.body) });
  } catch (e) {
    next(e);
  }
};
