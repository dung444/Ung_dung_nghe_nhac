import { API_BASE_URL } from "../constants/api";

/** Converts API-hosted media paths to absolute URLs for React Native Web. */
export function resolveMediaUrl(value: string | null | undefined): string | null | undefined {
  if (!value || /^https?:\/\//i.test(value) || !value.startsWith("/")) return value;
  return `${API_BASE_URL}${value}`;
}

/**
 * API records can be nested (songs in playlists, rooms, search results, etc.).
 * Normalise local image paths once at the boundary so every screen can render
 * uploads served by the API rather than requesting them from the web dev server.
 */
export function normalizeMediaUrls<T>(value: T): T {
  if (Array.isArray(value)) return value.map(normalizeMediaUrls) as T;
  if (!value || typeof value !== "object") return value;

  const mediaFields = new Set(["coverUrl", "avatarUrl", "imageUrl", "thumbnailUrl"]);
  const record = value as Record<string, unknown>;
  const normalized: Record<string, unknown> = {};

  for (const [key, fieldValue] of Object.entries(record)) {
    normalized[key] = mediaFields.has(key) && typeof fieldValue === "string"
      ? resolveMediaUrl(fieldValue)
      : normalizeMediaUrls(fieldValue);
  }

  return normalized as T;
}
