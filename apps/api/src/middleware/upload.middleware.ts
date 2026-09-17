import multer from "multer";
import path from "path";
import { env } from "../config/env";
import { AppError } from "./error.middleware";

const audioStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(env.UPLOAD_DIR, "audio")),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const coverStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(env.UPLOAD_DIR, "covers")),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

export const uploadAudio = multer({
  storage: audioStorage,
  limits: { fileSize: (env.MAX_AUDIO_SIZE_MB ?? 50) * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [".mp3", ".wav", ".flac", ".ogg", ".m4a"];
    if (!allowed.includes(path.extname(file.originalname).toLowerCase())) {
      return cb(new AppError("Only audio files are allowed", 400));
    }
    cb(null, true);
  },
});

export const uploadCover = multer({
  storage: coverStorage,
  limits: { fileSize: (env.MAX_COVER_SIZE_MB ?? 5) * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
    if (!allowed.includes(path.extname(file.originalname).toLowerCase())) {
      return cb(new AppError("Only image files are allowed", 400));
    }
    cb(null, true);
  },
});
