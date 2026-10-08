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

### Ghi chú media cục bộ

Ảnh bìa tải lên được API lưu dưới dạng đường dẫn `/uploads/covers/...`. Ứng dụng di động tự chuyển các đường dẫn này thành URL của Backend API trước khi hiển thị, để Web không nhầm chúng với đường dẫn trên Frontend (cổng 8081).

### Ghi công và bản quyền khi Creator phát hành

Khi đăng bài, Creator có thể chọn **nghệ sĩ thể hiện** khác với tài khoản đăng bài và khai báo **chủ sở hữu bản quyền**. Hệ thống lưu tài khoản phát hành trong `SongCopyright.registeredById`; quyền quản lý bài trong Creator Studio dựa trên thông tin này, không dựa vào nghệ sĩ được ghi công.

Việc chỉ mở Creator Studio không thay đổi role; người dùng chỉ trở thành `ARTIST` sau khi chủ động xác nhận tạo hồ sơ Creator.

### Danh mục thể loại

Tài khoản `ADMIN` có thể thêm thể loại trong **Bảng điều khiển → Nghệ sĩ & Album → Quản lý thể loại**. Khi phát hành, Creator có thể tìm và chọn nhiều thể loại cho cùng một bài hát; danh mục không bị giới hạn bốn thể loại.

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

## ⚡ Cổng Quản Trị Hệ Thống Trên Giao Diện Web (Web Admin Portal)

Waifu Player cung cấp giao diện quản trị Web Admin chuyên nghiệp tại đường dẫn `/admin` (`http://localhost:8081/admin`), tối ưu cho màn hình máy tính (Desktop Web) và thiết bị di động:

- **Bảng Điều Khiển Tổng Quan (Dashboard Metrics)**:
  - Thống kê thời gian thực: Tổng người dùng, thành viên VIP, tổng số bài hát, lượt nghe tích lũy, số nghệ sĩ, đơn khiếu nại bản quyền chờ xử lý.
  - Danh sách bài hát mới đăng tải và tài khoản mới đăng ký.
- **Quản Lý Kho Bài Hát (Songs Management)**:
  - Tra cứu, tìm kiếm bài hát theo tên / nghệ sĩ.
  - Đăng tải bài hát mới (tiêu đề, nghệ sĩ, album, link audio, ảnh bìa).
  - Thu hồi / Xóa bài hát khỏi hệ thống (`DELETE /api/v1/songs/:id`).
- **Quản Lý Người Dùng & Phân Quyền (Users & Role Control)**:
  - Xem danh sách toàn bộ người dùng, tìm kiếm theo username/email.
  - Thay đổi vai trò trực tiếp: `USER` ↔ `ARTIST` ↔ `ADMIN`.
  - Bật / Tắt gói hội viên VIP Anime Waifu (`isPremium`).
  - Xóa tài khoản vi phạm (ngăn chặn quản trị viên tự xóa chính mình).
- **Thẩm Định & Xử Lý Khiếu Nại Bản Quyền (DMCA Takedown Review)**:
  - Danh sách khiếu nại bản quyền gửi từ người dùng.
  - Xem tài liệu, link bằng chứng pháp lý vi phạm bản quyền.
  - Phê duyệt đơn khiếu nại (`APPROVED`) → Tự động ẩn và gỡ bài hát vi phạm khỏi hệ thống (`isPublic = false` & `TAKEDOWN`).
  - Từ chối khiếu nại (`REJECTED`) kèm ghi chú thẩm định của Quản trị viên (`adminNotes`).
- **Quản Lý Nghệ Sĩ & Album (Artists & Albums)**:
  - Tạo mới hồ sơ nghệ sĩ Waifu / Ca sĩ Anime.
  - Tạo mới Album và gán bài hát theo nghệ sĩ.


