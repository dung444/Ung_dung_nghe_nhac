import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
async function main() {
  const songsCount = await p.song.count();
  const artistsCount = await p.artist.count();
  const genresCount = await p.genre.count();
  const copyrightsCount = await p.songCopyright.count();
  const usersCount = await p.user.count();
  console.log({ songsCount, artistsCount, genresCount, copyrightsCount, usersCount });
  const all = await p.song.findMany({ select: { title: true }, orderBy: { title: "asc" } });
  console.log("Current titles count:", all.length);
  console.log("Titles:", all.map(x => x.title).join(", "));
}
main().finally(() => p.$disconnect());
