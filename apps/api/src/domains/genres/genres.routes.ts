import { Router } from "express";
import * as controller from "./genres.controller";

export const genresRouter = Router();

genresRouter.get("/", controller.getGenres);
