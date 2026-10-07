import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
async function main() {
  const songsCount = await p.song.count();
  const artistsCount = await p.artist.count();
  const genresCount = await p.genre.count();
  const copyrightsCount = await p.songCopyright.count();
  const usersCount = await p.user.count();
  console.log({ songsCount, artistsCount, genresCount, copyrightsCount, usersCount });
  const all = await p.song.findMany({ select: { title: true, lyrics: true }, orderBy: { title: "asc" } });
  const withLyrics = all.filter(s => !!s.lyrics && s.lyrics.trim().length > 0);
  const withoutLyrics = all.filter(s => !s.lyrics || s.lyrics.trim().length === 0);
  console.log("Total songs:", all.length);
  console.log("With lyrics (Có Lời):", withLyrics.length);
  console.log("Without lyrics (Không Lời):", withoutLyrics.length);
  if (withoutLyrics.length > 0) {
    console.log("Without lyrics samples:", withoutLyrics.slice(0, 5).map(s => s.title));
  }
}
main().finally(() => p.$disconnect());
