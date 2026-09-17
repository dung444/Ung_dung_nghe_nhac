import { create } from "zustand";
import type { Song } from "@waifu-player/types";

type RepeatMode = "off" | "track" | "queue";

interface PlayerState {
  currentSong: Song | null;
  queue: Song[];
  isPlaying: boolean;
  repeatMode: RepeatMode;
  shuffleEnabled: boolean;
  // Actions
  setCurrentSong: (song: Song) => void;
  setQueue: (songs: Song[], startIndex?: number) => void;
  addToQueue: (song: Song) => void;
  setPlaying: (playing: boolean) => void;
  setRepeatMode: (mode: RepeatMode) => void;
  toggleShuffle: () => void;
  playNext: () => void;
  playPrev: () => void;
  clearQueue: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentSong: null,
  queue: [],
  isPlaying: false,
  repeatMode: "off",
  shuffleEnabled: false,

  setCurrentSong: (song) => set({ currentSong: song, isPlaying: true }),

  setQueue: (songs, startIndex = 0) =>
    set({ queue: songs, currentSong: songs[startIndex] ?? null, isPlaying: songs.length > 0 }),

  addToQueue: (song) =>
    set((state) => ({ queue: [...state.queue, song] })),

  setPlaying: (playing) => set({ isPlaying: playing }),

  setRepeatMode: (mode) => set({ repeatMode: mode }),

  toggleShuffle: () => set((state) => ({ shuffleEnabled: !state.shuffleEnabled })),

  playNext: () => {
    const { queue, currentSong, repeatMode, shuffleEnabled } = get();
    if (!currentSong || queue.length === 0) return;
    const idx = queue.findIndex((s) => s.id === currentSong.id);
    let nextIdx: number;
    if (shuffleEnabled) {
      nextIdx = Math.floor(Math.random() * queue.length);
    } else if (idx < queue.length - 1) {
      nextIdx = idx + 1;
    } else if (repeatMode === "queue") {
      nextIdx = 0;
    } else {
      set({ isPlaying: false }); return;
    }
    set({ currentSong: queue[nextIdx], isPlaying: true });
  },

  playPrev: () => {
    const { queue, currentSong } = get();
    if (!currentSong || queue.length === 0) return;
    const idx = queue.findIndex((s) => s.id === currentSong.id);
    if (idx > 0) set({ currentSong: queue[idx - 1], isPlaying: true });
  },

  clearQueue: () => set({ queue: [], currentSong: null, isPlaying: false }),
}));
