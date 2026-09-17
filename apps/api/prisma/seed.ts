import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import path from "path";
import fs from "fs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Waifu Player database...");

  // ─── Clean existing data ────────────────────────────────────────────────────
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
  await prisma.songGenre.deleteMany();
  await prisma.artistGenre.deleteMany();
  await prisma.songArtist.deleteMany();
  await prisma.song.deleteMany();
  await prisma.album.deleteMany();
  await prisma.genre.deleteMany();
  await prisma.artist.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  // ─── Genres ─────────────────────────────────────────────────────────────────
  const genres = await Promise.all([
    prisma.genre.create({ data: { name: "J-Pop", slug: "j-pop" } }),
    prisma.genre.create({ data: { name: "Anime OST", slug: "anime-ost" } }),
    prisma.genre.create({ data: { name: "Lo-fi", slug: "lo-fi" } }),
    prisma.genre.create({ data: { name: "Electronic", slug: "electronic" } }),
    prisma.genre.create({ data: { name: "Vocaloid", slug: "vocaloid" } }),
  ]);
  console.log(`✅ Created ${genres.length} genres`);

  // ─── Users ──────────────────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash("admin123456", 12);
  const userHash = await bcrypt.hash("user123456", 12);

  const admin = await prisma.user.create({
    data: {
      email: "admin@waifu-player.dev",
      username: "admin",
      displayName: "Admin",
      passwordHash: adminHash,
      role: "ADMIN",
      isPremium: true,
    },
  });

  const user1 = await prisma.user.create({
    data: {
      email: "sakura@example.com",
      username: "sakura_chan",
      displayName: "Sakura",
      passwordHash: userHash,
      role: "USER",
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: "miku@example.com",
      username: "miku_fan",
      displayName: "Miku Fan",
      passwordHash: userHash,
      role: "USER",
    },
  });

  console.log(`✅ Created 3 users`);

  // ─── Artists ─────────────────────────────────────────────────────────────────
  const artist1 = await prisma.artist.create({
    data: {
      name: "Hatsune Miku",
      bio: "The world-famous Vocaloid produced by Crypton Future Media.",
      verified: true,
    },
  });

  const artist2 = await prisma.artist.create({
    data: {
      name: "LiSA",
      bio: "Japanese singer known for Gurenge, Crossing Field, and more anime hits.",
      verified: true,
    },
  });

  const artist3 = await prisma.artist.create({
    data: {
      name: "Yoasobi",
      bio: "J-Pop duo known for turning novels into music.",
      verified: true,
    },
  });

  // Connect artists to genres
  await prisma.artistGenre.createMany({
    data: [
      { artistId: artist1.id, genreId: genres[4].id }, // Vocaloid
      { artistId: artist1.id, genreId: genres[0].id }, // J-Pop
      { artistId: artist2.id, genreId: genres[0].id }, // J-Pop
      { artistId: artist2.id, genreId: genres[1].id }, // Anime OST
      { artistId: artist3.id, genreId: genres[0].id }, // J-Pop
    ],
  });

  console.log(`✅ Created 3 artists`);

  // ─── Albums ──────────────────────────────────────────────────────────────────
  const album1 = await prisma.album.create({
    data: {
      title: "Miku Anthology",
      artistId: artist1.id,
      releaseDate: new Date("2023-03-09"),
    },
  });

  const album2 = await prisma.album.create({
    data: {
      title: "Demon Slayer OST",
      artistId: artist2.id,
      releaseDate: new Date("2019-10-16"),
    },
  });

  const album3 = await prisma.album.create({
    data: {
      title: "The Book",
      artistId: artist3.id,
      releaseDate: new Date("2021-01-06"),
    },
  });

  console.log(`✅ Created 3 albums`);

  // ─── Songs ───────────────────────────────────────────────────────────────────
  // Note: fileUrl points to placeholder paths; replace with real audio files
  const songsData = [
    { title: "World is Mine", duration: 225, albumId: album1.id, artistId: artist1.id, genreIds: [genres[4].id, genres[0].id] },
    { title: "Freely Tomorrow", duration: 197, albumId: album1.id, artistId: artist1.id, genreIds: [genres[4].id] },
    { title: "Romeo and Cinderella", duration: 247, albumId: album1.id, artistId: artist1.id, genreIds: [genres[4].id, genres[0].id] },
    { title: "Gurenge", duration: 258, albumId: album2.id, artistId: artist2.id, genreIds: [genres[0].id, genres[1].id] },
    { title: "Crossing Field", duration: 247, albumId: album2.id, artistId: artist2.id, genreIds: [genres[0].id, genres[1].id] },
    { title: "Unlasting", duration: 270, albumId: album2.id, artistId: artist2.id, genreIds: [genres[0].id] },
    { title: "Idol", duration: 212, albumId: album3.id, artistId: artist3.id, genreIds: [genres[0].id] },
    { title: "夜に駆ける (Yoru ni Kakeru)", duration: 253, albumId: album3.id, artistId: artist3.id, genreIds: [genres[0].id] },
    { title: "怪物 (Kaibutsu)", duration: 251, albumId: album3.id, artistId: artist3.id, genreIds: [genres[0].id, genres[1].id] },
    { title: "セイカイ (Seikai)", duration: 238, albumId: album3.id, artistId: artist3.id, genreIds: [genres[0].id] },
  ];

  const createdSongs = [];
  for (const s of songsData) {
    const song = await prisma.song.create({
      data: {
        title: s.title,
        duration: s.duration,
        fileUrl: `/uploads/audio/placeholder-${s.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.mp3`,
        albumId: s.albumId,
        plays: Math.floor(Math.random() * 500000),
        isPublic: true,
      },
    });

    await prisma.songArtist.create({ data: { songId: song.id, artistId: s.artistId } });
    await prisma.songGenre.createMany({
      data: s.genreIds.map((genreId) => ({ songId: song.id, genreId })),
    });

    createdSongs.push(song);
  }

  console.log(`✅ Created ${createdSongs.length} songs`);

  // ─── Sample Playlists ─────────────────────────────────────────────────────────
  const playlist1 = await prisma.playlist.create({
    data: { name: "My Waifu Playlist 💕", userId: user1.id, isPublic: true },
  });

  await prisma.playlistSong.createMany({
    data: createdSongs.slice(0, 5).map((song, idx) => ({
      playlistId: playlist1.id,
      songId: song.id,
      position: idx,
    })),
  });

  const playlist2 = await prisma.playlist.create({
    data: { name: "Anime Bangers 🔥", userId: user2.id, isPublic: true },
  });

  await prisma.playlistSong.createMany({
    data: createdSongs.slice(3, 9).map((song, idx) => ({
      playlistId: playlist2.id,
      songId: song.id,
      position: idx,
    })),
  });

  console.log(`✅ Created 2 playlists`);

  // ─── Sample Likes & History ───────────────────────────────────────────────────
  await prisma.likedSong.createMany({
    data: [
      { userId: user1.id, songId: createdSongs[0].id },
      { userId: user1.id, songId: createdSongs[3].id },
      { userId: user2.id, songId: createdSongs[6].id },
      { userId: user2.id, songId: createdSongs[7].id },
    ],
  });

  await prisma.userFollowArtist.createMany({
    data: [
      { userId: user1.id, artistId: artist1.id },
      { userId: user1.id, artistId: artist2.id },
      { userId: user2.id, artistId: artist3.id },
    ],
  });

  console.log(`✅ Created sample likes & follows`);

  console.log("\n🎉 Seed complete!");
  console.log("─────────────────────────────────────");
  console.log("👤 Admin:  admin@waifu-player.dev / admin123456");
  console.log("👤 User 1: sakura@example.com / user123456");
  console.log("👤 User 2: miku@example.com / user123456");
  console.log("─────────────────────────────────────");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
