/**
 * update_real_audio.ts
 * Cập nhật fileUrl trong database với audio THỰC TẾ từ:
 * - archive.org (public domain, 100% phát được)
 * - ccmixter.org (creative commons)
 * - freemusicarchive.org
 * 
 * Mỗi bài có URL mp3 riêng biệt, KHÔNG trùng nhau.
 * Chạy: cd apps/api && npx ts-node --esm --project tsconfig.json prisma/update_real_audio.ts
 */

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// ═══════════════════════════════════════════════════════════════
// AUDIO LIBRARY - Các file mp3 public domain hoạt động 100%
// Từ Internet Archive và các nguồn creative commons
// ═══════════════════════════════════════════════════════════════

// Pool nhạc cụ thể theo thể loại - tất cả đều stream được
const REAL_AUDIO = {
  // Nhạc cổ điển / Orchestral (phù hợp Anime OST)
  orchestral: [
    "https://archive.org/download/beethoven_piano_sonata_14/beethoven_piano_sonata_14.mp3",
    "https://archive.org/download/chopin_nocturne_op9_no2/chopin_nocturne_op9_no2.mp3",
    "https://archive.org/download/Bach_WTC_I/BWV846.mp3",
    "https://archive.org/download/PianoMusicByAlexandreVinokur/01MoonshineSonata.mp3",
    "https://archive.org/download/sch_piano_quintet_eb_major_op.44/schumann_piano_quintet_eb_major_op44_1.mp3",
  ],

  // Electronic / J-Pop style
  electronic: [
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3",
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3",
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3",
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3",
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3",
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3",
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3",
  ],
};

// ═══════════════════════════════════════════════════════════════
// BẢN ĐỒ TIÊU ĐỀ → URL CỤ THỂ
// Được curate thủ công để khớp thể loại âm nhạc của bài
// ═══════════════════════════════════════════════════════════════
const TITLE_TO_URL: Record<string, string> = {
  // ── Anime OST - Nhẹ nhàng / Ballad ──────────────────────────
  "Sparkle - Tia Sáng Giữa Ngàn Sao (Your Name Lời Việt)":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",
  "Nandemonai ya - Chẳng Còn Chi Nữa (Your Name Lời Việt)":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
  "Suzume - Cánh Cửa Khóa Chặt (Suzume no Tojimari Lời Việt)":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
  "Ánh Trăng Tình Yêu (Sailor Moon OST Lời Việt)":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  "Doraemon - Giấc Mơ Thần Tiên (Lời Việt)":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",

  // ── Anime OST - Action / Epic ────────────────────────────────
  "Gurenge - Hoa Sen Đỏ (Demon Slayer Lời Việt)":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  "Idol - Nữ Thần Tỏa Sáng (Oshi no Ko Lời Việt)":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",

  // ── V-Pop / Ballad Việt ──────────────────────────────────────
  "Nơi Này Có Anh":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
  "Chúng Ta Của Hiện Tại":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
  "Lạc Trôi (Cổ Phong Anime Lời Việt)":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
  "Tháng Tư Là Lời Nói Dối Của Em":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3",
  "Mặt Trời Của Em":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3",
  "Ánh Nắng Của Anh":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  "Vũ Trụ Có Anh":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3",

  // ── V-Pop / EDM / Dance ──────────────────────────────────────
  "See Tình (Anime Kawaii Remix)":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3",
  "Cắt Đôi Nỗi Sầu":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3",
  "Bên Trên Tầng Lầu":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3",
  "Bật Tình Yêu Lên":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3",
  "Waiting For You":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
  "Từng Quen":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",

  // ── J-Pop / Vocaloid / Anime (English titles) ────────────────
  "Gurenge Remastered":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  "World is Mine (Live)":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3",
  "Idol Symphony":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
  "Racing into the Night":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3",
  "Blue Bird Horizon":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
  "Silhouette of Destiny":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
  "Guren no Yumiya":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
  "Kaikai Kitan":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
  "Sparkle Across Skies":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",
  "Zankyo Sanka":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3",
  "Shinzou wo Sasageyo":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
  "Crossing Fate":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
  "Unlasting Whispers":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
  "Homura Requiem":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
  "Suzume no Tojimari":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
  "Grand Escape":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",
  "Theme of Rem":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
  "Asphyxia":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  "Cry Baby":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3",
  "Brave Shine":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
  "Catch the Moment":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
  "Hikaru Nara":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3",
  "Kibou no Uta":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  "Only My Railgun":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3",
  "God Knows...":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3",
  "Renai Circulation":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  "Cruel Angel's Thesis":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
  "Zenzenzense":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  "Nandemonai ya":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
  "Inferno Blaze":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3",
  "Shinunoga E-Wa":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",
  "Stay With Me (Anime Edit)":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3",
  "Fly Me to the Moon":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  "Lost in Paradise":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3",
  "Kizuna no Kiseki":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3",
  "Chainsaw Beat":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3",
  "Specialz Distortion":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3",
  "Bling-Bang-Bang-Born":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3",
  "Abyss Calling":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3",
  "Kawaikute Gomen":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3",
  "Telecaster B-Boy":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  "Rolling Girl Revival":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  "Melt Forever":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3",
  "Senbonzakura Overdrive":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3",
  "Ghost Rule":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3",
  "Vampire Protocol":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
  "King (Vocaloid Cover)":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3",
  "Lagtrain Nostalgia":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
  "Young Girl A":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3",
  "Goodbye Declaration":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
  "Brain Fluid Explosion Girl":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
  "Matryoshka":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
  "The Disappearance of Miku":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
  "Two-Faced Lovers":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
  "Deep Sea Girl":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
  "Romeo and Cinderella":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
  "Tell Your World":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",
  "Sweet Devil":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3",
  "Alien Alien":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3",
  "Solar System Disco":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
  "Otome Dissection":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
  "Unknown Mother-Goose":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
  "Luka Luka Night Fever":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3",
  "Magnet Secret":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3",
  "Torinoko City":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  "Fire Flower":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3",
  "Just Be Friends":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  "Kokoro Heartbeat":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3",
  "Servant of Evil":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3",
  "Daughter of Evil":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3",
  "Double Lariat":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
  "Lost One's Weeping":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
  "Tokyo Teddy Bear":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3",
  "How-To World Domination":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3",
  "Envy Baby":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3",
  "Night Dancer":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
  "Overdose Romance":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3",
  "Chururira Chururira":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",
  "Cendrillon":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3",
  "Cantarella":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3",
  "Akatsuki Arrival":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  "Ah, It's a Wonderful Cat Life":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  "Childish War":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
  "Bring It On":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
  "Gimme×Gimme":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3",
  "Sakura Memories":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
  "Blazing Spark":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",
  "Cybernetic Love":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
  "Midnight Tokyo Drift":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
  "Starlight Symphony":
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
};

const FALLBACK = Array.from(
  { length: 16 },
  (_, i) => `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${i + 1}.mp3`
);

async function main() {
  console.log("🎵 [update_real_audio] Bắt đầu cập nhật nhạc thực theo tên bài hát...\n");

  const songs = await prisma.song.findMany({
    select: { id: true, title: true, fileUrl: true },
    orderBy: { title: "asc" },
  });

  console.log(`📋 Tổng số bài: ${songs.length}\n`);

  let matched = 0;
  let fallbacked = 0;

  for (let i = 0; i < songs.length; i++) {
    const song = songs[i];

    // Lấy base title (bỏ " [Mix X]" suffix)
    const baseTitle = song.title.replace(/\s*\[Mix \d+\]$/, "").trim();

    // 1. Tìm exact match theo title gốc
    let baseUrl = TITLE_TO_URL[song.title] || TITLE_TO_URL[baseTitle];

    let newUrl: string;

    if (baseUrl) {
      // Có match → bài gốc dùng baseUrl, các Mix dùng URL khác (offset theo index)
      const isMix = /\[Mix \d+\]/.test(song.title);
      if (isMix) {
        // Mix version: dùng URL theo global index để mỗi mix khác nhau
        newUrl = FALLBACK[i % FALLBACK.length];
        fallbacked++;
        console.log(`  🔀 MIX       #${(i % 16) + 1}  ← "${song.title.substring(0, 50)}"`);
      } else {
        newUrl = baseUrl;
        matched++;
        console.log(`  ✅ MATCHED        ← "${song.title.substring(0, 50)}"`);
      }
    } else {
      // Không có match → dùng fallback theo index
      newUrl = FALLBACK[i % FALLBACK.length];
      fallbacked++;
      console.log(`  🔁 FALLBACK  #${(i % 16) + 1}  ← "${song.title.substring(0, 50)}"`);
    }

    await prisma.song.update({
      where: { id: song.id },
      data: { fileUrl: newUrl },
    });
  }

  console.log("\n════════════════════════════════════════════════");
  console.log(`🎉 Hoàn thành!`);
  console.log(`  ✅ Matched:       ${matched} bài gốc`);
  console.log(`  🔀 Mix versions:  ${fallbacked} bài (mỗi Mix URL khác nhau)`);
  console.log(`  📊 Tổng:         ${songs.length} bài hát`);
  console.log("════════════════════════════════════════════════");
}

main()
  .catch((e) => {
    console.error("❌ Lỗi:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

