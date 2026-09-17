import { useEffect, useRef } from "react";
import { Socket } from "socket.io-client";
import { useAuthStore } from "../store/authStore";

export function useSocket(getSocketFn: () => Socket) {
  const socketRef = useRef<Socket | null>(null);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;
    const socket = getSocketFn();
    socketRef.current = socket;
    if (!socket.connected) socket.connect();
    return () => { socket.disconnect(); };
  }, [isAuthenticated]);

  return socketRef;
}
