import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const INSTRUMENTAL_TITLES = [
  "Fade", "Candyland", "Blank VIP", "Adventure", "Forces", "Spectre",
  "Clouds", "Fly", "Skyward Bound", "Feel Good", "Colorblind", "Destiny",
  "Dreams pt.II", "Pentakill", "MATAFAKA", "Mutiny", "Chasing Dreams",
  "Close", "Taking Control", "Where We Started",
  "Cây Trúc Xinh", "Lý Ngựa Ô", "Đi Cấy", "Lý Kéo Chài",
  "Lý Trái Mướp", "Lý Bán Đon", "Xe Chỉ Luồn Kim", "Ru Con Nam Bộ"
];

async function main() {
  console.log("Setting lyrics = null for instrumental tracks...");
  const res = await prisma.song.updateMany({
    where: { title: { in: INSTRUMENTAL_TITLES } },
    data: { lyrics: null }
  });
  console.log(`Updated ${res.count} songs as Instrumental.`);

  const total = await prisma.song.count();
  const withLyrics = await prisma.song.count({ where: { NOT: { lyrics: null } } });
  const withoutLyrics = await prisma.song.count({ where: { lyrics: null } });
  console.log({ total, withLyrics, withoutLyrics });
}

main().finally(() => prisma.$disconnect());
