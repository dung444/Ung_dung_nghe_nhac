import { Router } from "express";
import { authenticate, requireAdmin } from "../../middleware/auth.middleware";
import * as ctrl from "./copyright.controller";

export const copyrightRouter = Router();

// Public routes
copyrightRouter.get("/licenses",         ctrl.getLicenses);
copyrightRouter.get("/stats",            ctrl.getStats);
copyrightRouter.get("/songs/:songId",    ctrl.getSongCopyright);

// Protected routes (Artists / Users / Admins)
copyrightRouter.put("/songs/:songId",              authenticate, ctrl.upsertSongCopyright);
copyrightRouter.post("/claims",                    authenticate, ctrl.createClaim);
copyrightRouter.get("/claims",                     authenticate, ctrl.getClaims);
copyrightRouter.get("/claims/:claimId",            authenticate, ctrl.getClaimById);
copyrightRouter.patch("/claims/:claimId/review",   authenticate, requireAdmin, ctrl.reviewClaim);
