import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
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

const hybridStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      if (Platform.OS === "web") {
        return typeof window !== "undefined" && window.localStorage
          ? window.localStorage.getItem(name)
          : null;
      }
      return await AsyncStorage.getItem(name);
    } catch {}
    return null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      if (Platform.OS === "web") {
        if (typeof window !== "undefined" && window.localStorage) {
          window.localStorage.setItem(name, value);
        }
      } else {
        await AsyncStorage.setItem(name, value);
      }
    } catch {}
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      if (Platform.OS === "web") {
        if (typeof window !== "undefined" && window.localStorage) {
          window.localStorage.removeItem(name);
        }
      } else {
        await AsyncStorage.removeItem(name);
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
      name: "waifu-auth-storage",
      storage: createJSONStorage(() => hybridStorage),
    }
  )
);

