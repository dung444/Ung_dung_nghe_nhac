import { useEffect, useRef } from "react";
import { Socket } from "socket.io-client";
import { useAuthStore } from "../store/authStore";
import { useRoomStore } from "../store/roomStore";
import { getRoomSocket } from "../services/socket";

export function useSocket(getSocketFn: () => Socket) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const socketRef = useRef<Socket | null>(null);

  if (!socketRef.current && isAuthenticated) {
    const s = getSocketFn();
    if (accessToken) s.auth = { token: accessToken };
    socketRef.current = s;
  }

  useEffect(() => {
    if (!isAuthenticated) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }
    const socket = socketRef.current || getSocketFn();
    socketRef.current = socket;
    if (accessToken) socket.auth = { token: accessToken };
    if (!socket.connected) socket.connect();
  }, [isAuthenticated, accessToken]);

  return socketRef;
}

export function useRoomSocket(roomId?: string) {
  const socketRef = useSocket(getRoomSocket);
  const sync = useRoomStore((s) => s.sync);
  const setCurrentSong = useRoomStore((s) => s.setCurrentSong);
  const addParticipant = useRoomStore((s) => s.addParticipant);
  const removeParticipant = useRoomStore((s) => s.removeParticipant);
  const leaveRoom = useRoomStore((s) => s.leaveRoom);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    const s = socketRef.current || (isAuthenticated ? getRoomSocket() : null);
    if (!s || !roomId) return;

    if (!s.connected) s.connect();
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
    const handleClosed = () => {
      leaveRoom();
    };

    s.on("room:sync", handleSync);
    s.on("room:track:changed", handleTrackChanged);
    s.on("room:participant:joined", handleJoined);
    s.on("room:participant:left", handleLeft);
    s.on("room:closed", handleClosed);

    return () => {
      s.emit("room:leave", { roomId });
      s.off("room:sync", handleSync);
      s.off("room:track:changed", handleTrackChanged);
      s.off("room:participant:joined", handleJoined);
      s.off("room:participant:left", handleLeft);
      s.off("room:closed", handleClosed);
    };
  }, [roomId, isAuthenticated]);

  return socketRef;
}
