import { create } from "zustand";
import type { Room, RoomParticipant, Song } from "@waifu-player/types";

interface RoomState {
  activeRoom: Room | null;
  participants: RoomParticipant[];
  isHost: boolean;
  currentSong: Song | null;
  isPlaying: boolean;
  position: number;
  setRoom: (room: Room, userId: string) => void;
  leaveRoom: () => void;
  setParticipants: (participants: RoomParticipant[]) => void;
  addParticipant: (participant: RoomParticipant) => void;
  removeParticipant: (userId: string) => void;
  sync: (position: number, isPlaying: boolean) => void;
  setCurrentSong: (song: Song) => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  activeRoom: null,
  participants: [],
  isHost: false,
  currentSong: null,
  isPlaying: false,
  position: 0,

  setRoom: (room, userId) =>
    set({ activeRoom: room, participants: room.participants ?? [], isHost: room.ownerId === userId }),

  leaveRoom: () =>
    set({ activeRoom: null, participants: [], isHost: false, currentSong: null, isPlaying: false, position: 0 }),

  setParticipants: (participants) => set({ participants }),

  addParticipant: (participant) =>
    set((state) => ({
      participants: [...state.participants.filter((p) => p.userId !== participant.userId), participant],
    })),

  removeParticipant: (userId) =>
    set((state) => ({ participants: state.participants.filter((p) => p.userId !== userId) })),

  sync: (position, isPlaying) => set({ position, isPlaying }),

  setCurrentSong: (song) => set({ currentSong: song, position: 0 }),
}));
