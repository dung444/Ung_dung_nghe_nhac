import { Request, Response, NextFunction } from "express";
import * as svc from "./rooms.service";
const uid = (r: Request) => r.user!.userId;
export const create  = async (req: Request, res: Response, next: NextFunction) => { try { res.status(201).json({ success: true, data: await svc.createRoom(uid(req), req.body.name) }); } catch(e){next(e);} };
export const getById = async (req: Request, res: Response, next: NextFunction) => { try { res.json({ success: true, data: await svc.getRoomById(req.params.id) }); } catch(e){next(e);} };
export const close   = async (req: Request, res: Response, next: NextFunction) => { try { await svc.closeRoom(req.params.id, uid(req)); res.json({ success: true }); } catch(e){next(e);} };
export const list    = async (_req: Request, res: Response, next: NextFunction) => { try { res.json({ success: true, data: await svc.getActiveRooms() }); } catch(e){next(e);} };
