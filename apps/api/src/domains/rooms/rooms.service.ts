import { prisma } from "../../config/database";
import { AppError } from "../../middleware/error.middleware";

export async function createRoom(ownerId: string, name: string) {
  return prisma.room.create({
    data: { name, ownerId },
    include: { owner: { select: { id: true, username: true, avatarUrl: true } } },
  });
}

export async function getRoomById(id: string) {
  const room = await prisma.room.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, username: true, avatarUrl: true } },
      participants: { include: { user: { select: { id: true, username: true, avatarUrl: true } } } },
      queue: {
        include: { song: { select: { id: true, title: true, duration: true, coverUrl: true,
          artists: { select: { artist: { select: { id: true, name: true } } } } } } },
        orderBy: { position: "asc" },
      },
    },
  });
  if (!room) throw new AppError("Room not found", 404);
  return {
    ...room,
    queue: room.queue.map((qi: any) => ({
      ...qi, song: { ...qi.song, artists: qi.song.artists.map((a: any) => a.artist) },
    })),
  };
}

export async function closeRoom(id: string, userId: string) {
  const room = await prisma.room.findUnique({ where: { id } });
  if (!room) throw new AppError("Room not found", 404);
  if (room.ownerId !== userId) throw new AppError("Only room owner can close it", 403);
  await prisma.room.update({ where: { id }, data: { isActive: false } });
}

export async function getActiveRooms() {
  return prisma.room.findMany({
    where: { isActive: true },
    include: {
      owner: { select: { id: true, username: true, avatarUrl: true } },
      _count: { select: { participants: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}
