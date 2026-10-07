import { z } from "zod";

export type Role = "USER" | "ARTIST" | "ADMIN";

export interface AdminDashboardStats {
  totalUsers: number;
  totalVipUsers: number;
  totalArtists: number;
  totalSongs: number;
  totalPlays: number;
  totalAlbums: number;
  totalPlaylists: number;
  totalRooms: number;
  pendingClaims: number;
  totalClaims: number;
  recentUsers: Array<{
    id: string;
    username: string;
    email: string;
    role: Role;
    isPremium: boolean;
    createdAt: string;
  }>;
  recentSongs: Array<{
    id: string;
    title: string;
    playsCount: number;
    createdAt: string;
    artists?: Array<{ id: string; name: string }>;
  }>;
  financialStats?: {
    totalRevenue: number;
    coinRevenue: number;
    vipRevenue: number;
    totalCoinsInSystem: number;
    totalGiftsSent: number;
    totalPayoutsAmount: number;
    netProfit: number;
  };
  topPlayedSongs?: Array<{
    id: string;
    title: string;
    plays: number;
    artistName: string;
    coverUrl?: string | null;
  }>;
  topGiftedSongs?: Array<{
    id: string;
    title: string;
    totalCoins: number;
    giftCount: number;
    artistName: string;
    coverUrl?: string | null;
  }>;
  growthRates?: {
    userGrowth: number;
    streamGrowth: number;
    vipConversionRate: number;
  };
}

export interface AdminUserItem {
  id: string;
  username: string;
  email: string;
  role: Role;
  avatarUrl: string | null;
  isPremium: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    playlists: number;
    history: number;
    likes: number;
  };
}

export const UpdateUserAdminSchema = z.object({
  role: z.enum(["USER", "ARTIST", "ADMIN"]).optional(),
  isPremium: z.boolean().optional(),
});

export type UpdateUserAdminInput = z.infer<typeof UpdateUserAdminSchema>;

export const CreateArtistSchema = z.object({
  name: z.string().min(1, "Tên nghệ sĩ không được để trống").max(100),
  bio: z.string().max(1000).optional(),
});

export type CreateArtistInput = z.infer<typeof CreateArtistSchema>;

export const CreateAlbumSchema = z.object({
  title: z.string().min(1, "Tên album không được để trống").max(200),
  artistId: z.string().uuid("ID nghệ sĩ không hợp lệ"),
  releaseDate: z.string().optional(),
});

export type CreateAlbumInput = z.infer<typeof CreateAlbumSchema>;
