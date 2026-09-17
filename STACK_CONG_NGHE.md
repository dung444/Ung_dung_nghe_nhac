# 🚀 CHI TIẾT STACK CÔNG NGHỆ & TÀI NGUYÊN THAM KHẢO
## HỆ THỐNG STREAMING & NGHE NHẠC TRỰC TUYẾN ĐA NỀN TẢNG "WAIFU PLAYER"

> **Mục đích tài liệu**: Định nghĩa chi tiết toàn bộ kiến trúc công nghệ (Tech Stack), danh mục thư viện đề xuất kèm lý do kỹ thuật và các kho mã nguồn mở (GitHub Repositories) tham khảo tiêu chuẩn cho dự án **Waifu Player** — Ứng dụng nghe nhạc trực tuyến đa nền tảng (Mobile & Web) phong cách Anime/Waifu.  
> **Phiên bản**: 1.0  
> **Cấu trúc dự án**: Monorepo (Turborepo + pnpm workspaces)  
> **Ngày cập nhật**: 2026-09-17

---

## 🏗️ 1. TỔNG QUAN KIẾN TRÚC TOÀN HỆ THỐNG (FULL-STACK MONOREPO)

Dự án áp dụng mô hình kiến trúc **Full-stack TypeScript Monorepo**, phân tách rõ ràng giữa Client, REST API/Streaming Server, Real-time Gateway và các gói mã nguồn dùng chung (Shared Packages):

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│                   CLIENT: EXPO SDK 54 + REACT NATIVE (TYPESCRIPT)                │
│  - Chạy đồng thời: Mobile App (iOS / Android qua Expo) + Web Player              │
│  - Audio Engine: react-native-track-player (Background Audio, Lockscreen Widget) │
│  - State Management: Zustand v5 (playerStore, roomStore, authStore)              │
│  - Real-time Client: Socket.io-client (Presence, Live Room Sync, Playlist)       │
│  - UI / UX: Phong cách Anime/Waifu, Reanimated v3 Micro-interactions, Sliders    │
└─────────────────────────────────────────▲────────────────────────────────────────┘
                                          │ REST API (JSON) + Audio Stream + WebSocket
┌─────────────────────────────────────────▼────────────────────────────────────────┐
│                   SERVER: NODE.JS + EXPRESS.JS + TYPESCRIPT                      │
│  - Domains: Auth, Songs, Artists, Albums, Playlists, Queue, Rooms, Users, Search │
│  - Audio Streaming: HTTP Range Requests (206 Partial Content) & Static Uploads   │
│  - File Storage: Multer Engine (Xử lý tải lên Audio MP3/FLAC, Cover Art, Avatar) │
│  - Real-time Gateway: Socket.io Server (3 Namespaces: /presence, /room, /playlist)│
│  - Security & Auth: JWT Token (Access + Refresh Token), bcrypt password hash     │
│  - Validation: Zod Schemas tập trung (@waifu-player/validation)                  │
│  - Data Layer: Prisma ORM v6 (Type-safe models, Relations, Cascade Deletes)      │
└─────────────────────────────────────────▲────────────────────────────────────────┘
                                          │ Prisma Client Driver
┌─────────────────────────────────────────▼────────────────────────────────────────┐
│                   DATABASE: MYSQL 8.4 LTS (ISOLATED DEV & TEST)                  │
│  - waifu_player_dev: Cơ sở dữ liệu chạy phát triển, demo và kiểm thử trực quan   │
│  - waifu_player_test: Dữ liệu cô lập chạy bộ test tự động (Vitest / Supertest)   │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### Cấu trúc phân tầng Monorepo (Workspaces)
* **`apps/mobile`**: Ứng dụng Frontend đa nền tảng viết bằng React Native & Expo SDK 54.
* **`apps/api`**: Backend REST API, Audio Streaming Server & Socket.io Gateway.
* **`packages/types`**: Định nghĩa toàn bộ TypeScript Interfaces dùng chung (Entities, DTOs, Socket Payloads).
* **`packages/validation`**: Bộ xác thực Zod Schemas chung cho Client và Server.
* **`packages/utils`**: Thư viện tiện ích dùng chung (Format thời lượng nhạc `mm:ss`, xử lý chuỗi slug, math helpers).

---

## 📱 2. TẦNG FRONTEND (MOBILE APP & WEB PLAYER)

### 2.1. Cốt lõi (Core Stack)
* **React Native (Expo SDK 54 - Architecture 0.76+)**: Nền tảng phát triển ứng dụng di động đa nền tảng hàng đầu, hỗ trợ đồng thời iOS, Android và Web Player.
* **Expo Router (v4)**: Hệ thống điều hướng dạng file-system routing (`(tabs)`, `(auth)`, `album/[id]`, `artist/[id]`, `room/[id]`) tương tự Next.js, tối ưu hóa Deep Linking và tổ chức route tường minh.
* **React Native Track Player (`react-native-track-player` v4.1)**: Thư viện xử lý âm thanh native chuyên nghiệp nhất cho React Native:
  - Hỗ trợ phát nhạc chạy nền (Background Playback) khi tắt màn hình hoặc chuyển app.
  - Tích hợp điều khiển Audio Control trên Notification Bar và Lock Screen (iOS Control Center / Android Media Notification).
  - Hỗ trợ sự kiện tai nghe Bluetooth (Play, Pause, Next, Prev, Unplug headset pause).
  - Hàng đợi bài hát (Queue Management) và event hooks hiệu năng cao (`useProgress`, `usePlaybackState`).
* **Zustand (v5)**: Thư viện quản lý trạng thái tập trung siêu nhẹ (Lightweight State Management):
  - Tối ưu hóa render: Chỉ re-render component đăng ký state cụ thể (không gây giật lag mini-player khi time cập nhật từng giây).
  - Quản lý 3 Stores nòng cốt: `playerStore` (Playback, Repeat, Shuffle), `roomStore` (Live Room Session), `authStore` (Token, Profile).
* **React Native Reanimated (v3.16) & Gesture Handler**: Tạo chuyển động mượt mà 60 FPS cho đĩa than xoay (Vinyl spinning animation), cử chỉ vuốt kéo Bottom Sheet Mini-player lên Full-screen Player.

### 2.2. Danh mục thư viện đề xuất (Recommended Libraries)
| Tên Thư Viện | Phiên bản | Vai trò & Mục đích nghiệp vụ | Lý do kỹ thuật & Lợi ích |
| :--- | :---: | :--- | :--- |
| **`react-native-track-player`** | ^4.1.0 | Trái tim Audio Engine của ứng dụng | Tích hợp sâu vào MediaSession / Android Auto / iOS CarPlay, quản lý buffering và stream mượt mà. |
| **`zustand`** | ^5.0.0 | Quản lý trạng thái phát nhạc và phòng nghe | Siêu nhẹ (<2KB), không boilerplate như Redux, hỗ trợ selector giúp thanh tiến trình nhạc không re-render cả màn hình. |
| **`@react-native-community/slider`** | ^4.5.0 | Thanh trượt tua bài hát (Seek bar) | Kéo thả trực quan thời lượng bài hát, phản hồi ngay lập tức và đồng bộ vị trí phát `trackPlayer.seekTo()`. |
| **`socket.io-client`** | ^4.8.0 | Kết nối Real-time phòng nghe & bạn bè | Lắng nghe sự kiện đồng bộ phòng nghe chung `/room` và cập nhật trạng thái bạn bè `/presence`. |
| **`axios`** | ^1.7.0 | Gọi REST API xuống máy chủ backend | Interceptor tự động gắn Header Authorization (Bearer Token), tự động xử lý Refresh Token khi Access Token hết hạn (15m). |
| **`@expo/vector-icons`** | ^14.0.0 | Bộ icon công thái học cho trình phát nhạc | Cung cấp đầy đủ icon âm nhạc: Play/Pause ⏯️, Next/Prev ⏭️⏮️, Shuffle 🔀, Repeat 🔁, Heart ❤️, Queue 📑. |
| **`expo-sharing`** | ~12.0.0 | Chia sẻ bài hát và phòng nghe | Cho phép người dùng gửi link bài hát hoặc ID phòng nghe chung qua Zalo, Messenger, Telegram. |
| **`react-native-svg`** | ^15.0.0 | Hiển thị vector graphics, sóng nhạc waveform | Vẽ biểu đồ sóng âm thanh, huy hiệu Waifu, visualizer hiệu ứng sóng nhạc động. |

### 2.3. Kho mã nguồn GitHub tham khảo (Top-Starred Repositories)
* **[doublesymmetry/react-native-track-player](https://github.com/doublesymmetry/react-native-track-player)** (⭐ **4.5k+ Stars**):
  - *Học hỏi*: Chuẩn kiến trúc service phát nhạc chạy nền (`service.js`), thiết lập notification media controls, xử lý queue lớn và tối ưu hóa tài nguyên audio.
* **[pmndrs/zustand](https://github.com/pmndrs/zustand)** (⭐ **48.0k+ Stars**):
  - *Học hỏi*: Mô hình thiết kế slice store (PlayerSlice, RoomSlice), middleware devtools, và kỹ thuật transient updates để tránh re-render thừa.
* **[expo/expo](https://github.com/expo/expo)** (⭐ **33.0k+ Stars**):
  - *Học hỏi*: Cấu hình Expo SDK 54, file-based routing với Expo Router v4, quản lý asset âm thanh/hình ảnh tĩnh.
* **[software-mansion/react-native-reanimated](https://github.com/software-mansion/react-native-reanimated)** (⭐ **8.7k+ Stars**):
  - *Học hỏi*: Tạo hiệu ứng đĩa than xoay đồng tốc với trạng thái play/pause, hiệu ứng chuyển cảnh mượt từ Mini Player sang Full Player.

---

## 🖥️ 3. TẦNG BACKEND (REST API, AUDIO STREAMING & REAL-TIME GATEWAY)

### 3.1. Cốt lõi (Core Stack)
* **Node.js (v20+ / v24 LTS)**: Nền tảng thực thi JavaScript/TypeScript asynchronous non-blocking I/O, tối ưu cho xử lý song song nhiều kết nối stream âm thanh và websocket.
* **Express.js (TypeScript)**: Khung ứng dụng RESTful API tinh gọn, kiểm soát toàn diện Middleware, phân chia Domain-driven Design rõ ràng:
  - `/auth`: Đăng ký, đăng nhập, cấp phát và refresh JWT token.
  - `/songs`: Danh sách bài hát, chi tiết, bảng xếp hạng (Top Plays), stream audio, ghi nhận lượt nghe.
  - `/artists`: Nghệ sĩ, thông tin cá nhân, danh sách album/bài hát, follow/unfollow.
  - `/albums`: Album âm nhạc, ngày phát hành, danh sách track trong album.
  - `/playlists`: Quản lý danh sách phát cá nhân, thêm/xóa bài hát, sắp xếp vị trí bài.
  - `/queue`: Lưu trữ hàng đợi nghe nhạc đồng bộ theo tài khoản người dùng.
  - `/rooms`: Quản lý phòng nghe nhạc trực tuyến (Live Listening Rooms).
  - `/users`: Quản lý hồ sơ cá nhân, đổi avatar, lịch sử nghe, bài hát yêu thích.
  - `/search`: Tìm kiếm tổng hợp theo tên bài hát, nghệ sĩ, thể loại (Genre) và album.
* **Prisma ORM (v6+)**: ORM thế hệ mới với khả năng sinh kiểu dữ liệu tự động (Type-safe), quản lý quan hệ phức tạp (Nghệ sĩ - Bài hát, Playlist - Bài hát) và tự động đồng bộ Schema với Database qua migration.
* **Socket.io (v4+)**: Động cơ thời gian thực đa kênh (Multi-namespace Real-time Engine) với 3 Namespace chuyên biệt:
  - **`/presence`**: Giám sát người dùng online và phát sóng trạng thái đang nghe bài hát nào theo thời gian thực (Friend Activity).
  - **`/room`**: Phòng nghe nhạc đồng bộ nhiều người (Listen Together), tự động đồng bộ bài đang phát, tua vị trí (seek sync) và hàng đợi phòng.
  - **`/playlist`**: Đồng bộ tức thì khi playlist được chỉnh sửa (cộng tác viên thêm/xóa bài hát).
* **Multer**: Middleware xử lý tải lên file âm thanh (MP3/FLAC) và hình ảnh bìa (Cover Art, Avatar) với cấu hình giới hạn kích thước an toàn (`MAX_AUDIO_SIZE_MB`, `MAX_COVER_SIZE_MB`).

### 3.2. Danh mục thư viện đề xuất (Recommended Libraries)
| Tên Thư Viện | Phiên bản | Vai trò & Mục đích nghiệp vụ | Lý do kỹ thuật & Lợi ích |
| :--- | :---: | :--- | :--- |
| **`@prisma/client` & `prisma`** | ^6.0.0 | Truy vấn dữ liệu quan hệ an toàn kiểu | Tự động hóa Migration, Type-safe 100%, hỗ trợ transaction khi thêm bài vào playlist hoặc xoá tài khoản. |
| **`socket.io`** | ^4.8.0 | Gateway giao tiếp thời gian thực | Hỗ trợ Namespaces (`/room`, `/presence`, `/playlist`), Room-based broadcasting, tự động fallback Polling/Websocket. |
| **`multer`** | ^1.4.5-lts.1 | Xử lý tải lên tập tin đa phương tiện | Hỗ trợ lưu trữ file âm thanh và ảnh bìa cục bộ hoặc cloud storage, kiểm tra định dạng MIME type chặt chẽ. |
| **`zod`** | ^3.23.0 | Xác thực dữ liệu đầu vào (Validation) | Xác thực DTO đăng ký, tạo bài hát, tạo playlist, phòng nghe; chia sẻ schema dùng chung cho cả frontend. |
| **`jsonwebtoken`** | ^9.0.0 | Cấp phát & kiểm tra tính hợp lệ của token | Hỗ trợ mô hình Access Token ngắn hạn (15 phút) và Refresh Token dài hạn (7 ngày) lưu an toàn trong MySQL. |
| **`bcrypt`** | ^5.1.0 | Mã hoá băm mật khẩu người dùng | Thuật toán băm salted hash an toàn chống tấn công Rainbow table và Brute-force. |
| **`cors`** | ^2.8.5 | Cấu hình bảo mật Cross-Origin Resource Sharing | Cho phép Web Player và Mobile gọi API an toàn, ngăn ngừa truy cập trái phép. |
| **`dotenv`** | ^16.4.0 | Quản lý biến cấu hình môi trường | Nạp các biến nhạy cảm như `DATABASE_URL`, `JWT_SECRET`, `PORT` từ file `.env`. |

### 3.3. Kho mã nguồn GitHub tham khảo (Top-Starred Repositories)
* **[goldbergyoni/nodebestpractices](https://github.com/goldbergyoni/nodebestpractices)** (⭐ **103.0k+ Stars**):
  - *Học hỏi*: Quy chuẩn kiến trúc Node.js 3 tầng (Routes $\rightarrow$ Controllers $\rightarrow$ Services), middleware xử lý lỗi tập trung `errorHandler`, quản lý async errors.
* **[socketio/socket.io](https://github.com/socketio/socket.io)** (⭐ **61.5k+ Stars**):
  - *Học hỏi*: Kiến trúc phân chia Namespace (`/room`, `/presence`), xác thực token tại handshake middleware, và thuật toán đồng bộ thời gian (Time Sync).
* **[colinhacks/zod](https://github.com/colinhacks/zod)** (⭐ **35.5k+ Stars**):
  - *Học hỏi*: Kỹ thuật infer type trực tiếp từ Zod schema, middleware validate Express Request body/params tự động.
* **[prisma/prisma-examples](https://github.com/prisma/prisma-examples)** (⭐ **5.6k+ Stars**):
  - *Học hỏi*: Thiết kế Schema cho ứng dụng đa phương tiện, quan hệ nhiều-nhiều (Song - Artist, Song - Genre), script seed dữ liệu mẫu bài hát và nghệ sĩ.

---

## 🗄️ 4. TẦNG CƠ SỞ DỮ LIỆU (DATABASE LAYER)

### 4.1. Cốt lõi (Core Stack)
* **MySQL 8.4 LTS**: Hệ quản trị cơ sở dữ liệu quan hệ mạnh mẽ, đảm bảo tính toàn vẹn dữ liệu (ACID), hỗ trợ khóa ngoại (Foreign Keys), Unique Constraints và Cascade Deletes.
* **Mô hình Phân lập Cơ sở dữ liệu (Database Isolation)**:
  - `waifu_player_dev`: Lưu trữ dữ liệu phát triển, tài khoản người dùng test, danh mục bài hát anime/waifu và các playlist thử nghiệm.
  - `waifu_player_test`: Cơ sở dữ liệu cô lập dùng riêng cho chạy bộ test tự động (Vitest / Supertest), tự động migrate và làm sạch dữ liệu sau khi test mà không gây ảnh hưởng đến dữ liệu dev.

### 4.2. Thiết kế Mô hình Dữ liệu & Tối ưu Nghiệp vụ Âm nhạc
* **Tối ưu hóa Truy vấn & Chỉ mục (Indexing)**:
  - `Song`: Đánh index trên `title`, `albumId`, `plays` (phục vụ bảng xếp hạng thịnh hành) và `[isPublic, createdAt]` (phục vụ danh sách bài hát mới phát hành).
  - `Artist`: Đánh index trên `name` phục vụ tìm kiếm nhanh.
  - `ListeningHistory`: Đánh index kết hợp `[userId, playedAt]` giúp truy vấn nhanh lịch sử nghe gần đây và tính toán đề xuất bài hát.
* **Bảng nối Quan hệ Nhiều - Nhiều (Junction Tables)**:
  - `SongArtist` (`songId`, `artistId`): Cho phép một bài hát có nhiều nghệ sĩ hợp tác (Collab/Feat).
  - `SongGenre` (`songId`, `genreId`): Một bài hát có thể thuộc nhiều thể loại (J-Pop, Anisong, Lo-fi, Rock).
  - `PlaylistSong` (`playlistId`, `songId`, `position`): Quản lý thứ tự bài hát trong danh sách phát với chỉ mục `[playlistId, position]`.
  - `LikedSong` (`userId`, `songId`, `likedAt`): Danh sách bài hát ưa thích của từng người dùng.
* **Phòng nghe nhạc thời gian thực (Live Rooms)**:
  - `Room`: Quản lý phòng nghe, chủ phòng (`ownerId`), bài hát hiện tại (`currentSongId`).
  - `RoomParticipant`: Quản lý danh sách thành viên đang có mặt trong phòng nghe.
  - `RoomQueueItem`: Quản lý hàng đợi bài hát của phòng nghe có đánh dấu người đóng góp (`addedBy`).

---

## 🧪 5. TẦNG KIỂM THỬ (TESTING & VERIFICATION)

### 5.1. Cốt lõi (Core Stack)
* **Vitest (v2.1+)**: Test runner siêu tốc cho Backend TypeScript, tương thích hoàn toàn cú pháp Jest, tận dụng sức mạnh biên dịch của Vite giúp chạy hàng trăm test cases trong vài giây.
* **Supertest (v7.0+)**: Thư viện kiểm thử tích hợp (Integration Tests) cho các HTTP Endpoints của Express:
  - Kiểm thử chu trình Đăng ký $\rightarrow$ Đăng nhập $\rightarrow$ Lấy JWT Token.
  - Kiểm thử phân quyền truy cập endpoint (USER vs ARTIST vs ADMIN).
  - Kiểm thử tính đúng đắn của luồng thêm bài vào playlist và ghi nhận lượt nghe.
* **Jest & React Native Testing Library (Frontend)**: Kiểm thử logic xử lý trong Zustand stores (`playerStore`, `roomStore`) và kiểm thử component giao diện người dùng.

### 5.2. Kho mã nguồn GitHub tham khảo (Top-Starred Repositories)
* **[vitest-dev/vitest](https://github.com/vitest-dev/vitest)** (⭐ **14.2k+ Stars**):
  - *Học hỏi*: Cấu hình test TypeScript cho monorepo, mocking module Prisma Client, đo lường tỷ lệ bao phủ mã nguồn (Code Coverage).
* **[ladjs/supertest](https://github.com/ladjs/supertest)** (⭐ **14.1k+ Stars**):
  - *Học hỏi*: Pattern kiểm thử endpoint xác thực token JWT, kiểm thử upload file qua form-data và bắt mã lỗi 400, 401, 403, 404, 500.
* **[callstack/react-native-testing-library](https://github.com/callstack/react-native-testing-library)** (⭐ **3.5k+ Stars**):
  - *Học hỏi*: Kiểm thử tương tác nút Play/Pause, tua slider và chuyển bài trên giao diện Mobile.

---

## 🎧 6. CÁC DỰ ÁN MẪU VỀ MUSIC STREAMING & AUDIO PLAYER TRÊN GITHUB

Để nghiên cứu sâu về kiến trúc ứng dụng nghe nhạc và streaming đa phương tiện, các repo mã nguồn mở sau là nguồn tham khảo hàng đầu thế giới:

1. **[KRTirtho/spotube](https://github.com/KRTirtho/spotube)** (⭐ **32.0k+ Stars**):
   - *Điểm học hỏi*: Ứng dụng nghe nhạc mã nguồn mở đa nền tảng xuất sắc, cách quản lý Audio Stream, cache dữ liệu bài hát, tổ chức giao diện Player và đồng bộ hóa hàng đợi phát nhạc.
2. **[navidrome/navidrome](https://github.com/navidrome/navidrome)** (⭐ **14.0k+ Stars**):
   - *Điểm học hỏi*: Máy chủ streaming nhạc cá nhân hiện đại — Kiến trúc REST API phục vụ phát nhạc trực tuyến chuẩn mực, quản lý Metadata ID3 tag, hỗ trợ streaming mượt mà qua HTTP Range Requests.
3. **[Sangwan5688/BlackHole](https://github.com/Sangwan5688/BlackHole)** (⭐ **10.5k+ Stars**):
   - *Điểm học hỏi*: Ứng dụng nghe nhạc di động với giao diện người dùng cực kỳ trau chuốt, hệ thống playlist, tìm kiếm thông minh và quản lý tải bài hát offline.
4. **[vfsfitvnm/ViMusic](https://github.com/vfsfitvnm/ViMusic)** (⭐ **9.0k+ Stars**):
   - *Điểm học hỏi*: Thiết kế giao diện trình phát nhạc Bottom Sheet hiện đại, tích hợp hiển thị lời bài hát (Synced Lyrics) và tối ưu hóa bộ nhớ đệm audio.

---

## 📋 7. TỔNG KẾT BẢNG GÓI PHỤ THUỘC ĐỒNG BỘ (PACKAGE SYNC)

Đồng bộ toàn bộ dependencies của các workspaces trong hệ thống Monorepo:

```json
{
  "monorepo_tooling": {
    "package_manager": "pnpm@9.14.0",
    "orchestrator": "turbo@^2.3.0",
    "compiler": "typescript@^5.5.0"
  },
  "apps": {
    "api": {
      "dependencies": [
        "express@^4.19.0",
        "@prisma/client@^6.0.0",
        "socket.io@^4.8.0",
        "multer@^1.4.5-lts.1",
        "zod@^3.23.0",
        "jsonwebtoken@^9.0.0",
        "bcrypt@^5.1.0",
        "cors@^2.8.5",
        "dotenv@^16.4.0",
        "@waifu-player/types@workspace:*",
        "@waifu-player/validation@workspace:*",
        "@waifu-player/utils@workspace:*"
      ],
      "devDependencies": [
        "prisma@^6.0.0",
        "tsx@^4.15.0",
        "vitest@^2.1.0",
        "supertest@^7.0.0",
        "typescript@^5.5.0",
        "@types/express@^4.17.21",
        "@types/node@^22.0.0",
        "@types/multer@^1.4.11",
        "@types/jsonwebtoken@^9.0.6",
        "@types/bcrypt@^5.0.2",
        "@types/supertest@^6.0.2"
      ]
    },
    "mobile": {
      "dependencies": [
        "expo@~54.0.0",
        "react@18.3.1",
        "react-native@0.76.5",
        "expo-router@~4.0.0",
        "react-native-track-player@^4.1.0",
        "zustand@^5.0.0",
        "@react-native-community/slider@^4.5.0",
        "react-native-reanimated@~3.16.0",
        "react-native-gesture-handler@~2.20.0",
        "react-native-safe-area-context@4.12.0",
        "react-native-screens@~4.4.0",
        "react-native-svg@^15.0.0",
        "socket.io-client@^4.8.0",
        "axios@^1.7.0",
        "@expo/vector-icons@^14.0.0",
        "expo-font@~13.0.0",
        "expo-sharing@~12.0.0",
        "expo-splash-screen@~0.29.0",
        "expo-status-bar@~2.0.0",
        "@waifu-player/types@workspace:*",
        "@waifu-player/utils@workspace:*"
      ],
      "devDependencies": [
        "typescript@^5.5.0",
        "@types/react@~18.3.0",
        "@babel/core@^7.25.0"
      ]
    }
  },
  "packages": {
    "types": "Shared TypeScript Interfaces (User, Song, Artist, Album, Playlist, Room, Socket Events)",
    "validation": "Shared Zod Schemas (Auth, Song, Playlist, Room)",
    "utils": "Shared Helpers (Time formatting mm:ss, Slugify, Math helpers)"
  }
}
```

---

*Tài liệu này được lưu trữ nội bộ làm cẩm nang kiến trúc và đối soát kỹ thuật xuyên suốt quá trình phát triển ứng dụng Waifu Player.*
