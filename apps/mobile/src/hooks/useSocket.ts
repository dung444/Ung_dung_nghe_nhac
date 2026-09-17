import { useEffect, useRef } from "react";
import { Socket } from "socket.io-client";
import { useAuthStore } from "../store/authStore";
import { useRoomStore } from "../store/roomStore";
import { getRoomSocket } from "../services/socket";

export function useSocket(getSocketFn: () => Socket) {
  const socketRef = useRef<Socket | null>(null);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;
    const socket = getSocketFn();
    socketRef.current = socket;
    if (!socket.connected) socket.connect();
    return () => {
      socket.disconnect();
    };
  }, [isAuthenticated]);

  return socketRef;
}

export function useRoomSocket(roomId?: string) {
  const socket = useSocket(getRoomSocket);
  const sync = useRoomStore((s) => s.sync);
  const setCurrentSong = useRoomStore((s) => s.setCurrentSong);
  const addParticipant = useRoomStore((s) => s.addParticipant);
  const removeParticipant = useRoomStore((s) => s.removeParticipant);

  useEffect(() => {
    const s = socket.current;
    if (!s || !roomId) return;

    s.emit("room:join", { roomId });

    const handleSync = (data: { position: number; isPlaying: boolean; serverTime: number }) => {
      const latency = (Date.now() - data.serverTime) / 1000;
      const adjustedPosition = data.isPlaying ? data.position + Math.max(0, latency) : data.position;
      sync(adjustedPosition, data.isPlaying);
    };

    const handleTrackChanged = (data: { song: any; position: number }) => {
      if (data.song) setCurrentSong(data.song);
      sync(data.position ?? 0, true);
    };

    const handleJoined = (data: any) => addParticipant(data);
    const handleLeft = (data: { userId: string }) => removeParticipant(data.userId);

    s.on("room:sync", handleSync);
    s.on("room:track:changed", handleTrackChanged);
    s.on("room:participant:joined", handleJoined);
    s.on("room:participant:left", handleLeft);

    return () => {
      s.emit("room:leave", { roomId });
      s.off("room:sync", handleSync);
      s.off("room:track:changed", handleTrackChanged);
      s.off("room:participant:joined", handleJoined);
      s.off("room:participant:left", handleLeft);
    };
  }, [roomId, socket.current]);

  return socket;
}
