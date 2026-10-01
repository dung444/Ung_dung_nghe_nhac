import { create } from "zustand";
import type { User } from "@waifu-player/types";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  preferredGenres: string[];
  preferredArtists: string[];
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: User | null) => void;
  setPreferences: (genres: string[], artists: string[]) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  preferredGenres: ["Vocaloid", "Anisong", "J-Pop"],
  preferredArtists: [],
  setAuth: (user, accessToken, refreshToken) =>
    set({ user, accessToken, refreshToken, isAuthenticated: true }),
  setTokens: (accessToken, refreshToken) =>
    set({ accessToken, refreshToken }),
  setUser: (user) => set({ user }),
  setPreferences: (preferredGenres, preferredArtists) =>
    set({ preferredGenres, preferredArtists }),
  logout: () =>
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false }),
}));

