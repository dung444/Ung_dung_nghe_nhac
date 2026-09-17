import { Request, Response, NextFunction } from "express";
import * as svc from "./users.service";
const uid = (r: Request) => r.user!.userId;
export const getHistory   = async (req: Request, res: Response, next: NextFunction) => { try { res.json({ success: true, ...(await svc.getHistory(uid(req), Number(req.query.page), Number(req.query.limit))) }); } catch(e){next(e);} };
export const clearHistory = async (req: Request, res: Response, next: NextFunction) => { try { await svc.clearHistory(uid(req)); res.json({ success: true }); } catch(e){next(e);} };
export const getLiked     = async (req: Request, res: Response, next: NextFunction) => { try { res.json({ success: true, ...(await svc.getLikedSongs(uid(req), Number(req.query.page), Number(req.query.limit))) }); } catch(e){next(e);} };
export const getFollowing = async (req: Request, res: Response, next: NextFunction) => { try { res.json({ success: true, data: await svc.getFollowedArtists(uid(req)) }); } catch(e){next(e);} };
export const updateMe     = async (req: Request, res: Response, next: NextFunction) => { try { res.json({ success: true, data: await svc.updateProfile(uid(req), req.body) }); } catch(e){next(e);} };
