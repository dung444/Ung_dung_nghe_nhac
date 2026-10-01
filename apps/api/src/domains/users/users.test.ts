import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../../app";
import { prisma } from "../../config/database";

const app = createApp();

describe("Users Endpoints", () => {
  let userToken: string;
  let userId: string;
  let songId: string;

  beforeAll(async () => {
    // Register and login test user
    const user = { email: "usersdomain@waifu.test", username: "usersdomain", password: "Password123!" };
    const regRes = await request(app).post("/api/v1/auth/register").send(user);
    userId = regRes.body.data.user.id;
    const loginRes = await request(app).post("/api/v1/auth/login").send({ email: user.email, password: user.password });
    userToken = loginRes.body.data.accessToken;

    // Create test song
    const song = await prisma.song.create({
      data: {
        title: "User Test Song",
        duration: 180,
        fileUrl: "/audio/test.mp3",
      },
    });
    songId = song.id;

    // Record listening history
    await prisma.listeningHistory.create({
      data: {
        userId,
        songId,
        durationPlayed: 120,
      },
    });

    // Record liked song
    await prisma.likedSong.create({
      data: {
        userId,
        songId,
      },
    });
  });

  afterAll(async () => {
    await prisma.listeningHistory.deleteMany({ where: { userId } });
    await prisma.likedSong.deleteMany({ where: { userId } });
    await prisma.song.deleteMany({ where: { id: songId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.$disconnect();
  });

  it("should get listening history without query params", async () => {
    const res = await request(app)
      .get("/api/v1/users/me/history")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0].song.title).toBe("User Test Song");
  });

  it("should get liked songs", async () => {
    const res = await request(app)
      .get("/api/v1/users/me/liked")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0].title).toBe("User Test Song");
  });

  it("should update user profile", async () => {
    const res = await request(app)
      .patch("/api/v1/users/me")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ displayName: "Updated Waifu User" });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.displayName).toBe("Updated Waifu User");
  });

  it("should clear listening history", async () => {
    const res = await request(app)
      .delete("/api/v1/users/me/history")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const checkRes = await request(app)
      .get("/api/v1/users/me/history")
      .set("Authorization", `Bearer ${userToken}`);
    expect(checkRes.body.data.length).toBe(0);
  });
});
