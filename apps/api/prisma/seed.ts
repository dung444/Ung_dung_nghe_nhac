import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import crypto from "crypto";

const prisma = new PrismaClient();

// ─── Curated Image Assets ──────────────────────────────────────────────────
const ANIME_COVERS = [
  "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&q=80",
  "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&q=80",
  "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&q=80",
  "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80",
  "https://images.unsplash.com/photo-1563089145-599997674d42?w=600&q=80",
  "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&q=80",
  "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80",
  "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80",
  "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&q=80",
  "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=600&q=80",
  "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600&q=80",
  "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&q=80",
  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&q=80",
  "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&q=80",
  "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&q=80",
  "https://images.unsplash.com/photo-1526478806334-5fd488fcaabc?w=600&q=80",
  "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&q=80",
  "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&q=80",
  "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=600&q=80",
  "https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=600&q=80",
];

const ANIME_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&q=80",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80",
  "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&q=80",
  "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=200&q=80",
  "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=200&q=80",
];

// Audio URL pools for 100% playable streaming
const AUDIO_STREAMS = Array.from({ length: 16 }, (_, i) => `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${i + 1}.mp3`);

const GENRE_DEFINITIONS = [
  { name: "J-Pop", slug: "j-pop" },
  { name: "Anime OST", slug: "anime-ost" },
  { name: "Vocaloid", slug: "vocaloid" },
  { name: "Lo-fi Anime", slug: "lo-fi" },
  { name: "J-Rock", slug: "j-rock" },
  { name: "Electronic", slug: "electronic" },
  { name: "City Pop", slug: "city-pop" },
  { name: "Kawaii Future Bass", slug: "kawaii-future-bass" },
];

const ARTIST_DEFINITIONS = [
  { name: "Hatsune Miku", bio: "The world-famous Vocaloid Diva produced by Crypton Future Media." },
  { name: "LiSA", bio: "Renowned Japanese singer known for Gurenge, Crossing Field, and Demon Slayer OST." },
  { name: "YOASOBI", bio: "Superstar J-Pop duo creating chart-topping hits inspired by novels." },
  { name: "Ado", bio: "Powerful Utaite sensation known for Usseewa and One Piece Film: Red tracks." },
  { name: "Aimer", bio: "Distinctive husky vocalist beloved for Fate/stay night and Demon Slayer themes." },
  { name: "Kenshi Yonezu", bio: "Genius singer-songwriter behind Lemon, Kick Back, and Peace Sign." },
  { name: "Eve", bio: "Utaite-turned-indie rock star known for Jujutsu Kaisen opening Kaikai Kitan." },
  { name: "Yorushika", bio: "Melodic rock duo with poetic storytelling and captivating piano chords." },
  { name: "RADWIMPS", bio: "Iconic Japanese rock band famed for Makoto Shinkai's Your Name & Weathering With You." },
  { name: "SawanoHiroyuki[nZk]", bio: "Epic composer and orchestral powerhouse behind Attack on Titan & Solo Leveling." },
  { name: "ClariS", bio: "Beloved anisong duo famous for Madoka Magica and Lycoris Recoil themes." },
  { name: "FLOW", bio: "Legendary anime rock band behind Naruto, Code Geass, and Eureka Seven." },
  { name: "Linked Horizon", bio: "Dramatic symphonic rock group celebrated for Guren no Yumiya & Shinzou wo Sasageyo." },
  { name: "Minami", bio: "Passionate singer-songwriter known for Domestic Girlfriend's Crying for Rain." },
  { name: "ReoNa", bio: "Poetic anime singer known for Sword Art Online and Tsukihime themes." },
  { name: "Kagamine Rin & Len", bio: "Popular dual Vocaloid performers with energetic synth melodies." },
  { name: "Megurine Luka", bio: "Sophisticated Vocaloid diva recognized for Double Lariat & Just Be Friends." },
  { name: "myth & roid", bio: "Avant-garde anisong unit behind Re:Zero and Overlord soundtrack anthems." },
  { name: "Kana-Boon", bio: "High-energy rock band known for Silhouette (Naruto Shippuden OP16)." },
  { name: "EGOIST", bio: "Fictional artist unit produced by ryo (supercell) for Guilty Crown & Psycho-Pass." },
];

const SONG_TITLE_TEMPLATES = [
  "Sakura Memories", "Blazing Spark", "Cybernetic Love", "Midnight Tokyo Drift", "Starlight Symphony",
  "Gurenge Remastered", "World is Mine (Live)", "Idol Symphony", "Racing into the Night", "Blue Bird Horizon",
  "Silhouette of Destiny", "Guren no Yumiya", "Kaikai Kitan", "Sparkle Across Skies", "Zankyo Sanka",
  "Shinzou wo Sasageyo", "Crossing Fate", "Unlasting Whispers", "Homura Requiem", "Suzume no Tojimari",
  "Grand Escape", "Theme of Rem", "Asphyxia", "Cry Baby", "Brave Shine",
  "Catch the Moment", "Hikaru Nara", "Kibou no Uta", "Only My Railgun", "God Knows...",
  "Renai Circulation", "Cruel Angel's Thesis", "Zenzenzense", "Nandemonai ya", "Inferno Blaze",
  "Shinunoga E-Wa", "Stay With Me (Anime Edit)", "Fly Me to the Moon", "Lost in Paradise", "Kizuna no Kiseki",
  "Chainsaw Beat", "Specialz Distortion", "Bling-Bang-Bang-Born", "Abyss Calling", "Kawaikute Gomen",
  "Telecaster B-Boy", "Rolling Girl Revival", "Melt Forever", "Senbonzakura Overdrive", "Ghost Rule",
  "Vampire Protocol", "King (Vocaloid Cover)", "Lagtrain Nostalgia", "Young Girl A", "Goodbye Declaration",
  "Brain Fluid Explosion Girl", "Matryoshka", "The Disappearance of Miku", "Two-Faced Lovers", "Deep Sea Girl",
  "Romeo and Cinderella", "Tell Your World", "Sweet Devil", "Alien Alien", "Solar System Disco",
  "Otome Dissection", "Unknown Mother-Goose", "Luka Luka Night Fever", "Magnet Secret", "Torinoko City",
  "Fire Flower", "Just Be Friends", "Kokoro Heartbeat", "Servant of Evil", "Daughter of Evil",
  "Double Lariat", "Lost One's Weeping", "Tokyo Teddy Bear", "How-To World Domination", "Envy Baby",
  "Night Dancer", "Overdose Romance", "Chururira Chururira", "Cendrillon", "Cantarella",
  "Akatsuki Arrival", "Ah, It's a Wonderful Cat Life", "Childish War", "Bring It On", "Gimme×Gimme",
];

const USERNAME_BASES = [
  "sakura", "miku", "rin", "len", "luka", "asuna", "kirito", "rem", "ram", "emilia",
  "naruto", "sasuke", "itachi", "tanjiro", "nezuko", "zenitsu", "giyu", "levi", "eren", "mikasa",
  "gojo", "megumi", "nobara", "sukuna", "marin", "yor", "anya", "loid", "frieren", "fern",
  "stark", "himmel", "shinobu", "kanawo", "tengen", "rengoku", "muichiro", "chika", "kaguya", "shirogane",
  "aqua", "ruby", "kana", "memcho", "bocchi", "nijika", "ryo", "ikuyo", "violet", "megumin",
  "darkness", "kazuma", "yunyun", "holo", "lawrence", "albedo", "shalltear", "ainz", "rimuru", "shion",
];

async function main() {
  console.log("🌸 [Waifu Player Seeder] Starting 500 Songs & 300 Users generation...");

  // 1. Clean existing records
  console.log("🧹 Clearing old database records...");
  await prisma.notification.deleteMany();
  await prisma.roomQueueItem.deleteMany();
  await prisma.roomParticipant.deleteMany();
  await prisma.room.deleteMany();
  await prisma.queueItem.deleteMany();
  await prisma.playlistSong.deleteMany();
  await prisma.playlist.deleteMany();
  await prisma.listeningHistory.deleteMany();
  await prisma.likedSong.deleteMany();
  await prisma.userFollowArtist.deleteMany();
  await prisma.copyrightClaim.deleteMany();
  await prisma.songCopyright.deleteMany();
  await prisma.songGenre.deleteMany();
  await prisma.artistGenre.deleteMany();
  await prisma.songArtist.deleteMany();
  await prisma.song.deleteMany();
  await prisma.album.deleteMany();
  await prisma.genre.deleteMany();
  await prisma.artist.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create Genres
  console.log("🎵 Creating Genres...");
  const createdGenres = await Promise.all(
    GENRE_DEFINITIONS.map((g) =>
      prisma.genre.create({ data: { id: crypto.randomUUID(), name: g.name, slug: g.slug } })
    )
  );
  console.log(`✅ Created ${createdGenres.length} genres`);

  // 3. Create 300 Users
  console.log("👥 Generating 300 Users (1 Admin, 30 Artists/Creators, 269 Community Users)...");
  const commonPasswordHash = await bcrypt.hash("user123456", 10);
  const adminPasswordHash = await bcrypt.hash("admin123456", 10);

  const usersData: any[] = [];

  // Super Admin
  usersData.push({
    id: crypto.randomUUID(),
    email: "admin@waifu-player.dev",
    username: "admin",
    displayName: "Admin Waifu",
    passwordHash: adminPasswordHash,
    role: "ADMIN",
    isPremium: true,
    avatarUrl: ANIME_AVATARS[0],
  });

  // Regular Users & Fans (299 users)
  for (let i = 1; i <= 299; i++) {
    const baseName = USERNAME_BASES[i % USERNAME_BASES.length];
    const suffix = Math.floor(i / USERNAME_BASES.length) > 0 ? `_${Math.floor(i / USERNAME_BASES.length)}` : "";
    const username = `${baseName}${suffix}_${i}`;
    const displayName = `${baseName.charAt(0).toUpperCase() + baseName.slice(1)} Waifu #${i}`;
    const isVip = i % 3 === 0;
    const isArtist = i <= 20;

    usersData.push({
      id: crypto.randomUUID(),
      email: `${username}@waifu-player.dev`,
      username,
      displayName,
      passwordHash: commonPasswordHash,
      role: isArtist ? "ARTIST" : "USER",
      isPremium: isVip,
      avatarUrl: ANIME_AVATARS[i % ANIME_AVATARS.length],
    });
  }

  await prisma.user.createMany({ data: usersData });
  console.log(`✅ Inserted ${usersData.length} Users`);

  // 4. Create Artists
  console.log("🎤 Creating 20 Featured Artists...");
  const createdArtists: any[] = [];
  for (let idx = 0; idx < ARTIST_DEFINITIONS.length; idx++) {
    const def = ARTIST_DEFINITIONS[idx];
    const userAccount = usersData[idx + 1]; // link to artist users
    const artist = await prisma.artist.create({
      data: {
        id: crypto.randomUUID(),
        name: def.name,
        bio: def.bio,
        avatarUrl: ANIME_AVATARS[idx % ANIME_AVATARS.length],
        coverUrl: ANIME_COVERS[idx % ANIME_COVERS.length],
        verified: true,
        userId: userAccount.id,
      },
    });
    createdArtists.push(artist);

    // Link Artist to 2 genres
    const genre1 = createdGenres[idx % createdGenres.length];
    const genre2 = createdGenres[(idx + 1) % createdGenres.length];
    await prisma.artistGenre.createMany({
      data: [
        { artistId: artist.id, genreId: genre1.id },
        { artistId: artist.id, genreId: genre2.id },
      ],
      skipDuplicates: true,
    });
  }
  console.log(`✅ Created ${createdArtists.length} Artists with genres`);

  // 5. Create 40 Albums
  console.log("💿 Creating 40 Albums across Artists...");
  const createdAlbums: any[] = [];
  for (let i = 0; i < 40; i++) {
    const artist = createdArtists[i % createdArtists.length];
    const album = await prisma.album.create({
      data: {
        id: crypto.randomUUID(),
        title: `${artist.name} Collection Vol. ${Math.floor(i / createdArtists.length) + 1}`,
        coverUrl: ANIME_COVERS[i % ANIME_COVERS.length],
        artistId: artist.id,
        releaseDate: new Date(2020 + (i % 6), (i % 12), (i % 28) + 1),
      },
    });
    createdAlbums.push(album);
  }
  console.log(`✅ Created ${createdAlbums.length} Albums`);

  // 6. Generate 500 Songs
  console.log("🎵 Generating 500 Songs with real streaming audio...");
  const songsData: any[] = [];
  const songArtistData: any[] = [];
  const songGenreData: any[] = [];
  const copyrightData: any[] = [];

  for (let i = 0; i < 500; i++) {
    const songId = crypto.randomUUID();
    const templateTitle = SONG_TITLE_TEMPLATES[i % SONG_TITLE_TEMPLATES.length];
    const roundNumber = Math.floor(i / SONG_TITLE_TEMPLATES.length);
    const title = roundNumber > 0 ? `${templateTitle} [Mix ${roundNumber + 1}]` : templateTitle;

    const artist = createdArtists[i % createdArtists.length];
    const album = createdAlbums[i % createdAlbums.length];
    const genre = createdGenres[i % createdGenres.length];
    const audioStream = AUDIO_STREAMS[i % AUDIO_STREAMS.length];
    const coverUrl = ANIME_COVERS[i % ANIME_COVERS.length];
    const duration = 180 + ((i * 17) % 140); // 180s - 320s
    const plays = Math.floor(Math.random() * 850000) + 12000;

    songsData.push({
      id: songId,
      title,
      duration,
      fileUrl: audioStream,
      coverUrl,
      plays,
      isPublic: true,
      albumId: album.id,
      releaseDate: new Date(2022 + (i % 4), (i % 12), (i % 28) + 1),
    });

    songArtistData.push({ songId, artistId: artist.id });
    songGenreData.push({ songId, genreId: genre.id });

    // Every 5th song add a secondary genre
    if (i % 5 === 0) {
      const secGenre = createdGenres[(i + 3) % createdGenres.length];
      songGenreData.push({ songId, genreId: secGenre.id });
    }

    // Auto-generate Copyright Certificate
    const isrc = `VN-WFP-2026-${String(10000 + i).padStart(5, "0")}`;
    copyrightData.push({
      id: crypto.randomUUID(),
      songId,
      ownerName: artist.name,
      licenseType: i % 4 === 0 ? "CREATIVE_COMMONS" : i % 7 === 0 ? "ROYALTY_FREE" : "ALL_RIGHTS_RESERVED",
      isrc,
      copyrightYear: 2026,
      distributionRights: "GLOBAL",
      allowRemix: i % 3 === 0,
      commercialUse: i % 2 === 0,
      status: "ACTIVE",
      registeredById: usersData[0].id,
    });
  }

  // Insert batch songs
  await prisma.song.createMany({ data: songsData });
  await prisma.songArtist.createMany({ data: songArtistData, skipDuplicates: true });
  await prisma.songGenre.createMany({ data: songGenreData, skipDuplicates: true });
  await prisma.songCopyright.createMany({ data: copyrightData, skipDuplicates: true });

  console.log(`✅ Successfully seeded 500 Songs with Artist & Genre links & ISRC Copyrights`);

  // 7. Seed Sample Playlists, Likes & History
  console.log("📑 Generating Community Playlists and User History...");
  const playlistRecords: any[] = [];
  const playlistSongRecords: any[] = [];
  const likedRecords: any[] = [];
  const historyRecords: any[] = [];

  for (let pIdx = 0; pIdx < 25; pIdx++) {
    const playlistId = crypto.randomUUID();
    const user = usersData[pIdx + 1];
    playlistRecords.push({
      id: playlistId,
      name: `Anime Bangers & Waifu Vibes #${pIdx + 1}`,
      description: "Tuyển tập những ca khúc Anime & Vocaloid đỉnh cao được cộng đồng yêu thích nhất.",
      coverUrl: ANIME_COVERS[pIdx % ANIME_COVERS.length],
      isPublic: true,
      userId: user.id,
    });

    for (let sIdx = 0; sIdx < 15; sIdx++) {
      const song = songsData[(pIdx * 15 + sIdx) % songsData.length];
      playlistSongRecords.push({
        playlistId,
        songId: song.id,
        position: sIdx,
      });
    }
  }

  await prisma.playlist.createMany({ data: playlistRecords });
  await prisma.playlistSong.createMany({ data: playlistSongRecords });

  // Generate likes & history for the first 100 users
  for (let uIdx = 0; uIdx < 100; uIdx++) {
    const user = usersData[uIdx];
    for (let k = 0; k < 8; k++) {
      const song = songsData[(uIdx * 7 + k) % songsData.length];
      likedRecords.push({
        userId: user.id,
        songId: song.id,
      });
      historyRecords.push({
        id: crypto.randomUUID(),
        userId: user.id,
        songId: song.id,
        playedAt: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 3600 * 1000)),
        durationPlayed: song.duration,
      });
    }
  }

  await prisma.likedSong.createMany({ data: likedRecords, skipDuplicates: true });
  await prisma.listeningHistory.createMany({ data: historyRecords });

  console.log(`✅ Generated ${playlistRecords.length} Playlists, ${likedRecords.length} Likes, ${historyRecords.length} Listening History entries`);

  console.log("\n🎉 SEED HOÀN TẤT THÀNH CÔNG! 🎉");
  console.log("──────────────────────────────────────────────────────────");
  console.log(`📊 Tổng người dùng (Users):   ${usersData.length} (300 tài khoản)`);
  console.log(`🎵 Tổng bài hát (Songs):      ${songsData.length} (500 bài hát)`);
  console.log(`🎤 Tổng nghệ sĩ (Artists):    ${createdArtists.length} (20 Diva & Ca sĩ Anime)`);
  console.log(`💿 Tổng Album:                ${createdAlbums.length} albums`);
  console.log(`📑 Tổng Danh sách phát:       ${playlistRecords.length} playlists`);
  console.log("──────────────────────────────────────────────────────────");
  console.log("👑 Quản Trị Viên:  admin@waifu-player.dev / admin123456 (Username: admin)");
  console.log("👤 Người dùng mẫu: sakura_1@waifu-player.dev / user123456");
  console.log("──────────────────────────────────────────────────────────");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
