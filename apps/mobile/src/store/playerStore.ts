import { create } from "zustand";
import type { Song } from "@waifu-player/types";
import {
  playSongOnPlayer,
  pauseAudio,
  resumeAudio,
  seekToPosition,
  setAudioEventListeners,
  setAudioVolume,
  setPlaybackRate,
} from "../services/audioPlayer";

type RepeatMode = "off" | "track" | "queue";

let sleepTimerId: any = null;

interface PlayerState {
  currentSong: Song | null;
  queue: Song[];
  isPlaying: boolean;
  repeatMode: RepeatMode;
  shuffleEnabled: boolean;
  position: number;
  duration: number;
  volume: number; // 0.0 to 1.0
  isMuted: boolean;
  playbackRate: number; // 0.5, 0.75, 1.0, 1.25, 1.5, 2.0
  sleepTimerMinutes: number | null;
  sleepTimerEndTime: number | null; // Timestamp ms
  // Actions
  setCurrentSong: (song: Song) => void;
  setQueue: (songs: Song[], startIndex?: number) => void;
  addToQueue: (song: Song) => void;
  addPlayNext: (song: Song) => void;
  setPlaying: (playing: boolean) => void;
  setRepeatMode: (mode: RepeatMode) => void;
  toggleShuffle: () => void;
  playNext: () => void;
  playPrev: () => void;
  seekTo: (seconds: number) => void;
  clearQueue: () => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setRate: (rate: number) => void;
  setSleepTimer: (minutes: number | null) => void;
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
    volume: 1.0,
    isMuted: false,
    playbackRate: 1.0,
    sleepTimerMinutes: null,
    sleepTimerEndTime: null,

    setCurrentSong: (song) => {
      const { currentSong, isPlaying } = get();
      // Nếu bài hát đang chọn chính là bài đang nghe: giữ nguyên tiến trình phát, không reset về 0
      if (currentSong?.id === song.id) {
        if (!isPlaying) {
          get().setPlaying(true);
        }
        return;
      }
      set({ currentSong: song, isPlaying: true, position: 0, duration: song.duration || 0 });
      playSongOnPlayer(song).catch(() => {});
      notifyPresenceAndRecordPlay(song);
    },

    setQueue: (songs, startIndex = 0) => {
      const startSong = songs[startIndex] ?? null;
      const { currentSong, isPlaying } = get();
      // Nếu bài bắt đầu chính là bài đang nghe: giữ nguyên tiến trình phát của bài, chỉ cập nhật hàng đợi
      if (startSong && currentSong?.id === startSong.id) {
        set({ queue: songs });
        if (!isPlaying) {
          get().setPlaying(true);
        }
        return;
      }
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

    addToQueue: (song) => {
      set((state) => {
        const newQueue = [...state.queue, song];
        try {
          const { api } = require("../services/api");
          api.post("/api/v1/queue/add", { songId: song.id }).catch(() => {});
        } catch {}
        try {
          const { useToastStore } = require("./toastStore");
          useToastStore.getState().showSuccess("Đã thêm phát sau", `Đã thêm "${song.title}" vào danh sách phát sau ✨`);
        } catch {}
        if (!state.currentSong) {
          return { queue: newQueue, currentSong: song };
        }
        return { queue: newQueue };
      });
    },

    addPlayNext: (song) => {
      set((state) => {
        if (!state.currentSong) {
          try {
            const { useToastStore } = require("./toastStore");
            useToastStore.getState().showSuccess("Đang phát bài hát", `Bắt đầu phát "${song.title}" 🎶`);
          } catch {}
          return { queue: [song], currentSong: song, isPlaying: true };
        }
        const idx = state.queue.findIndex((s) => s.id === state.currentSong?.id);
        const newQueue = [...state.queue];
        if (idx !== -1) {
          newQueue.splice(idx + 1, 0, song);
        } else {
          newQueue.push(song);
        }
        try {
          const { useToastStore } = require("./toastStore");
          useToastStore.getState().showSuccess("Phát kế tiếp 🎶", `Sẽ phát "${song.title}" ngay sau bài hát này.`);
        } catch {}
        return { queue: newQueue };
      });
    },

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

    setRepeatMode: (mode) => {
      set({ repeatMode: mode });
      try {
        const { useToastStore } = require("./toastStore");
        const msg =
          mode === "track"
            ? "Lặp lại bài hát hiện tại 🔂"
            : mode === "queue"
            ? "Lặp lại toàn bộ danh sách phát 🔁"
            : "Đã tắt chế độ lặp lại";
        useToastStore.getState().showInfo("Chế độ lặp lại", msg);
      } catch {}
    },

    toggleShuffle: () => {
      const next = !get().shuffleEnabled;
      set({ shuffleEnabled: next });
      try {
        const { useToastStore } = require("./toastStore");
        useToastStore.getState().showInfo("Phát ngẫu nhiên", next ? "Đã bật phát ngẫu nhiên 🔀" : "Đã tắt phát ngẫu nhiên");
      } catch {}
    },

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

    setVolume: (vol) => {
      const clamped = Math.max(0, Math.min(1, vol));
      set({ volume: clamped, isMuted: clamped === 0 });
      setAudioVolume(clamped).catch(() => {});
    },

    toggleMute: () => {
      const { isMuted, volume } = get();
      if (isMuted) {
        const newVol = volume === 0 ? 0.8 : volume;
        set({ isMuted: false, volume: newVol });
        setAudioVolume(newVol).catch(() => {});
      } else {
        set({ isMuted: true });
        setAudioVolume(0).catch(() => {});
      }
    },

    setRate: (rate) => {
      set({ playbackRate: rate });
      setPlaybackRate(rate).catch(() => {});
      try {
        const { useToastStore } = require("./toastStore");
        useToastStore
          .getState()
          .showInfo(
            "Tốc độ phát nhạc ⚡",
            rate === 1.25 ? "Đã chuyển sang chế độ Nightcore (1.25x)" : `Đã chuyển sang tốc độ ${rate}x`
          );
      } catch {}
    },

    setSleepTimer: (minutes) => {
      if (sleepTimerId) {
        clearTimeout(sleepTimerId);
        sleepTimerId = null;
      }
      if (minutes === null || minutes <= 0) {
        set({ sleepTimerMinutes: null, sleepTimerEndTime: null });
        try {
          const { useToastStore } = require("./toastStore");
          useToastStore.getState().showInfo("Hẹn giờ tắt nhạc 🌙", "Đã hủy hẹn giờ tắt nhạc.");
        } catch {}
        return;
      }

      const endTime = Date.now() + minutes * 60 * 1000;
      set({ sleepTimerMinutes: minutes, sleepTimerEndTime: endTime });
      try {
        const { useToastStore } = require("./toastStore");
        useToastStore
          .getState()
          .showInfo("Hẹn giờ tắt nhạc 🌙", `Nhạc sẽ tự động dừng sau ${minutes} phút nữa.`);
      } catch {}

      sleepTimerId = setTimeout(() => {
        get().setPlaying(false);
        set({ sleepTimerMinutes: null, sleepTimerEndTime: null });
        sleepTimerId = null;
        try {
          const { useToastStore } = require("./toastStore");
          useToastStore
            .getState()
            .showInfo("Hẹn giờ hoàn tất 🌙", "Trình phát đã dừng nhạc theo thời gian hẹn giờ.");
        } catch {}
      }, minutes * 60 * 1000);
    },
  };
});

