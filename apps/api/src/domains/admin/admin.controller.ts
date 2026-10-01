import { Request, Response, NextFunction } from "express";
import * as service from "./admin.service";
import {
  UpdateUserAdminSchema,
  CreateArtistSchema,
  CreateAlbumSchema,
} from "@waifu-player/validation";

export async function getDashboardStats(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const stats = await service.getDashboardStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
}

export async function getUsersList(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const search = req.query.search ? String(req.query.search) : undefined;
    const role = req.query.role ? String(req.query.role) : undefined;
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 20;

    const result = await service.getUsersList({ search, role, page, limit });
    res.json({
      success: true,
      data: result.users,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = UpdateUserAdminSchema.parse(req.body);
    const updated = await service.updateUser(
      req.params.id,
      parsed,
      req.user!.userId
    );
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
}

export async function deleteUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await service.deleteUser(req.params.id, req.user!.userId);
    res.json({ success: true, message: result.message });
  } catch (error) {
    next(error);
  }
}

export async function createArtist(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = CreateArtistSchema.parse(req.body);
    const artist = await service.createArtist(parsed);
    res.status(201).json({ success: true, data: artist });
  } catch (error) {
    next(error);
  }
}

export async function createAlbum(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = CreateAlbumSchema.parse(req.body);
    const album = await service.createAlbum(parsed);
    res.status(201).json({ success: true, data: album });
  } catch (error) {
    next(error);
  }
}
