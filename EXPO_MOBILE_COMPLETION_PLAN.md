# 📱 KẾ HOẠCH HOÀN THIỆN ỨNG DỤNG EXPO & MOBILE (EXPO MOBILE COMPLETION PLAN)

> **Tài liệu hướng dẫn triển khai kỹ thuật chi tiết dành cho Codex**  
> **Dự án**: Waifu Player Monorepo (`apps/mobile` + `apps/api`)  
> **Mục tiêu**: Đưa ứng dụng từ trạng thái chỉ chạy trên trình duyệt Web sang trạng thái hoàn thiện 100% trên **Expo Mobile (Android, iOS, Expo Go & Bản build độc lập APK)**.

---

## 🏛️ LAYER 0: NGUYÊN TẮC THỰC THI (CONSTRAINTS FOR CODEX)
1. **Giữ nguyên kiến trúc Monorepo**: Chỉ thực hiện thay đổi tại `apps/mobile`, không làm ảnh hưởng đến `apps/api` hay các package dùng chung trừ khi cần bổ sung type.
2. **Khả năng tương thích chéo (Cross-Platform)**: Mọi sửa đổi phải hoạt động mượt mà trên cả 3 môi trường:
   - **Expo Web** (Trình duyệt máy tính: `localhost:8081`)
   - **Expo Go** (Điện thoại thật quét mã QR trên mạng nội bộ LAN / Tunnel)
   - **EAS / Prebuild Standalone App** (File APK Android / IPA iOS).
3. **Type Safety & Build Clean**: Sau khi sửa, chạy `npm --prefix apps/mobile run test` (`tsc --noEmit`) phải đạt 100% không có lỗi TypeScript.

---

## 📦 BƯỚC 0: CÀI ĐẶT CÁC THƯ THIỆN CHUẨN CỦA EXPO

Chạy lệnh cài đặt từ thư mục gốc của monorepo:

```bash
# Cài đặt qua pnpm hoặc npx expo install tại thư mục apps/mobile
pnpm --filter @waifu-player/mobile add @react-native-async-storage/async-storage expo-image-picker expo-document-picker expo-av
```
*(Nếu dùng npm: `npm --prefix apps/mobile install @react-native-async-storage/async-storage expo-image-picker expo-document-picker expo-av`)*

---

## 📌 TASK 1: Tự Động Hóa Nhận Diện IP Máy Chủ Backend (Dynamic Server Host IP)

### 1. Vị trí file
- `apps/mobile/src/constants/api.ts`

### 2. Vấn đề hiện tại
- File đang hardcode fallback IP `192.168.1.4:3000`. Khi điện thoại di động quét mã QR qua Expo Go trong mạng LAN khác hoặc dùng mạng 4G/Hotspot, điện thoại không thể kết nối tới máy tính dev $\rightarrow$ Bị lỗi `Network Error` và sập toàn bộ request API.

### 3. Giải pháp & Mã triển khai
- Sử dụng `Constants.expoConfig?.hostUri` từ package `expo-constants` (đã có sẵn trong Expo SDK) để tự động bóc tách IP của máy tính đang chạy Metro Bundler.

```typescript
import Constants from "expo-constants";

declare const process: { env: Record<string, string | undefined> };

function resolveApiBaseUrl(): string {
  // 1. Ưu tiên biến môi trường cấu hình tường minh
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // 2. Môi trường Web browser: Dùng hostname hiện tại của trình duyệt
  if (typeof window !== "undefined" && window.location?.hostname) {
    return `http://${window.location.hostname}:3000`;
  }

  // 3. Môi trường Mobile (Expo Go / Dev Client): Tự động lấy IP từ Metro hostUri
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const hostIp = hostUri.split(":")[0];
    if (hostIp) {
      return `http://${hostIp}:3000`;
    }
  }

  // 4. Fallback mặc định
  return "http://localhost:3000";
}

export const API_BASE_URL = resolveApiBaseUrl();
export const API_V1 = `${API_BASE_URL}/api/v1`;
export const SOCKET_URL = API_BASE_URL;
```

---

## 📌 TASK 2: Lưu Trữ Phiên Đăng Nhập Đa Nền Tảng (Cross-Platform Auth Storage)

### 1. Vị trí files
- `apps/mobile/src/store/authStore.ts`
- `apps/mobile/src/app/(tabs)/profile.tsx`

### 2. Vấn đề hiện tại
- `authStore.ts` dùng `customStorage` bọc `window.localStorage`.
- Trên React Native Android/iOS, `window.localStorage` là `undefined` $\rightarrow$ Storage luôn trả về `null`.
- Người dùng đăng nhập trên điện thoại, khi thoát app hoặc tải lại sẽ **bị đăng xuất ngay lập tức**, mất toàn bộ trạng thái VIP và thông tin cá nhân.

### 3. Giải pháp & Mã triển khai
- Tích hợp `@react-native-async-storage/async-storage` làm Storage Engine cho Zustand.
- Cập nhật `customStorage` để tự động chuyển đổi giữa `AsyncStorage` (trên Mobile) và `localStorage` (trên Web):

```typescript
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import type { User } from "@waifu-player/types";

// Hybrid Storage: Hoạt động bền vững trên cả Web và Mobile Native
const hybridStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      if (Platform.OS === "web") {
        return typeof window !== "undefined" && window.localStorage
          ? window.localStorage.getItem(name)
          : null;
      }
      return await AsyncStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      if (Platform.OS === "web") {
        if (typeof window !== "undefined" && window.localStorage) {
          window.localStorage.setItem(name, value);
        }
      } else {
        await AsyncStorage.setItem(name, value);
      }
    } catch {}
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      if (Platform.OS === "web") {
        if (typeof window !== "undefined" && window.localStorage) {
          window.localStorage.removeItem(name);
        }
      } else {
        await AsyncStorage.removeItem(name);
      }
    } catch {}
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // ... giữ nguyên toàn bộ state & actions hiện tại
    }),
    {
      name: "waifu-auth-storage",
      storage: createJSONStorage(() => hybridStorage),
    }
  )
);
```

- Trong `apps/mobile/src/app/(tabs)/profile.tsx`: Thay thế đoạn lưu `waifu_personal_photos` từ `window.localStorage` sang `AsyncStorage` hoặc dùng `hybridStorage` tương tự.

---

## 📌 TASK 3: Trình Phát Âm Thanh Đa Tầng (Hybrid Audio Engine Cho Expo Go)

### 1. Vị trí file
- `apps/mobile/src/services/audioPlayer.ts`

### 2. Vấn đề hiện tại
- `react-native-track-player` yêu cầu mã nguồn Native (C++/Java), không thể chạy trên **Expo Go** tiêu chuẩn.
- Fallback hiện tại `new Audio()` chỉ tồn tại trên trình duyệt Web (`HTMLAudioElement`).
- Khi người dùng chạy app trên điện thoại bằng Expo Go, bài hát không thể phát được (im lặng, không có tiếng).

### 3. Giải pháp & Mã triển khai
- Xây dựng kiến trúc phát nhạc 3 tầng:
  1. **Tầng 1 (Native Production)**: `react-native-track-player` (dành cho bản build APK/iOS standalone).
  2. **Tầng 2 (Expo Go / Mobile Fallback)**: `expo-av` (`Audio.Sound` của Expo).
  3. **Tầng 3 (Web Fallback)**: `HTMLAudioElement` (`new Audio()`).

```typescript
import { NativeModules, Platform } from "react-native";
import { Audio as ExpoAudio } from "expo-av";
import type { Song } from "@waifu-player/types";
import { API_BASE_URL } from "../constants/api";

const isTrackPlayerAvailable = !!NativeModules.TrackPlayerModule;
let expoSound: ExpoAudio.Sound | null = null;
let webAudio: HTMLAudioElement | null = null;
let currentVolume = 1.0;
let currentRate = 1.0;

export async function playSongOnPlayer(song: Song): Promise<void> {
  if (!song || !song.fileUrl) return;

  const streamUrl = song.fileUrl.startsWith("http")
    ? song.fileUrl
    : `${API_BASE_URL}${song.fileUrl.startsWith("/") ? "" : "/"}${song.fileUrl}`;

  // 1. Ưu tiên TrackPlayer nếu có native module
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
    return;
  }

  // 2. Chạy trên Expo Go hoặc Mobile không có TrackPlayer: Dùng expo-av
  if (Platform.OS !== "web") {
    try {
      if (expoSound) {
        await expoSound.unloadAsync();
        expoSound = null;
      }
      await ExpoAudio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });

      const { sound } = await ExpoAudio.Sound.createAsync(
        { uri: streamUrl },
        { shouldPlay: true, volume: currentVolume, rate: currentRate },
        (status) => {
          if (status.isLoaded) {
            eventCallbacks.onProgress?.(
              status.positionMillis / 1000,
              (status.durationMillis || song.duration * 1000) / 1000
            );
            if (status.didJustFinish) {
              eventCallbacks.onEnded?.();
            }
          }
        }
      );
      expoSound = sound;
      return;
    } catch (err) {
      console.warn("[ExpoAudio] Error playing stream:", err);
    }
  }

  // 3. Fallback Web Browser: Dùng HTML5 Audio
  if (typeof window !== "undefined" && typeof Audio !== "undefined") {
    if (webAudio) {
      try {
        webAudio.pause();
        webAudio.removeAttribute("src");
        webAudio.load();
      } catch {}
    }
    webAudio = new Audio(streamUrl);
    webAudio.volume = currentVolume;
    webAudio.playbackRate = currentRate;
    webAudio.ontimeupdate = () => {
      if (webAudio) {
        eventCallbacks.onProgress?.(webAudio.currentTime, webAudio.duration || song.duration);
      }
    };
    webAudio.onended = () => eventCallbacks.onEnded?.();
    webAudio.play().catch(console.warn);
  }
}

export async function pauseAudio(): Promise<void> {
  if (isTrackPlayerAvailable && TrackPlayer) {
    await TrackPlayer.pause();
  } else if (expoSound) {
    await expoSound.pauseAsync();
  } else if (webAudio) {
    webAudio.pause();
  }
}

export async function resumeAudio(): Promise<void> {
  if (isTrackPlayerAvailable && TrackPlayer) {
    await TrackPlayer.play();
  } else if (expoSound) {
    await expoSound.playAsync();
  } else if (webAudio) {
    webAudio.play().catch(() => {});
  }
}

export async function seekToPosition(seconds: number): Promise<void> {
  if (isTrackPlayerAvailable && TrackPlayer) {
    await TrackPlayer.seekTo(seconds);
  } else if (expoSound) {
    await expoSound.setPositionAsync(seconds * 1000);
  } else if (webAudio) {
    webAudio.currentTime = seconds;
  }
}
```

---

## 📌 TASK 4: Tích Hợp Bộ Chọn Ảnh & Tệp Chuẩn Native (Native Image & Document Picker)

### 1. Vị trí files
- `apps/mobile/src/app/(tabs)/profile.tsx` (Đổi Avatar)
- `apps/mobile/src/features/payments/PaymentCheckoutModal.tsx` (Tải ảnh hóa đơn thanh toán)
- `apps/mobile/src/app/creator/index.tsx` (Tải bài hát MP3 & Ảnh bìa)
- `apps/mobile/src/app/admin/index.tsx` (Upload bài hát & Ảnh bìa)

### 2. Vấn đề hiện tại
- Các file trên sử dụng `const input = document.createElement("input")`.
- Trên React Native, `document` không tồn tại $\rightarrow$ Khi bấm chọn ảnh/chọn file trên điện thoại, ứng dụng không phản hồi hoặc báo lỗi.

### 3. Giải pháp & Mã triển khai

#### A. Viết Helper dùng chung: `apps/mobile/src/utils/filePicker.ts`
Tạo mới file helper để phục vụ chọn ảnh và chọn file cho toàn bộ app:

```typescript
import { Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";

export interface PickedMedia {
  uri: string;
  name: string;
  type: string;
  file?: any; // Dành cho FormData trên Web
}

// 1. Chọn ảnh từ Thư viện (Gallery) hoặc Camera
export async function pickImageFromDevice(): Promise<PickedMedia | null> {
  if (Platform.OS !== "web") {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert("Cần cấp quyền truy cập thư viện ảnh để tiếp tục.");
      return null;
    }
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    quality: 0.8,
  });

  if (result.canceled || !result.assets[0]) return null;

  const asset = result.assets[0];
  const filename = asset.fileName || `image_${Date.now()}.jpg`;
  const mimeType = asset.mimeType || "image/jpeg";

  return {
    uri: asset.uri,
    name: filename,
    type: mimeType,
    file: (asset as any).file,
  };
}

// 2. Chọn file Audio (MP3, WAV, FLAC) từ bộ nhớ
export async function pickAudioFileFromDevice(): Promise<PickedMedia | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["audio/mpeg", "audio/wav", "audio/flac", "audio/*"],
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets[0]) return null;

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    name: asset.name,
    type: asset.mimeType || "audio/mpeg",
    file: asset.file,
  };
}
```

#### B. Cách đóng gói FormData gửi lên API Backend
Trong React Native, để gửi file thành công lên Multer backend:
```typescript
const picked = await pickImageFromDevice();
if (!picked) return;

const formData = new FormData();
if (Platform.OS === "web" && picked.file) {
  formData.append("avatar", picked.file);
} else {
  formData.append("avatar", {
    uri: picked.uri,
    name: picked.name,
    type: picked.type,
  } as any);
}

await api.post("/api/v1/users/me/avatar", formData, {
  headers: { "Content-Type": undefined },
});
```

- Áp dụng tương tự cho `PaymentCheckoutModal.tsx` (upload bill `submitOrderProof`) và `creator/index.tsx` (upload `song` và `cover`).

---

## 📌 TASK 5: Cấu Hình Hệ Thống Trong `app.json` (Expo Configuration)

### 1. Vị trí file
- `apps/mobile/app.json`

### 2. Cập nhật quyền phát nhạc nền và truy cập bộ nhớ
Bổ sung các cấu hình sau vào `app.json`:

```json
{
  "expo": {
    "name": "Waifu Player",
    "slug": "waifu-player",
    "version": "1.0.0",
    "orientation": "portrait",
    "scheme": "waifuplayer",
    "userInterfaceStyle": "dark",
    "splash": {
      "resizeMode": "contain",
      "backgroundColor": "#0f0f1a"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "dev.waifuplayer.app",
      "infoPlist": {
        "UIBackgroundModes": ["audio"],
        "NSPhotoLibraryUsageDescription": "Cho phép Waifu Player truy cập thư viện ảnh để cập nhật avatar và tải ảnh bìa."
      }
    },
    "android": {
      "package": "dev.waifuplayer.app",
      "permissions": [
        "FOREGROUND_SERVICE",
        "WAKE_LOCK",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ]
    },
    "web": {
      "bundler": "metro",
      "output": "static"
    },
    "plugins": [
      ["expo-router", { "root": "./src/app" }],
      [
        "expo-image-picker",
        {
          "photosPermission": "Cho phép Waifu Player truy cập thư viện ảnh để chọn avatar."
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

---

## 🧪 QUY TRÌNH KIỂM CHỨNG & NGHIỆM THU (VERIFICATION GATES)

Codex sau khi thực hiện 5 Tasks trên **bắt buộc** thực thi các bước kiểm chứng sau:

1. **Kiểm tra biên dịch TypeScript (Strict Typecheck)**:
   ```bash
   npm --prefix apps/mobile run test
   ```
   *Yêu cầu: Không có bất kỳ lỗi cú pháp hoặc Type mismatch nào.*

2. **Kiểm tra API Backend Tests**:
   ```bash
   npm --prefix apps/api run test
   ```
   *Yêu cầu: 14 test suites (105 tests) vượt qua 100%.*

3. **Kiểm tra trực quan trên thiết bị**:
   - Chạy `npm --prefix apps/mobile run dev`.
   - Quét mã QR bằng ứng dụng **Expo Go** trên điện thoại:
     - [x] Đăng nhập tài khoản $\rightarrow$ Tắt app mở lại vẫn giữ trạng thái đăng nhập.
     - [x] Bấm vào 1 bài hát bất kỳ $\rightarrow$ Âm thanh phát rõ ràng trên loa điện thoại.
     - [x] Vào Hồ sơ cá nhân $\rightarrow$ Bấm đổi avatar $\rightarrow$ Bật thư viện ảnh điện thoại và tải lên thành công.
     - [x] Đăng xuất $\rightarrow$ Hiển thị Modal xác nhận thân thiện.
