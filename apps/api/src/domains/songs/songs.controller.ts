import { Request, Response, NextFunction } from "express";
import * as songsService from "./songs.service";

export async function getSongs(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await songsService.getSongs(req.query as any);
    res.json({ success: true, data: result.songs, pagination: result.pagination });
  } catch (err) { next(err); }
}

export async function getSongById(req: Request, res: Response, next: NextFunction) {
  try {
    const song = await songsService.getSongById(req.params.id);
    res.json({ success: true, data: song });
  } catch (err) { next(err); }
}

export async function streamSong(req: Request, res: Response, next: NextFunction) {
  try {
    await songsService.streamSong(req.params.id, req.headers.range, res);
  } catch (err) { next(err); }
}

export async function recordPlay(req: Request, res: Response, next: NextFunction) {
  try {
    await songsService.recordPlay(req.params.id, req.user!.userId);
    res.json({ success: true });
  } catch (err) { next(err); }
}

export async function toggleLike(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await songsService.toggleLike(req.params.id, req.user!.userId);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function createSong(req: Request, res: Response, next: NextFunction) {
  try {
    const fileUrl = req.file ? `/uploads/audio/${req.file.filename}` : req.body.fileUrl;
    if (!fileUrl) {
      res.status(400).json({ success: false, error: "Audio file is required" });
      return;
    }
    const duration = Number(req.body.duration) || 0;
    let artistIds = req.body.artistIds;
    if (typeof artistIds === "string") {
      try { artistIds = JSON.parse(artistIds); } catch { artistIds = [artistIds]; }
    }
    const song = await songsService.createSong({ ...req.body, duration, artistIds, fileUrl });
    res.status(201).json({ success: true, data: song });
  } catch (err) { next(err); }
}

export async function deleteSong(req: Request, res: Response, next: NextFunction) {
  try {
    await songsService.deleteSong(req.params.id);
    res.json({ success: true, message: "Song deleted" });
  } catch (err) { next(err); }
}

export async function getRelatedSongs(req: Request, res: Response, next: NextFunction) {
  try {
    const songs = await songsService.getRelatedSongs(req.params.id);
    res.json({ success: true, data: songs });
  } catch (err) { next(err); }
}
