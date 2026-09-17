import { NativeModules } from "react-native";
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

// Fallback HTML5 audio element for Web & Expo Go preview
let webAudio: HTMLAudioElement | null = null;
let isPlayerSetup = false;

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
    const ready = await setupAudioPlayer();
    if (!ready) return;

    const streamUrl = song.fileUrl.startsWith("http")
      ? song.fileUrl
      : `${API_BASE_URL}${song.fileUrl}`;

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
    } else if (typeof window !== "undefined" && typeof Audio !== "undefined") {
      if (webAudio) {
        webAudio.pause();
      }
      webAudio = new Audio(streamUrl);
      webAudio.play().catch((e) => console.warn("[WebAudio] Playback error:", e));
    }
  } catch (error) {
    console.warn("[audioPlayer] playSong error:", error);
  }
}

export async function pauseAudio(): Promise<void> {
  try {
    if (isTrackPlayerAvailable && TrackPlayer) {
      await TrackPlayer.pause();
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
    } else if (webAudio) {
      webAudio.currentTime = seconds;
    }
  } catch (error) {
    console.warn("[audioPlayer] seek error:", error);
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
