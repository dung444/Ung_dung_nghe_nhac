import { create } from "zustand";
import type { Song } from "@waifu-player/types";
import { playSongOnPlayer, pauseAudio, resumeAudio } from "../services/audioPlayer";

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

  setCurrentSong: (song) => {
    set({ currentSong: song, isPlaying: true });
    playSongOnPlayer(song).catch(() => {});
  },

  setQueue: (songs, startIndex = 0) => {
    const startSong = songs[startIndex] ?? null;
    set({ queue: songs, currentSong: startSong, isPlaying: songs.length > 0 });
    if (startSong) {
      playSongOnPlayer(startSong).catch(() => {});
    }
  },

  addToQueue: (song) =>
    set((state) => ({ queue: [...state.queue, song] })),

  setPlaying: (playing) => {
    set({ isPlaying: playing });
    if (playing) {
      resumeAudio().catch(() => {});
    } else {
      pauseAudio().catch(() => {});
    }
  },

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
      set({ isPlaying: false });
      pauseAudio().catch(() => {});
      return;
    }
    const nextSong = queue[nextIdx];
    set({ currentSong: nextSong, isPlaying: true });
    playSongOnPlayer(nextSong).catch(() => {});
  },

  playPrev: () => {
    const { queue, currentSong } = get();
    if (!currentSong || queue.length === 0) return;
    const idx = queue.findIndex((s) => s.id === currentSong.id);
    if (idx > 0) {
      const prevSong = queue[idx - 1];
      set({ currentSong: prevSong, isPlaying: true });
      playSongOnPlayer(prevSong).catch(() => {});
    }
  },

  clearQueue: () => {
    pauseAudio().catch(() => {});
    set({ queue: [], currentSong: null, isPlaying: false });
  },
}));

