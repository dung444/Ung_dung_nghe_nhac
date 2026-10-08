import Constants from "expo-constants";
import { Platform } from "react-native";

declare const process: { env: Record<string, string | undefined> };

function resolveApiBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  if (typeof window !== "undefined" && window.location?.hostname) {
    return `http://${window.location.hostname}:3000`;
  }

  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost ||
    (Constants as any).manifest?.debuggerHost;

  if (hostUri) {
    const hostIp = hostUri.split(":")[0];
    if (hostIp && hostIp !== "localhost" && hostIp !== "127.0.0.1") {
      return `http://${hostIp}:3000`;
    }
  }

  // Fallback to active dev machine LAN IP on physical devices
  return Platform.OS === "web" ? "http://localhost:3000" : "http://172.20.10.4:3000";
}

export const API_BASE_URL = resolveApiBaseUrl();
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
  // Copyright & Licensing
  copyrightStats:     `${API_V1}/copyright/stats`,
  copyrightLicenses:  `${API_V1}/copyright/licenses`,
  songCopyright:      (id: string) => `${API_V1}/copyright/songs/${id}`,
  claims:             `${API_V1}/copyright/claims`,
  // Admin Portal
  adminStats:    `${API_V1}/admin/stats`,
  adminUsers:    `${API_V1}/admin/users`,
  adminUser:     (id: string) => `${API_V1}/admin/users/${id}`,
  adminArtists:  `${API_V1}/admin/artists`,
  adminAlbums:   `${API_V1}/admin/albums`,
  // Creator Studio
  creatorStudio: `${API_V1}/creator/studio`,
  creatorRegister: `${API_V1}/creator/register`,
  creatorSongs:  `${API_V1}/creator/songs`,
  creatorSong:   (id: string) => `${API_V1}/creator/songs/${id}`,
  creatorAlbums: `${API_V1}/creator/albums`,
  // Payments & VIP Pass
  vipPackages:   `${API_V1}/payments/packages`,
  topup:         `${API_V1}/payments/topup`,
  buyVip:        `${API_V1}/payments/buy-vip`,
  paymentHistory:`${API_V1}/payments/history`,
  // Gifts & Coins
  gifts:              `${API_V1}/payments/gifts`,
  giftLeaderboard:    `${API_V1}/payments/gifts/leaderboard`,
  sendGift:           `${API_V1}/payments/gifts/send`,
  coinBalance:        `${API_V1}/payments/coins/balance`,
  coinTopup:          `${API_V1}/payments/coins/topup`,
  songGiftStats:      (id: string) => `${API_V1}/payments/gifts/song/${id}`,
  // Payment Orders & Checkout Workflow
  createOrder:        `${API_V1}/payments/orders/create`,
  myOrders:           `${API_V1}/payments/orders`,
  orderDetail:        (id: string) => `${API_V1}/payments/orders/${id}`,
  confirmOrder:       (id: string) => `${API_V1}/payments/orders/${id}/confirm`,
  cancelOrder:        (id: string) => `${API_V1}/payments/orders/${id}/cancel`,
  submitOrderProof:   (id: string) => `${API_V1}/payments/orders/${id}/submit-proof`,
  adminOrders:        `${API_V1}/payments/admin/orders`,
  adminReviewOrder:   (id: string) => `${API_V1}/payments/admin/orders/${id}/review`,
} as const;
