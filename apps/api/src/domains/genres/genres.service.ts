import { prisma } from "../../config/database";

export async function getGenres() {
  return prisma.genre.findMany({
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
  });
}
