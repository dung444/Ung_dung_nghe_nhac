import { io, Socket } from "socket.io-client";
import { SOCKET_URL } from "../constants/api";

let presenceSocket: Socket | null = null;
let roomSocket: Socket | null = null;
let playlistSocket: Socket | null = null;

function getToken(): string {
  const { useAuthStore } = require("../store/authStore");
  return useAuthStore.getState().accessToken ?? "";
}

export function getPresenceSocket(): Socket {
  if (!presenceSocket) {
    presenceSocket = io(`${SOCKET_URL}/presence`, {
      auth: { token: getToken() },
      transports: ["websocket"],
      autoConnect: false,
    });
  }
  return presenceSocket;
}

export function getRoomSocket(): Socket {
  if (!roomSocket) {
    roomSocket = io(`${SOCKET_URL}/room`, {
      auth: { token: getToken() },
      transports: ["websocket"],
      autoConnect: false,
    });
  }
  return roomSocket;
}

export function getPlaylistSocket(): Socket {
  if (!playlistSocket) {
    playlistSocket = io(`${SOCKET_URL}/playlist`, {
      auth: { token: getToken() },
      transports: ["websocket"],
      autoConnect: false,
    });
  }
  return playlistSocket;
}

export function connectSockets(token: string) {
  [presenceSocket, roomSocket, playlistSocket].forEach((s) => {
    if (s) { s.auth = { token }; s.connect(); }
  });
}

export function disconnectSockets() {
  [presenceSocket, roomSocket, playlistSocket].forEach((s) => s?.disconnect());
  presenceSocket = null; roomSocket = null; playlistSocket = null;
}
