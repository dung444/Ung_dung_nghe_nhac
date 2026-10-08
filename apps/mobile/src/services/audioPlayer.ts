import { NativeModules, Platform } from "react-native";
import type { Song } from "@waifu-player/types";
import { API_BASE_URL } from "../constants/api";

const isTrackPlayerAvailable = !!NativeModules.TrackPlayerModule;

let TrackPlayer: any = null;
let Capability: any = {};
let AppKilledPlaybackBehavior: any = {};
let Event: any = {};

if (isTrackPlayerAvailable) {
  try {
    const RNTP = require("react-native-track-player");
    TrackPlayer = RNTP.default;
    Capability = RNTP.Capability;
    AppKilledPlaybackBehavior = RNTP.AppKilledPlaybackBehavior;
    Event = RNTP.Event;
  } catch {
    console.warn("[TrackPlayer] Could not load native TrackPlayer module.");
  }
}

// Safely load expo-av dynamically to prevent crashing on clients where ExponentAV is missing (e.g. Expo Go iOS)
let ExpoAudio: any = null;
try {
  const av = require("expo-av");
  if (av?.Audio) {
    ExpoAudio = av.Audio;
  }
} catch {
  // ExponentAV native module is not bundled in this client
}

// Expo Go uses expo-av if available; HTML5 Audio remains the browser fallback.
let expoSound: any = null;
let webAudio: HTMLAudioElement | null = null;
let currentVolume = 1.0;
let currentRate = 1.0;
let isPlayerSetup = false;

type AudioEventCallbacks = {
  onProgress?: (position: number, duration: number) => void;
  onEnded?: () => void;
};

let eventCallbacks: AudioEventCallbacks = {};

export function setAudioEventListeners(callbacks: AudioEventCallbacks) {
  eventCallbacks = { ...eventCallbacks, ...callbacks };
}

export async function setupAudioPlayer(): Promise<boolean> {
  if (isPlayerSetup) return true;

  if (isTrackPlayerAvailable && TrackPlayer) {
    try {
      await TrackPlayer.setupPlayer();
      await TrackPlayer.updateOptions({
        android: {
          appKilledPlaybackBehavior: AppKilledPlaybackBehavior?.StopPlaybackAndRemoveNotification,
        },
        capabilities: [
          Capability?.Play,
          Capability?.Pause,
          Capability?.SkipToNext,
          Capability?.SkipToPrevious,
          Capability?.SeekTo,
        ],
        compactCapabilities: [Capability?.Play, Capability?.Pause, Capability?.SkipToNext],
        notificationCapabilities: [
          Capability?.Play,
          Capability?.Pause,
          Capability?.SkipToNext,
          Capability?.SkipToPrevious,
        ],
      });

      if (Event) {
        TrackPlayer.addEventListener(Event.PlaybackProgressUpdated, (data: any) => {
          eventCallbacks.onProgress?.(data.position, data.duration);
        });
        TrackPlayer.addEventListener(Event.PlaybackQueueEnded, () => {
          eventCallbacks.onEnded?.();
        });
      }

      isPlayerSetup = true;
      return true;
    } catch (error) {
      console.warn("[TrackPlayer] Setup failed on current platform:", error);
    }
  }

  isPlayerSetup = true;
  return true;
}

export async function playSongOnPlayer(song: Song): Promise<void> {
  try {
    if (!song || !song.fileUrl) {
      console.warn("[playSongOnPlayer] Missing song or song.fileUrl");
      return;
    }
    const ready = await setupAudioPlayer();
    if (!ready) return;

    const streamUrl = song.fileUrl.startsWith("http")
      ? song.fileUrl
      : `${API_BASE_URL}${song.fileUrl.startsWith("/") ? "" : "/"}${song.fileUrl}`;

    // 1. Production Native Player (react-native-track-player)
    if (isTrackPlayerAvailable && TrackPlayer) {
      await TrackPlayer.reset();
      await TrackPlayer.add({
        id: song.id,
        url: streamUrl,
        title: song.title,
        artist: song.artists?.map((a: any) => a.name).join(", ") || "Unknown Artist",
        artwork: song.coverUrl ? (song.coverUrl.startsWith("http") ? song.coverUrl : `${API_BASE_URL}${song.coverUrl}`) : undefined,
        duration: song.duration,
      });
      await TrackPlayer.play();
      return;
    }

    // 2. Mobile Player with Expo Audio (if native module ExponentAV is present)
    if (Platform.OS !== "web" && ExpoAudio?.Sound) {
      try {
        if (expoSound) {
          try {
            await expoSound.unloadAsync();
          } catch {}
          expoSound = null;
        }
        await ExpoAudio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
        });
        const { sound } = await ExpoAudio.Sound.createAsync(
          { uri: streamUrl },
          { shouldPlay: true, volume: currentVolume, rate: currentRate },
          (status: any) => {
            if (status?.isLoaded) {
              eventCallbacks.onProgress?.(
                status.positionMillis / 1000,
                (status.durationMillis || song.duration * 1000) / 1000
              );
              if (status.didJustFinish) {
                eventCallbacks.onEnded?.();
              }
            }
          }
        );
        expoSound = sound;
        return;
      } catch (error) {
        console.warn("[ExpoAudio] Error playing stream:", error);
      }
    }

    // 3. Web Player (HTML5 Audio)
    if (typeof window !== "undefined" && typeof Audio !== "undefined") {
      if (webAudio) {
        try {
          webAudio.pause();
          webAudio.removeAttribute("src");
          webAudio.load();
        } catch {}
        webAudio.ontimeupdate = null;
        webAudio.onended = null;
        webAudio.onerror = null;
      }
      webAudio = new Audio(streamUrl);
      webAudio.volume = currentVolume;
      webAudio.playbackRate = currentRate;
      webAudio.ontimeupdate = () => {
        if (webAudio) {
          eventCallbacks.onProgress?.(webAudio.currentTime, webAudio.duration || song.duration);
        }
      };
      webAudio.onended = () => {
        eventCallbacks.onEnded?.();
      };
      webAudio.onerror = (e) => {
        console.warn("[WebAudio] Audio failed to load:", streamUrl, e);
        try {
          const { useToastStore } = require("../store/toastStore");
          useToastStore.getState().showError(
            "Lỗi tải bài hát",
            `Không thể tải luồng phát cho bài hát "${song.title}". Vui lòng thử lại sau.`
          );
        } catch {}
      };
      webAudio.play().catch((e) => {
        console.warn("[WebAudio] Playback error (may require user interaction):", e);
      });
    }
  } catch (error: any) {
    console.warn("[audioPlayer] playSong error:", error);
    try {
      const { useToastStore } = require("../store/toastStore");
      useToastStore.getState().showError("Lỗi hệ thống âm thanh", error?.message || "Không thể phát bài hát.");
    } catch {}
  }
}

export async function pauseAudio(): Promise<void> {
  try {
    if (isTrackPlayerAvailable && TrackPlayer) {
      await TrackPlayer.pause();
    } else if (expoSound) {
      try {
        await expoSound.pauseAsync();
      } catch {}
    } else if (webAudio) {
      webAudio.pause();
    }
  } catch (error) {
    console.warn("[audioPlayer] pause error:", error);
  }
}

export async function resumeAudio(): Promise<void> {
  try {
    if (isTrackPlayerAvailable && TrackPlayer) {
      await TrackPlayer.play();
    } else if (expoSound) {
      try {
        await expoSound.playAsync();
      } catch {}
    } else if (webAudio) {
      webAudio.play().catch(() => {});
    }
  } catch (error) {
    console.warn("[audioPlayer] resume error:", error);
  }
}

export async function seekToPosition(seconds: number): Promise<void> {
  try {
    if (isTrackPlayerAvailable && TrackPlayer) {
      await TrackPlayer.seekTo(seconds);
    } else if (expoSound) {
      try {
        await expoSound.setPositionAsync(seconds * 1000);
      } catch {}
    } else if (webAudio) {
      webAudio.currentTime = seconds;
    }
    eventCallbacks.onProgress?.(seconds, webAudio?.duration || 0);
  } catch (error) {
    console.warn("[audioPlayer] seek error:", error);
  }
}

export async function setAudioVolume(volume: number): Promise<void> {
  try {
    const clamped = Math.max(0, Math.min(1, volume));
    currentVolume = clamped;
    if (isTrackPlayerAvailable && TrackPlayer) {
      await TrackPlayer.setVolume(clamped);
    } else if (expoSound) {
      try {
        await expoSound.setVolumeAsync(clamped);
      } catch {}
    } else if (webAudio) {
      webAudio.volume = clamped;
    }
  } catch (error) {
    console.warn("[audioPlayer] setVolume error:", error);
  }
}

export async function setPlaybackRate(rate: number): Promise<void> {
  try {
    currentRate = rate;
    if (isTrackPlayerAvailable && TrackPlayer) {
      await TrackPlayer.setRate(rate);
    } else if (expoSound) {
      try {
        await expoSound.setRateAsync(rate, true);
      } catch {}
    } else if (webAudio) {
      webAudio.playbackRate = rate;
    }
  } catch (error) {
    console.warn("[audioPlayer] setRate error:", error);
  }
}

export async function playbackService() {
  if (isTrackPlayerAvailable && TrackPlayer && Event) {
    TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
    TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
    TrackPlayer.addEventListener(Event.RemoteNext, () => TrackPlayer.skipToNext());
    TrackPlayer.addEventListener(Event.RemotePrevious, () => TrackPlayer.skipToPrevious());
    TrackPlayer.addEventListener(Event.RemoteSeek, (event: any) => TrackPlayer.seekTo(event.position));
  }
}
