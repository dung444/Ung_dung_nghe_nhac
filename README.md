# 🎵 Waifu Player

> Cross-platform music streaming app — phong cách anime/waifu

**Stack**: Expo SDK 54 · Node.js · Express · Prisma · MySQL · Socket.io · Turborepo

## Tech Stack

| Layer | Technology |
|:------|:-----------|
| Frontend | Expo SDK 54 + React Native + Expo Router |
| Audio | react-native-track-player (RNTP) |
| State | Zustand |
| Backend | Node.js + Express + TypeScript |
| ORM | Prisma v6 |
| Database | MySQL 8.4 |
| Real-time | Socket.io v4 (3 namespaces) |
| Monorepo | pnpm workspaces + Turborepo |

## Project Structure

```
waifu-player/
├── apps/
│   ├── api/       # REST API + Socket.io server
│   └── mobile/    # Expo app (Web + Mobile)
├── packages/
│   ├── types/     # Shared TypeScript interfaces
│   ├── utils/     # Shared utilities
│   └── validation/# Shared Zod schemas
```

## Prerequisites

- Node.js >= 20
- pnpm >= 9: `npm install -g pnpm`
- MySQL 8.4 running locally
- (For mobile) EAS CLI: `npm install -g eas-cli`

## Getting Started

```bash
# 1. Install dependencies
pnpm install

# 2. Setup backend environment
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env with your MySQL credentials

# 3. Push database schema & generate client
pnpm --filter @waifu-player/api prisma:generate
pnpm --filter @waifu-player/api exec prisma db push

# 4. Seed sample data (Vocaloid, Anime OST, Admin & Users)
pnpm --filter @waifu-player/api prisma:seed

# 5. Run tests
pnpm test

# 6. Start all services (Backend + Mobile)
pnpm dev
```

## Services

- Backend API: http://localhost:3000
- Frontend Web: http://localhost:8081

## 🛡️ Hệ Thống Quản Lý Bản Quyền Âm Nhạc (Music Copyright & Licensing)

Waifu Player tích hợp giải pháp quản trị bản quyền âm nhạc số toàn diện tuân thủ tiêu chuẩn quốc tế và chính sách DMCA:

- **Chứng chỉ bản quyền (Song Copyright)**:
  - Định danh tác phẩm chuẩn quốc tế: Mã ISRC (`VN-WFP-YYYY-XXXXX`).
  - Phân loại giấy phép: `ALL_RIGHTS_RESERVED`, `CREATIVE_COMMONS`, `ROYALTY_FREE`, `PUBLIC_DOMAIN`, `CUSTOM_LICENSE`.
  - Kiểm soát quyền phân phối, quyền khai thác thương mại (`commercialUse`), quyền phối lại tác phẩm (`allowRemix`).
- **Xử lý tranh chấp & Khiếu nại bản quyền (Copyright Claims / DMCA Takedown)**:
  - Người dùng / Tác giả gửi đơn khiếu nại vi phạm với bằng chứng pháp lý (`POST /api/v1/copyright/claims`).
  - Quản trị viên (ADMIN) xét duyệt, tự động thu hồi/gỡ bài hát vi phạm khỏi hệ thống (`APPROVED` -> Takedown song).
- **Trung tâm bản quyền di động (Mobile Copyright Center)**:
  - Tra cứu thông tin bản quyền và giấy phép trực tiếp trên trình phát nhạc (`SongDetailScreen`).
  - Thống kê tỷ lệ tác phẩm bảo hộ và quản lý tranh chấp tác quyền tại Trung tâm Bản quyền (`ProfileScreen`).

