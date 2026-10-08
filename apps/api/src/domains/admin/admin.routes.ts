import { Router } from "express";
import { authenticate, requireAdmin } from "../../middleware/auth.middleware";
import * as ctrl from "./admin.controller";

export const adminRouter = Router();

// All admin endpoints require authentication and ADMIN role
adminRouter.use(authenticate, requireAdmin);

adminRouter.get("/stats", ctrl.getDashboardStats);
adminRouter.get("/users", ctrl.getUsersList);
adminRouter.patch("/users/:id", ctrl.updateUser);
adminRouter.delete("/users/:id", ctrl.deleteUser);
adminRouter.post("/artists", ctrl.createArtist);
adminRouter.post("/genres", ctrl.createGenre);
adminRouter.post("/albums", ctrl.createAlbum);
