import fs from "fs";
import path from "path";
import { env } from "../config/env";

export function getAudioPath(filename: string): string {
  return path.join(env.UPLOAD_DIR, "audio", filename);
}

export function getCoverPath(filename: string): string {
  return path.join(env.UPLOAD_DIR, "covers", filename);
}

export function getPublicUrl(type: "audio" | "covers", filename: string): string {
  return `/uploads/${type}/${filename}`;
}

export function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

export function deleteFile(filePath: string): void {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}
