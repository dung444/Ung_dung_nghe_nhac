import { Router } from "express";
import * as ctrl from "./search.controller";
export const searchRouter = Router();
searchRouter.get("/",         ctrl.search);
searchRouter.get("/trending", ctrl.trending);
