import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../../app";
import { prisma } from "../../config/database";

const app = createApp();

describe("Creator Studio Endpoints", () => {
  let creatorToken: string;
  let creatorUserId: string;
  let createdSongId: string;
  let createdAlbumId: string;

  beforeAll(async () => {
    // 1. Create creator user
    const creatorUser = {
      email: "creator_test@waifu.test",
      username: "creator_test",
      password: "Password123!",
      displayName: "DJ Miku Producer",
    };
    const regRes = await request(app).post("/api/v1/auth/register").send(creatorUser);
    creatorUserId = regRes.body.data.user.id;
    creatorToken = regRes.body.data.accessToken;
  });

  afterAll(async () => {
    if (createdSongId) {
      await prisma.songCopyright.deleteMany({ where: { songId: createdSongId } });
      await prisma.songArtist.deleteMany({ where: { songId: createdSongId } });
      await prisma.song.deleteMany({ where: { id: createdSongId } });
    }
    if (createdAlbumId) {
      await prisma.album.deleteMany({ where: { id: createdAlbumId } });
    }
    await prisma.artist.deleteMany({ where: { userId: creatorUserId } });
    await prisma.user.deleteMany({ where: { id: creatorUserId } });
    await prisma.$disconnect();
  });

  it("should register as creator and initialize artist profile", async () => {
    const res = await request(app)
      .post("/api/v1/creator/register")
      .set("Authorization", `Bearer ${creatorToken}`)
      .send({
        name: "DJ Miku Producer",
        bio: "Specializing in Vocaloid & Anime Lo-fi vibes",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe("DJ Miku Producer");
    expect(res.body.data.userId).toBe(creatorUserId);
  });

  it("should get creator studio metrics", async () => {
    const res = await request(app)
      .get("/api/v1/creator/studio")
      .set("Authorization", `Bearer ${creatorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.artist.name).toBe("DJ Miku Producer");
    expect(typeof res.body.data.totalSongs).toBe("number");
    expect(typeof res.body.data.totalFollowers).toBe("number");
    expect(typeof res.body.data.estimatedEarnings).toBe("number");
  });

  it("should publish a new song from creator studio with copyright auto-registration", async () => {
    const res = await request(app)
      .post("/api/v1/creator/songs")
      .set("Authorization", `Bearer ${creatorToken}`)
      .send({
        title: "Sunset over Akihabara",
        duration: 215,
        fileUrl: "/uploads/audio/sunset_akiba.mp3",
        coverUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80",
        licenseType: "CREATIVE_COMMONS",
        commercialUse: true,
        allowRemix: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe("Sunset over Akihabara");
    createdSongId = res.body.data.id;
  });

  it("should list creator's own published songs", async () => {
    const res = await request(app)
      .get("/api/v1/creator/songs")
      .set("Authorization", `Bearer ${creatorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.some((s: any) => s.id === createdSongId)).toBe(true);
  });

  it("should create a new album for creator", async () => {
    const res = await request(app)
      .post("/api/v1/creator/albums")
      .set("Authorization", `Bearer ${creatorToken}`)
      .send({
        title: "Tokyo Cyberpunk Dreams Vol. 1",
        coverUrl: "https://images.unsplash.com/photo-1563089145-599997674d42?w=400&q=80",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe("Tokyo Cyberpunk Dreams Vol. 1");
    createdAlbumId = res.body.data.id;
  });

  it("should delete a creator's own song", async () => {
    const res = await request(app)
      .delete(`/api/v1/creator/songs/${createdSongId}`)
      .set("Authorization", `Bearer ${creatorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    createdSongId = ""; // Marked deleted
  });
});
