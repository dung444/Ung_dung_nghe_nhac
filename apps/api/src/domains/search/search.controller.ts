import { Request, Response, NextFunction } from "express";
import * as svc from "./search.service";
export const search     = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = String(req.query.q ?? "");
    const types = String(req.query.type ?? "song,artist,album,playlist").split(",");
    if (!q) { res.status(400).json({ success: false, error: "Query required" }); return; }
    res.json({ success: true, data: await svc.search(q, types) });
  } catch(e){next(e);}
};
export const trending   = async (_req: Request, res: Response, next: NextFunction) => { try { res.json({ success: true, data: await svc.getTrending() }); } catch(e){next(e);} };
