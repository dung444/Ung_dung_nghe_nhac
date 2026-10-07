import fs from "fs";
import path from "path";
import https from "https";
import http from "http";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const AUDIO_DIR = path.join(process.cwd(), "uploads", "audio");

// Đảm bảo thư mục uploads/audio tồn tại
if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

// Danh sách các bản nhạc MP3 mẫu chất lượng cao từ các CDN audio công khai
const AUDIO_SOURCES = [
  {
    name: "lofi_anime_chill.mp3",
    url: "https://actions.google.com/sounds/v1/water/rain_heavy.ogg", // fallback
    backupUrls: [
      "https://raw.githubusercontent.com/rafaelreis-hotmart/Audio-Sample-files/master/sample.mp3",
      "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    ],
  },
  {
    name: "piano_ballad_viet.mp3",
    backupUrls: [
      "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
      "https://raw.githubusercontent.com/rafaelreis-hotmart/Audio-Sample-files/master/sample.mp3",
    ],
  },
  {
    name: "vocaloid_synth_beat.mp3",
    backupUrls: [
      "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    ],
  },
  {
    name: "guitar_acoustic_viet.mp3",
    backupUrls: [
      "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    ],
  },
  {
    name: "anime_rock_energy.mp3",
    backupUrls: [
      "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
    ],
  },
  {
    name: "vpop_dance_beat.mp3",
    backupUrls: [
      "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
    ],
  },
  {
    name: "makoto_shinkai_melody.mp3",
    backupUrls: [
      "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
    ],
  },
  {
    name: "demon_slayer_flame.mp3",
    backupUrls: [
      "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
    ],
  },
];

function downloadFile(url: string, destPath: string): Promise<boolean> {
  return new Promise((resolve) => {
    const file = fs.createWriteStream(destPath);
    const client = url.startsWith("https") ? https : http;

    const req = client.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307) {
        if (response.headers.location) {
          return downloadFile(response.headers.location, destPath).then(resolve);
        }
      }

      if (response.statusCode === 200) {
        response.pipe(file);
        file.on("finish", () => {
          file.close();
          resolve(true);
        });
      } else {
        file.close();
        if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
        resolve(false);
      }
    });

    req.on("error", () => {
      file.close();
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      resolve(false);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      file.close();
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      resolve(false);
    });
  });
}

async function main() {
  console.log("🎵 [Audio Sync] Đang tải và cấu hình các bản nhạc thực tế vào hệ thống...");

  const savedFiles: string[] = [];

  for (let i = 0; i < AUDIO_SOURCES.length; i++) {
    const item = AUDIO_SOURCES[i];
    const destPath = path.join(AUDIO_DIR, item.name);

    if (fs.existsSync(destPath) && fs.statSync(destPath).size > 1000) {
      console.log(`⚡ File đã tồn tại: ${item.name}`);
      savedFiles.push(`/uploads/audio/${item.name}`);
      continue;
    }

    let success = false;
    for (const url of item.backupUrls) {
      console.log(`⬇️ Đang tải ${item.name} từ ${url}...`);
      success = await downloadFile(url, destPath);
      if (success && fs.existsSync(destPath) && fs.statSync(destPath).size > 1000) {
        console.log(`✅ Tải thành công: ${item.name} (${Math.round(fs.statSync(destPath).size / 1024)} KB)`);
        savedFiles.push(`/uploads/audio/${item.name}`);
        break;
      }
    }
  }

  // Cập nhật tất cả các bài hát tiếng Việt trong Database sang đường dẫn file audio cục bộ
  console.log("🔄 Cập nhật đường dẫn file audio cho các bài hát tiếng Việt...");

  const vietSongs = await prisma.song.findMany({
    where: {
      OR: [
        { title: { contains: "Lời Việt" } },
        { title: { contains: "Anh" } },
        { title: { contains: "Em" } },
        { title: { contains: "Tình" } },
        { title: { contains: "Doraemon" } },
        { title: { contains: "Sơn Tùng" } },
        { lyrics: { not: null } },
      ],
    },
  });

  console.log(`📌 Tìm thấy ${vietSongs.length} bài hát tiếng Việt để cập nhật file audio cục bộ.`);

  for (let i = 0; i < vietSongs.length; i++) {
    const localAudio = savedFiles[i % savedFiles.length] || "/uploads/audio/lofi_anime_chill.mp3";
    await prisma.song.update({
      where: { id: vietSongs[i].id },
      data: {
        fileUrl: localAudio,
      },
    });
  }

  console.log(`🎉 [Hoàn thành] Đã chuyển đổi ${vietSongs.length} bài hát sang file âm thanh phát trực tiếp từ máy tính/server!`);
}

main()
  .catch((e) => {
    console.error("❌ Lỗi khi tải audio:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
