import { z } from "zod";

// ─── Auth ──────────────────────────────────────────────────────────────────────

export const RegisterSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  username: z
    .string()
    .min(3, "Username tối thiểu 3 ký tự")
    .max(30, "Username tối đa 30 ký tự")
    .regex(/^[a-zA-Z0-9_]+$/, "Username chỉ chứa chữ, số và gạch dưới"),
  password: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự"),
  displayName: z.string().min(1).max(50).optional(),
});

export const LoginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

// ─── Songs ────────────────────────────────────────────────────────────────────

export const CreateSongSchema = z.object({
  title: z.string().min(1, "Tiêu đề không được để trống").max(200),
  duration: z.number().int().positive("Thời lượng phải là số dương (giây)"),
  albumId: z.string().uuid().optional(),
  artistIds: z.array(z.string().uuid()).min(1, "Phải có ít nhất 1 nghệ sĩ"),
  genreIds: z.array(z.string().uuid()).optional().default([]),
  isPublic: z.boolean().optional().default(true),
  releaseDate: z.string().datetime().optional(),
});

export const SearchQuerySchema = z.object({
  q: z.string().min(1, "Từ khóa tìm kiếm không được rỗng").max(200),
  type: z
    .string()
    .optional()
    .transform((v) =>
      v ? (v.split(",") as Array<"song" | "artist" | "album" | "playlist">) : ["song", "artist", "album", "playlist"]
    ),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

// ─── Playlists ────────────────────────────────────────────────────────────────

export const CreatePlaylistSchema = z.object({
  name: z.string().min(1, "Tên playlist không được rỗng").max(100),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().optional().default(true),
});

export const UpdatePlaylistSchema = CreatePlaylistSchema.partial();

export const AddSongToPlaylistSchema = z.object({
  songId: z.string().uuid("Song ID không hợp lệ"),
  position: z.number().int().nonnegative().optional(),
});

export const ReorderPlaylistSchema = z.object({
  orderedSongIds: z.array(z.string().uuid()).min(1),
});

// ─── Artists ──────────────────────────────────────────────────────────────────

export const CreateArtistSchema = z.object({
  name: z.string().min(1).max(200),
  bio: z.string().max(2000).optional(),
});

// ─── Albums ───────────────────────────────────────────────────────────────────

export const CreateAlbumSchema = z.object({
  title: z.string().min(1).max(200),
  artistId: z.string().uuid(),
  releaseDate: z.string().datetime().optional(),
});

// ─── Queue ────────────────────────────────────────────────────────────────────

export const AddToQueueSchema = z.object({
  songId: z.string().uuid(),
  position: z.number().int().nonnegative().optional(),
});

// ─── Pagination ───────────────────────────────────────────────────────────────

export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type CreateSongInput = z.infer<typeof CreateSongSchema>;
export type CreatePlaylistInput = z.infer<typeof CreatePlaylistSchema>;
export type UpdatePlaylistInput = z.infer<typeof UpdatePlaylistSchema>;
export type SearchQueryInput = z.infer<typeof SearchQuerySchema>;
export type CreateArtistInput = z.infer<typeof CreateArtistSchema>;
export type CreateAlbumInput = z.infer<typeof CreateAlbumSchema>;
