import { Request, Response, NextFunction } from "express";
import * as service from "./genres.service";

export async function getGenres(_req: Request, res: Response, next: NextFunction) {
  try {
    const genres = await service.getGenres();
    res.json({ success: true, data: genres });
  } catch (error) {
    next(error);
  }
}
