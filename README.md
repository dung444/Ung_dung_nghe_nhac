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

# 3. Run database migrations
pnpm --filter api prisma migrate dev

# 4. Seed sample data
pnpm --filter api prisma db seed

# 5. Start all services
pnpm dev
```

## Services

- Backend API: http://localhost:3000
- Frontend Web: http://localhost:8081
