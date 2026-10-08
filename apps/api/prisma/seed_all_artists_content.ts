import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

// Danh mục bài hát & Album đặc trưng theo từng nghệ sĩ nổi bật
const ARTIST_PRESETS: Record<string, {
  albums: { title: string; coverUrl: string; year: number }[];
  songs: { title: string; duration: number; lyrics?: string; audioUrl: string; coverUrl: string; albumTitle: string }[];
}> = {
  "Hatsune Miku": {
    albums: [
      { title: "Vocaloid Greatest Hits: Diva Edition", coverUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&q=80", year: 2024 },
      { title: "Miku Magical Mirai Live Anthem", coverUrl: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&q=80", year: 2025 }
    ],
    songs: [
      { title: "World is Mine (Live)", duration: 255, lyrics: "[00:00.00] Sekai de ichiban ohime-sama...\n[00:15.00] Sou iu atsukai kokoroete yo ne!\n[00:30.00] Sono ichi: Itsumo to chigau kamigata ni kizuite!", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", coverUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&q=80", albumTitle: "Vocaloid Greatest Hits: Diva Edition" },
      { title: "Senbonzakura Overdrive", duration: 244, lyrics: "[00:00.00] Daitan-futeki ni Haikara kakumei...\n[00:18.00] Rairai rakuraku hanran kokushi!", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", coverUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&q=80", albumTitle: "Vocaloid Greatest Hits: Diva Edition" },
      { title: "Tell Your World", duration: 270, lyrics: "[00:00.00] Kimi ni tsutaetai koto ga...\n[00:20.00] Kimi ni todoketai oto ga aru!", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3", coverUrl: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&q=80", albumTitle: "Miku Magical Mirai Live Anthem" },
      { title: "Melt Forever", duration: 280, lyrics: "[00:00.00] Asa me ga samete...\n[00:22.00] Massaki ni omoiukabu kimi no koto!", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3", coverUrl: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&q=80", albumTitle: "Miku Magical Mirai Live Anthem" },
      { title: "The Disappearance of Hatsune Miku", duration: 290, lyrics: "[00:00.00] Boku wa umare soshite kizuku...\n[00:15.00] Shosen hito no mane-goto da to!", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3", coverUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&q=80", albumTitle: "Vocaloid Greatest Hits: Diva Edition" }
    ]
  },
  "LiSA": {
    albums: [
      { title: "Demon Slayer & Sword Art Origin", coverUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&q=80", year: 2024 },
      { title: "LANDER Awakening", coverUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80", year: 2025 }
    ],
    songs: [
      { title: "Gurenge Remastered", duration: 238, lyrics: "[00:00.00] Tsuyoku nareru riyuu wo shitta...\n[00:14.00] Boku wo tsurete susume!", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3", coverUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&q=80", albumTitle: "Demon Slayer & Sword Art Origin" },
      { title: "Homura Requiem", duration: 275, lyrics: "[00:00.00] Sayonara arigatou koe no kagiri...\n[00:20.00] Kanashimi yori motto daiji na koto!", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3", coverUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&q=80", albumTitle: "Demon Slayer & Sword Art Origin" },
      { title: "Crossing Fate", duration: 249, lyrics: "[00:00.00] Mitometeta okubyou na kako...\n[00:18.00] Wakaranai mama de hashiri tsuzuketa!", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3", coverUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80", albumTitle: "LANDER Awakening" },
      { title: "Catch the Moment", duration: 265, lyrics: "[00:00.00] Mayoi konda sekai de...\n[00:22.00] Boku-tachi ga mitsuketa mono!", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3", coverUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80", albumTitle: "LANDER Awakening" }
    ]
  },
  "Aimer": {
    albums: [
      { title: "Midnight Sun & Zankyo", coverUrl: "https://images.unsplash.com/photo-1563089145-599997674d42?w=600&q=80", year: 2024 }
    ],
    songs: [
      { title: "Zankyo Sanka (Kimetsu No Yaiba)", duration: 184, lyrics: "[00:00.00] Tare kagase fukaku asaku...\n[00:15.00] Kokoro no oku made hibikase yo!", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3", coverUrl: "https://images.unsplash.com/photo-1563089145-599997674d42?w=600&q=80", albumTitle: "Midnight Sun & Zankyo" },
      { title: "Brave Shine", duration: 232, lyrics: "[00:00.00] Hidari te ni kakushita...\n[00:18.00] Toka no kioku wo kizande!", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3", coverUrl: "https://images.unsplash.com/photo-1563089145-599997674d42?w=600&q=80", albumTitle: "Midnight Sun & Zankyo" }
    ]
  },
  "YOASOBI": {
    albums: [
      { title: "THE BOOK: The Idol Anthology", coverUrl: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&q=80", year: 2024 }
    ],
    songs: [
      { title: "Idol Symphony (Oshi no Ko)", duration: 215, lyrics: "[00:00.00] Muteki no egao de arasu media...\n[00:12.00] Shiritai sono himitsu misuteriasu!", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3", coverUrl: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&q=80", albumTitle: "THE BOOK: The Idol Anthology" },
      { title: "Racing into the Night (Yoru ni Kakeru)", duration: 260, lyrics: "[00:00.00] Shizumu you ni toketeyuku you ni...\n[00:16.00] Futari dake no sora ga hirogaru yoru ni!", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3", coverUrl: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&q=80", albumTitle: "THE BOOK: The Idol Anthology" }
    ]
  }
};

const GENERIC_ANIME_COVERS = [
  "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&q=80",
  "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&q=80",
  "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&q=80",
  "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80",
  "https://images.unsplash.com/photo-1563089145-599997674d42?w=600&q=80",
  "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&q=80",
  "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80",
  "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80",
  "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&q=80",
  "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=600&q=80"
];

async function main() {
  console.log("🌸 [Waifu Seeder] Đang kiểm tra và bổ sung Album & Bài hát cho TẤT CẢ ca sĩ...");

  const allArtists = await prisma.artist.findMany({
    include: {
      albums: true,
      songs: true
    }
  });

  console.log(`Tìm thấy ${allArtists.length} nghệ sĩ.`);

  for (let i = 0; i < allArtists.length; i++) {
    const artist = allArtists[i];
    const preset = ARTIST_PRESETS[artist.name];

    console.log(`\n🎤 Xử lý nghệ sĩ: ${artist.name} (Hiện có ${artist.albums.length} albums, ${artist.songs.length} bài hát)`);

    // 1. Tạo Album nếu chưa có hoặc có preset
    const createdAlbumMap = new Map<string, string>();

    if (preset) {
      for (const albDef of preset.albums) {
        let existingAlb = await prisma.album.findFirst({
          where: { artistId: artist.id, title: albDef.title }
        });

        if (!existingAlb) {
          existingAlb = await prisma.album.create({
            data: {
              id: crypto.randomUUID(),
              title: albDef.title,
              coverUrl: albDef.coverUrl,
              releaseDate: new Date(`${albDef.year}-01-01`),
              artistId: artist.id
            }
          });
          console.log(`  + Đã tạo Album: ${albDef.title}`);
        }
        createdAlbumMap.set(albDef.title, existingAlb.id);
      }

      // Tạo bài hát theo preset
      for (const songDef of preset.songs) {
        const albumId = createdAlbumMap.get(songDef.albumTitle);
        let existingSong = await prisma.song.findFirst({
          where: { title: songDef.title }
        });

        if (!existingSong) {
          existingSong = await prisma.song.create({
            data: {
              id: crypto.randomUUID(),
              title: songDef.title,
              duration: songDef.duration,
              fileUrl: songDef.audioUrl,
              coverUrl: songDef.coverUrl,
              lyrics: songDef.lyrics || "",
              plays: Math.floor(Math.random() * 4000) + 1200,
              isPublic: true,
              albumId: albumId || null
            }
          });
          console.log(`  + Đã tạo bài hát: ${songDef.title}`);
        } else if (albumId && !existingSong.albumId) {
          await prisma.song.update({
            where: { id: existingSong.id },
            data: { albumId }
          });
        }

        // Liên kết SongArtist
        await prisma.songArtist.upsert({
          where: { songId_artistId: { songId: existingSong.id, artistId: artist.id } },
          create: { songId: existingSong.id, artistId: artist.id },
          update: {}
        });
      }
    } else {
      // Với các nghệ sĩ khác: Đảm bảo có ít nhất 1 Album và 3 bài hát
      let album = artist.albums[0];
      if (!album) {
        const cover = GENERIC_ANIME_COVERS[i % GENERIC_ANIME_COVERS.length];
        album = await prisma.album.create({
          data: {
            id: crypto.randomUUID(),
            title: `${artist.name} Collection Vol. 1`,
            coverUrl: cover,
            releaseDate: new Date("2025-06-01"),
            artistId: artist.id
          }
        });
        console.log(`  + Tạo mới Album mặc định: ${album.title}`);
      }

      // Nếu nghệ sĩ chưa có bài hát nào, tạo 3 bài hát đặc sắc
      if (artist.songs.length === 0) {
        const songTitles = [
          `${artist.name} - Melodic Dreams`,
          `${artist.name} - Starlight Romance`,
          `${artist.name} - Symphony of Horizon`
        ];

        for (let sIdx = 0; sIdx < songTitles.length; sIdx++) {
          const sTitle = songTitles[sIdx];
          const audioIdx = ((i * 3 + sIdx) % 15) + 1;
          const cover = GENERIC_ANIME_COVERS[(i + sIdx) % GENERIC_ANIME_COVERS.length];

          const newSong = await prisma.song.create({
            data: {
              id: crypto.randomUUID(),
              title: sTitle,
              duration: 210 + sIdx * 25,
              fileUrl: `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${audioIdx}.mp3`,
              coverUrl: cover,
              lyrics: `[00:00.00] Giai điệu ngân vang...\n[00:20.00] Lời ca của ${artist.name} chạm đến trái tim!`,
              plays: Math.floor(Math.random() * 3000) + 800,
              isPublic: true,
              albumId: album.id
            }
          });

          await prisma.songArtist.create({
            data: { songId: newSong.id, artistId: artist.id }
          });
          console.log(`  + Đã tạo bài hát: ${sTitle}`);
        }
      }
    }
  }

  console.log("\n✅ Hoàn tất! Tất cả nghệ sĩ hiện đã có đầy đủ Album và Bài hát.");
}

main()
  .catch((e) => console.error("❌ Lỗi seeder:", e))
  .finally(() => prisma.$disconnect());
