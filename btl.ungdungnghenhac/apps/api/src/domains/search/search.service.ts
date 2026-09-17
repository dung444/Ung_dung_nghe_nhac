import { prisma } from "../../config/database";

const songSel = { id: true, title: true, duration: true, coverUrl: true, plays: true,
  artists: { select: { artist: { select: { id: true, name: true } } } } };

export async function search(q: string, types: string[]) {
  const results: Record<string, unknown[]> = {};
  const kw = { contains: q };

  await Promise.all([
    types.includes("song") && prisma.song.findMany({
      where: { isPublic: true, title: kw }, select: songSel, take: 10, orderBy: { plays: "desc" },
    }).then((rows) => { results.songs = rows.map((s: any) => ({ ...s, artists: s.artists.map((a: any) => a.artist) })); }),

    types.includes("artist") && prisma.artist.findMany({
      where: { name: kw }, select: { id: true, name: true, avatarUrl: true, verified: true }, take: 10,
    }).then((rows) => { results.artists = rows; }),

    types.includes("album") && prisma.album.findMany({
      where: { title: kw },
      select: { id: true, title: true, coverUrl: true, artist: { select: { id: true, name: true } } }, take: 10,
    }).then((rows) => { results.albums = rows; }),

    types.includes("playlist") && prisma.playlist.findMany({
      where: { isPublic: true, name: kw },
      select: { id: true, name: true, coverUrl: true, user: { select: { id: true, username: true } }, _count: { select: { songs: true } } }, take: 10,
    }).then((rows) => { results.playlists = rows; }),
  ]);

  return results;
}

export async function getTrending() {
  const [songs, playlists] = await Promise.all([
    prisma.song.findMany({
      where: { isPublic: true }, select: songSel,
      orderBy: { plays: "desc" }, take: 20,
    }),
    prisma.playlist.findMany({
      where: { isPublic: true },
      select: { id: true, name: true, coverUrl: true, user: { select: { id: true, username: true } }, _count: { select: { songs: true } } },
      take: 10,
    }),
  ]);
  return { songs: songs.map((s: any) => ({ ...s, artists: s.artists.map((a: any) => a.artist) })), playlists };
}
