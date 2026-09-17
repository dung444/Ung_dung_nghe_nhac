import { Request, Response, NextFunction } from "express";
import * as svc from "./artists.service";

export const getArtists    = async (req: Request, res: Response, next: NextFunction) => { try { res.json({ success: true, ...(await svc.getArtists(req.query as any)) }); } catch(e){next(e);} };
export const getArtistById = async (req: Request, res: Response, next: NextFunction) => { try { res.json({ success: true, data: await svc.getArtistById(req.params.id, req.user?.userId) }); } catch(e){next(e);} };
export const getAlbums     = async (req: Request, res: Response, next: NextFunction) => { try { res.json({ success: true, data: await svc.getArtistAlbums(req.params.id) }); } catch(e){next(e);} };
export const getSongs      = async (req: Request, res: Response, next: NextFunction) => { try { res.json({ success: true, data: await svc.getArtistSongs(req.params.id) }); } catch(e){next(e);} };
export const toggleFollow  = async (req: Request, res: Response, next: NextFunction) => { try { res.json({ success: true, data: await svc.toggleFollow(req.params.id, req.user!.userId) }); } catch(e){next(e);} };
