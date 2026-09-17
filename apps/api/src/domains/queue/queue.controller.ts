import { Request, Response, NextFunction } from "express";
import * as svc from "./queue.service";
const uid = (r: Request) => r.user!.userId;
export const getQueue   = async (req: Request, res: Response, next: NextFunction) => { try { res.json({ success: true, data: await svc.getQueue(uid(req)) }); } catch(e){next(e);} };
export const replace    = async (req: Request, res: Response, next: NextFunction) => { try { await svc.replaceQueue(uid(req), req.body.songIds ?? []); res.json({ success: true }); } catch(e){next(e);} };
export const add        = async (req: Request, res: Response, next: NextFunction) => { try { await svc.addToQueue(uid(req), req.body.songId, req.body.position); res.status(201).json({ success: true }); } catch(e){next(e);} };
export const remove     = async (req: Request, res: Response, next: NextFunction) => { try { await svc.removeFromQueue(uid(req), req.params.itemId); res.json({ success: true }); } catch(e){next(e);} };
export const clear      = async (req: Request, res: Response, next: NextFunction) => { try { await svc.clearQueue(uid(req)); res.json({ success: true }); } catch(e){next(e);} };
