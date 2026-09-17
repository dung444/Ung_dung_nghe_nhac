declare const process: { env: Record<string, string | undefined> };

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";
export const API_V1 = `${API_BASE_URL}/api/v1`;

export const SOCKET_URL = API_BASE_URL;

export const ENDPOINTS = {
  // Auth
  register:      `${API_V1}/auth/register`,
  login:         `${API_V1}/auth/login`,
  refresh:       `${API_V1}/auth/refresh`,
  logout:        `${API_V1}/auth/logout`,
  me:            `${API_V1}/auth/me`,
  // Songs
  songs:         `${API_V1}/songs`,
  song:          (id: string) => `${API_V1}/songs/${id}`,
  streamSong:    (id: string) => `${API_V1}/songs/${id}/stream`,
  likeSong:      (id: string) => `${API_V1}/songs/${id}/like`,
  playSong:      (id: string) => `${API_V1}/songs/${id}/play`,
  relatedSongs:  (id: string) => `${API_V1}/songs/${id}/related`,
  // Artists
  artists:       `${API_V1}/artists`,
  artist:        (id: string) => `${API_V1}/artists/${id}`,
  followArtist:  (id: string) => `${API_V1}/artists/${id}/follow`,
  // Albums
  albums:        `${API_V1}/albums`,
  album:         (id: string) => `${API_V1}/albums/${id}`,
  // Playlists
  playlists:     `${API_V1}/playlists`,
  playlist:      (id: string) => `${API_V1}/playlists/${id}`,
  // Search
  search:        `${API_V1}/search`,
  trending:      `${API_V1}/search/trending`,
  // User
  myHistory:     `${API_V1}/users/me/history`,
  myLiked:       `${API_V1}/users/me/liked`,
  myFollowing:   `${API_V1}/users/me/following`,
  // Queue
  queue:         `${API_V1}/queue`,
  // Rooms
  rooms:         `${API_V1}/rooms`,
  room:          (id: string) => `${API_V1}/rooms/${id}`,
} as const;
