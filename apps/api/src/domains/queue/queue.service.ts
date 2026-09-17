import { prisma } from "../../config/database";

const songSel = { id: true, title: true, duration: true, coverUrl: true,
  artists: { select: { artist: { select: { id: true, name: true } } } } };

export async function getQueue(userId: string) {
  const items = await prisma.queueItem.findMany({
    where: { userId }, orderBy: { position: "asc" },
    include: { song: { select: songSel } },
  });
  return items.map((i: any) => ({ ...i, song: { ...i.song, artists: i.song.artists.map((a: any) => a.artist) } }));
}

export async function replaceQueue(userId: string, songIds: string[]) {
  await prisma.queueItem.deleteMany({ where: { userId } });
  if (songIds.length === 0) return;
  await prisma.queueItem.createMany({
    data: songIds.map((songId, position) => ({ userId, songId, position })),
  });
}

export async function addToQueue(userId: string, songId: string, position?: number) {
  const count = await prisma.queueItem.count({ where: { userId } });
  const pos = position ?? count;
  // Shift existing items if inserting in the middle
  if (position !== undefined && position < count) {
    await prisma.queueItem.updateMany({
      where: { userId, position: { gte: position } },
      data: { position: { increment: 1 } },
    });
  }
  await prisma.queueItem.create({ data: { userId, songId, position: pos } });
}

export async function removeFromQueue(userId: string, itemId: string) {
  const item = await prisma.queueItem.findFirst({ where: { id: itemId, userId } });
  if (!item) return;
  await prisma.queueItem.delete({ where: { id: itemId } });
  await prisma.queueItem.updateMany({
    where: { userId, position: { gt: item.position } },
    data: { position: { decrement: 1 } },
  });
}

export async function clearQueue(userId: string) {
  await prisma.queueItem.deleteMany({ where: { userId } });
}
