import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../../app";
import { prisma } from "../../config/database";

const app = createApp();

describe("Songs Endpoints", () => {
  let userToken: string;
  let adminToken: string;
  let createdSongId: string;
  
  beforeAll(async () => {
    // Create test user and admin, login to get tokens
    const admin = { email: "admin@waifu.test", username: "admin", password: "Password123!" };
    const user = { email: "user@waifu.test", username: "user", password: "Password123!" };
    
    await request(app).post("/api/v1/auth/register").send(admin);
    await request(app).post("/api/v1/auth/register").send(user);
    
    await prisma.user.update({ where: { email: admin.email }, data: { role: "ADMIN" } });
    
    const adminRes = await request(app).post("/api/v1/auth/login").send({ email: admin.email, password: admin.password });
    adminToken = adminRes.body.data.accessToken;
    
    const userRes = await request(app).post("/api/v1/auth/login").send({ email: user.email, password: user.password });
    userToken = userRes.body.data.accessToken;
  });

  afterAll(async () => {
    await prisma.song.deleteMany({ where: { title: "Test Song" } });
    await prisma.user.deleteMany({ where: { email: { in: ["admin@waifu.test", "user@waifu.test"] } } });
    await prisma.$disconnect();
  });

  it("should list songs", async () => {
    const res = await request(app).get("/api/v1/songs");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("should handle string pagination query parameters correctly", async () => {
    const res = await request(app).get("/api/v1/songs?page=1&limit=5");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.pagination.limit).toBe(5);
    expect(res.body.pagination.page).toBe(1);
  });

  it("should fail to create a song if not admin", async () => {
    const res = await request(app)
      .post("/api/v1/songs")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ title: "Test Song", duration: 120 });
    
    expect(res.status).toBe(403);
  });
  
  it("should fail to create a song without audio file even if admin", async () => {
    const res = await request(app)
      .post("/api/v1/songs")
      .set("Authorization", `Bearer ${adminToken}`)
      .field("title", "Test Song")
      .field("duration", 120);
    
    expect(res.status).toBe(400); // Because audio file is missing
  });

  it("should record play count and listening history when user listens to a song", async () => {
    // Find an existing song
    const song = await prisma.song.findFirst();
    if (song) {
      const initialPlays = song.plays;
      const res = await request(app)
        .post(`/api/v1/songs/${song.id}/play`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const updated = await prisma.song.findUnique({ where: { id: song.id } });
      expect(updated?.plays).toBe(initialPlays + 1);
    }
  });

  it("should toggle like status for a song", async () => {
    const song = await prisma.song.findFirst();
    if (song) {
      // Like
      const likeRes = await request(app)
        .post(`/api/v1/songs/${song.id}/like`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(likeRes.status).toBe(200);
      expect(likeRes.body.data.liked).toBe(true);

      // Unlike
      const unlikeRes = await request(app)
        .post(`/api/v1/songs/${song.id}/like`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(unlikeRes.status).toBe(200);
      expect(unlikeRes.body.data.liked).toBe(false);
    }
  });

  it("should return 404 when recording play for a non-existent song", async () => {
    const res = await request(app)
      .post("/api/v1/songs/non-existent-uuid/play")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(404);
  });

  it("should NOT increment play count if durationPlayed is under 30 seconds", async () => {
    const song = await prisma.song.findFirst();
    if (song) {
      const initialPlays = song.plays;
      const res = await request(app)
        .post(`/api/v1/songs/${song.id}/play`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ durationPlayed: 12 });

      expect(res.status).toBe(200);
      expect(res.body.data.counted).toBe(false);

      const unchanged = await prisma.song.findUnique({ where: { id: song.id } });
      expect(unchanged?.plays).toBe(initialPlays);
    }
  });

  it("should increment play count if durationPlayed is at least 30 seconds", async () => {
    const song = await prisma.song.create({
      data: {
        title: "Anti-Spam 30s Test Song",
        duration: 180,
        fileUrl: "/audio/test-30s.mp3",
        plays: 0,
      },
    });

    const res = await request(app)
      .post(`/api/v1/songs/${song.id}/play`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ durationPlayed: 32 });

    expect(res.status).toBe(200);
    expect(res.body.data.counted).toBe(true);
    expect(res.body.data.plays).toBe(1);

    const updated = await prisma.song.findUnique({ where: { id: song.id } });
    expect(updated?.plays).toBe(1);

    // Immediate second call should be caught by anti-spam cooldown
    const spamRes = await request(app)
      .post(`/api/v1/songs/${song.id}/play`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ durationPlayed: 35 });

    expect(spamRes.status).toBe(200);
    expect(spamRes.body.data.counted).toBe(false);

    const stillOne = await prisma.song.findUnique({ where: { id: song.id } });
    expect(stillOne?.plays).toBe(1);

    await prisma.listeningHistory.deleteMany({ where: { songId: song.id } });
    await prisma.song.delete({ where: { id: song.id } });
  });
});
