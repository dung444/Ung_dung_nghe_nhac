import { create } from "zustand";
import type { Song } from "@waifu-player/types";
import { playSongOnPlayer, pauseAudio, resumeAudio, seekToPosition, setAudioEventListeners } from "../services/audioPlayer";

type RepeatMode = "off" | "track" | "queue";

interface PlayerState {
  currentSong: Song | null;
  queue: Song[];
  isPlaying: boolean;
  repeatMode: RepeatMode;
  shuffleEnabled: boolean;
  position: number;
  duration: number;
  // Actions
  setCurrentSong: (song: Song) => void;
  setQueue: (songs: Song[], startIndex?: number) => void;
  addToQueue: (song: Song) => void;
  setPlaying: (playing: boolean) => void;
  setRepeatMode: (mode: RepeatMode) => void;
  toggleShuffle: () => void;
  playNext: () => void;
  playPrev: () => void;
  seekTo: (seconds: number) => void;
  clearQueue: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => {
  // Setup listeners from audioPlayer service
  setAudioEventListeners({
    onProgress: (pos, dur) => {
      set((state) => ({
        position: Math.floor(pos),
        duration: dur > 0 ? Math.floor(dur) : state.duration,
      }));
    },
    onEnded: () => {
      const { repeatMode, currentSong, playNext } = get();
      if (repeatMode === "track" && currentSong) {
        set({ position: 0 });
        playSongOnPlayer(currentSong).catch(() => {});
      } else {
        playNext();
      }
    },
  });

  return {
    currentSong: null,
    queue: [],
    isPlaying: false,
    repeatMode: "off",
    shuffleEnabled: false,
    position: 0,
    duration: 0,

    setCurrentSong: (song) => {
      set({ currentSong: song, isPlaying: true, position: 0, duration: song.duration || 0 });
      playSongOnPlayer(song).catch(() => {});
    },

    setQueue: (songs, startIndex = 0) => {
      const startSong = songs[startIndex] ?? null;
      set({
        queue: songs,
        currentSong: startSong,
        isPlaying: songs.length > 0,
        position: 0,
        duration: startSong?.duration || 0,
      });
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

    seekTo: (seconds) => {
      set({ position: seconds });
      seekToPosition(seconds).catch(() => {});
    },

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
        set({ isPlaying: false, position: 0 });
        pauseAudio().catch(() => {});
        return;
      }
      const nextSong = queue[nextIdx];
      set({ currentSong: nextSong, isPlaying: true, position: 0, duration: nextSong.duration || 0 });
      playSongOnPlayer(nextSong).catch(() => {});
    },

    playPrev: () => {
      const { queue, currentSong, position } = get();
      if (!currentSong || queue.length === 0) return;

      // If more than 3 seconds in, replay from beginning
      if (position > 3) {
        set({ position: 0 });
        seekToPosition(0).catch(() => {});
        return;
      }

      const idx = queue.findIndex((s) => s.id === currentSong.id);
      if (idx > 0) {
        const prevSong = queue[idx - 1];
        set({ currentSong: prevSong, isPlaying: true, position: 0, duration: prevSong.duration || 0 });
        playSongOnPlayer(prevSong).catch(() => {});
      } else {
        set({ position: 0 });
        seekToPosition(0).catch(() => {});
      }
    },

    clearQueue: () => {
      pauseAudio().catch(() => {});
      set({ queue: [], currentSong: null, isPlaying: false, position: 0, duration: 0 });
    },
  };
});

