import { Request, Response, NextFunction } from "express";
import * as svc from "./creator.service";

export const getStudio = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await svc.getCreatorStudio(req.user!.userId);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

export const registerCreator = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await svc.getOrCreateCreatorProfile(req.user!.userId, req.body);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

export const getMySongs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await svc.getCreatorSongs(req.user!.userId);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

export const publishSong = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const fileUrl = req.file ? `/uploads/audio/${req.file.filename}` : req.body.fileUrl;
    const song = await svc.createCreatorSong(req.user!.userId, {
      ...req.body,
      fileUrl,
    });
    res.status(201).json({ success: true, data: song });
  } catch (e) {
    next(e);
  }
};

export const deleteSong = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await svc.deleteCreatorSong(req.user!.userId, req.params.id);
    res.json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
};

export const createAlbum = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const album = await svc.createCreatorAlbum(req.user!.userId, req.body);
    res.status(201).json({ success: true, data: album });
  } catch (e) {
    next(e);
  }
};

export const uploadAudioFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: "No audio file uploaded" });
      return;
    }
    const url = `/uploads/audio/${req.file.filename}`;
    res.json({ success: true, data: { url, filename: req.file.originalname, size: req.file.size } });
  } catch (e) {
    next(e);
  }
};

export const uploadCoverFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: "No image file uploaded" });
      return;
    }
    const url = `/uploads/covers/${req.file.filename}`;
    res.json({ success: true, data: { url, filename: req.file.originalname, size: req.file.size } });
  } catch (e) {
    next(e);
  }
};
