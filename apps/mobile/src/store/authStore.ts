import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
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

const customStorage = {
  getItem: (name: string): string | null => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        return window.localStorage.getItem(name);
      }
    } catch {}
    return null;
  },
  setItem: (name: string, value: string): void => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(name, value);
      }
    } catch {}
  },
  removeItem: (name: string): void => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem(name);
      }
    } catch {}
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
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
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setPreferences: (preferredGenres, preferredArtists) =>
        set({ preferredGenres, preferredArtists }),
      logout: () =>
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false }),
    }),
    {
      name: "waifu-player-auth",
      storage: createJSONStorage(() => customStorage),
    }
  )
);

