import { create } from "zustand";
import type { Song } from "@waifu-player/types";
import {
  playSongOnPlayer,
  pauseAudio,
  resumeAudio,
  seekToPosition,
  setAudioEventListeners,
} from "../services/audioPlayer";

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

function notifyPresenceAndRecordPlay(song: Song) {
  try {
    const { api } = require("../services/api");
    api.post(`/api/v1/songs/${song.id}/play`).catch(() => {});
  } catch {}

  try {
    const { getPresenceSocket } = require("../services/socket");
    const artistName = song.artists?.map((a: any) => a.name).join(", ") || "";
    getPresenceSocket().emit("user:playing", {
      songId: song.id,
      songTitle: song.title,
      artistName,
      coverUrl: song.coverUrl,
    });
  } catch {}
}

function notifyPresencePaused() {
  try {
    const { getPresenceSocket } = require("../services/socket");
    getPresenceSocket().emit("user:paused");
  } catch {}
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
        notifyPresenceAndRecordPlay(currentSong);
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
      notifyPresenceAndRecordPlay(song);
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
        notifyPresenceAndRecordPlay(startSong);
      }
      // Sync queue to backend if authenticated
      try {
        const { api } = require("../services/api");
        api.post("/api/v1/queue", { songIds: songs.map((s) => s.id) }).catch(() => {});
      } catch {}
    },

    addToQueue: (song) =>
      set((state) => {
        const newQueue = [...state.queue, song];
        try {
          const { api } = require("../services/api");
          api.post("/api/v1/queue/add", { songId: song.id }).catch(() => {});
        } catch {}
        return { queue: newQueue };
      }),

    setPlaying: (playing) => {
      set({ isPlaying: playing });
      if (playing) {
        resumeAudio().catch(() => {});
        const current = get().currentSong;
        if (current) notifyPresenceAndRecordPlay(current);
      } else {
        pauseAudio().catch(() => {});
        notifyPresencePaused();
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
        notifyPresencePaused();
        return;
      }
      const nextSong = queue[nextIdx];
      set({ currentSong: nextSong, isPlaying: true, position: 0, duration: nextSong.duration || 0 });
      playSongOnPlayer(nextSong).catch(() => {});
      notifyPresenceAndRecordPlay(nextSong);
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
        notifyPresenceAndRecordPlay(prevSong);
      } else {
        set({ position: 0 });
        seekToPosition(0).catch(() => {});
      }
    },

    clearQueue: () => {
      pauseAudio().catch(() => {});
      notifyPresencePaused();
      set({ queue: [], currentSong: null, isPlaying: false, position: 0, duration: 0 });
      try {
        const { api } = require("../services/api");
        api.delete("/api/v1/queue/clear").catch(() => {});
      } catch {}
    },
  };
});
