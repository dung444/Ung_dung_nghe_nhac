import TrackPlayer, {
  Capability,
  State,
  Event,
  AppKilledPlaybackBehavior,
} from "react-native-track-player";
import type { Song } from "@waifu-player/types";
import { API_BASE_URL } from "../constants/api";

let isPlayerSetup = false;

export async function setupAudioPlayer(): Promise<boolean> {
  if (isPlayerSetup) return true;

  try {
    await TrackPlayer.setupPlayer();
    await TrackPlayer.updateOptions({
      android: {
        appKilledPlaybackBehavior: AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
      },
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
        Capability.SeekTo,
      ],
      compactCapabilities: [Capability.Play, Capability.Pause, Capability.SkipToNext],
      notificationCapabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
      ],
    });
    isPlayerSetup = true;
    return true;
  } catch (error) {
    console.warn("[TrackPlayer] Setup failed or unsupported on current platform:", error);
    return false;
  }
}

export async function playSongOnPlayer(song: Song): Promise<void> {
  try {
    const ready = await setupAudioPlayer();
    if (!ready) return;

    await TrackPlayer.reset();
    const streamUrl = song.fileUrl.startsWith("http")
      ? song.fileUrl
      : `${API_BASE_URL}${song.fileUrl}`;

    await TrackPlayer.add({
      id: song.id,
      url: streamUrl,
      title: song.title,
      artist: song.artists?.map((a) => a.name).join(", ") || "Unknown Artist",
      artwork: song.coverUrl ? (song.coverUrl.startsWith("http") ? song.coverUrl : `${API_BASE_URL}${song.coverUrl}`) : undefined,
      duration: song.duration,
    });

    await TrackPlayer.play();
  } catch (error) {
    console.warn("[TrackPlayer] playSong error:", error);
  }
}

export async function pauseAudio(): Promise<void> {
  try {
    await TrackPlayer.pause();
  } catch (error) {
    console.warn("[TrackPlayer] pause error:", error);
  }
}

export async function resumeAudio(): Promise<void> {
  try {
    await TrackPlayer.play();
  } catch (error) {
    console.warn("[TrackPlayer] resume error:", error);
  }
}

export async function seekToPosition(seconds: number): Promise<void> {
  try {
    await TrackPlayer.seekTo(seconds);
  } catch (error) {
    console.warn("[TrackPlayer] seek error:", error);
  }
}

export async function playbackService() {
  TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
  TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
  TrackPlayer.addEventListener(Event.RemoteNext, () => TrackPlayer.skipToNext());
  TrackPlayer.addEventListener(Event.RemotePrevious, () => TrackPlayer.skipToPrevious());
  TrackPlayer.addEventListener(Event.RemoteSeek, (event) => TrackPlayer.seekTo(event.position));
}
