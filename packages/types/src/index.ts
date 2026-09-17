// ─── Enums ───────────────────────────────────────────────────────────────────

export type Role = "USER" | "ARTIST" | "ADMIN";

export type NotificationType =
  | "NEW_FOLLOWER"
  | "PLAYLIST_SHARED"
  | "FRIEND_INVITE_ROOM"
  | "SONG_LIKED"
  | "NEW_RELEASE";

// ─── Core Entities ────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  username: string;
  avatarUrl: string | null;
  isPremium: boolean;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface Artist {
  id: string;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  verified: boolean;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
  // Optional joined fields
  followerCount?: number;
  isFollowing?: boolean;
}

export interface Genre {
  id: string;
  name: string;
  slug: string;
}

export interface Album {
  id: string;
  title: string;
  coverUrl: string | null;
  releaseDate: string | null;
  artistId: string;
  artist?: Artist;
  createdAt: string;
  songs?: Song[];
}

export interface Song {
  id: string;
  title: string;
  duration: number; // seconds
  fileUrl: string;
  coverUrl: string | null;
  plays: number;
  isPublic: boolean;
  releaseDate: string | null;
  albumId: string | null;
  album?: Album;
  artists: Artist[];
  genres: Genre[];
  createdAt: string;
  updatedAt: string;
  // Client-side helpers
  isLiked?: boolean;
  streamUrl?: string;
}

// ─── User Interactions ────────────────────────────────────────────────────────

export interface Playlist {
  id: string;
  name: string;
  description: string | null;
  coverUrl: string | null;
  isPublic: boolean;
  userId: string;
  user?: Pick<User, "id" | "username" | "avatarUrl">;
  songs?: PlaylistSong[];
  songCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlaylistSong {
  playlistId: string;
  songId: string;
  position: number;
  addedAt: string;
  song: Song;
}

export interface LikedSong {
  userId: string;
  songId: string;
  likedAt: string;
  song: Song;
}

export interface ListeningHistory {
  id: string;
  userId: string;
  songId: string;
  playedAt: string;
  durationPlayed: number;
  song: Song;
}

export interface QueueItem {
  id: string;
  userId: string;
  songId: string;
  position: number;
  addedAt: string;
  song: Song;
}

// ─── Live Rooms ───────────────────────────────────────────────────────────────

export interface Room {
  id: string;
  name: string;
  isActive: boolean;
  ownerId: string;
  owner?: Pick<User, "id" | "username" | "avatarUrl">;
  currentSongId: string | null;
  currentSong?: Song;
  participants?: RoomParticipant[];
  queue?: RoomQueueItem[];
  createdAt: string;
}

export interface RoomParticipant {
  roomId: string;
  userId: string;
  joinedAt: string;
  user: Pick<User, "id" | "username" | "avatarUrl">;
}

export interface RoomQueueItem {
  id: string;
  roomId: string;
  songId: string;
  position: number;
  addedBy: string;
  song: Song;
}

// ─── Notifications ────────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  actorId: string | null;
  actor?: Pick<User, "id" | "username" | "avatarUrl">;
  payload: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

// ─── API Response Wrappers ────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  details?: unknown;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ─── Socket.io Event Payloads ─────────────────────────────────────────────────

export interface FriendActivityPayload {
  userId: string;
  username: string;
  avatarUrl: string | null;
  action: "playing" | "paused" | "idle";
  song?: Pick<Song, "id" | "title" | "coverUrl" | "artists">;
  timestamp: number;
}

export interface RoomSyncPayload {
  position: number;
  serverTime: number;
  isPlaying: boolean;
}

export interface RoomStatePayload {
  currentSong: Song | null;
  position: number;
  isPlaying: boolean;
  queue: Song[];
  participants: RoomParticipant[];
}
