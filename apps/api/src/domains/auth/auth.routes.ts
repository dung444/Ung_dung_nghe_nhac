import { Router } from "express";
import { validate } from "../../middleware/validate.middleware";
import { authenticate } from "../../middleware/auth.middleware";
import { RegisterSchema, LoginSchema } from "@waifu-player/validation";
import * as ctrl from "./auth.controller";

export const authRouter = Router();

authRouter.post("/register", validate(RegisterSchema), ctrl.registerController);
authRouter.post("/login",    validate(LoginSchema),    ctrl.loginController);
authRouter.post("/refresh",                            ctrl.refreshController);
authRouter.post("/logout",                             ctrl.logoutController);
authRouter.get("/me",        authenticate,             ctrl.getMeController);
