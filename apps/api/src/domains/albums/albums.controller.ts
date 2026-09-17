import { Request, Response, NextFunction } from "express";
import * as svc from "./albums.service";
export const getAlbums    = async (req: Request, res: Response, next: NextFunction) => { try { res.json({ success: true, ...(await svc.getAlbums(req.query as any)) }); } catch(e){next(e);} };
export const getAlbumById = async (req: Request, res: Response, next: NextFunction) => { try { res.json({ success: true, data: await svc.getAlbumById(req.params.id) }); } catch(e){next(e);} };
