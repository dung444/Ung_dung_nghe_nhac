import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../../app";
import { prisma } from "../../config/database";

const app = createApp();

describe("Queue Endpoints", () => {
  let userToken: string;
  let userId: string;
  let song1Id: string;
  let song2Id: string;

  beforeAll(async () => {
    const timestamp = Date.now();
    const user = { email: `queuetest_${timestamp}@waifu.test`, username: `queuetest_${timestamp}`, password: "Password123!" };
    const regRes = await request(app).post("/api/v1/auth/register").send(user);
    userId = regRes.body.data.user.id;
    const loginRes = await request(app).post("/api/v1/auth/login").send({ email: user.email, password: user.password });
    userToken = loginRes.body.data.accessToken;

    // Create 2 songs
    const s1 = await prisma.song.create({ data: { title: "Queue Song 1", duration: 200, fileUrl: "/q1.mp3" } });
    const s2 = await prisma.song.create({ data: { title: "Queue Song 2", duration: 180, fileUrl: "/q2.mp3" } });
    song1Id = s1.id;
    song2Id = s2.id;
  });

  afterAll(async () => {
    await prisma.queueItem.deleteMany({ where: { userId } });
    await prisma.song.deleteMany({ where: { id: { in: [song1Id, song2Id] } } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.$disconnect();
  });

  it("should replace queue with array of songIds", async () => {
    const res = await request(app)
      .post("/api/v1/queue")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ songIds: [song1Id, song2Id] });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("should get current user queue", async () => {
    const res = await request(app)
      .get("/api/v1/queue")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(2);
    expect(res.body.data[0].song.title).toBe("Queue Song 1");
    expect(res.body.data[1].song.title).toBe("Queue Song 2");
  });

  it("should add a song to the queue", async () => {
    const res = await request(app)
      .post("/api/v1/queue/add")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ songId: song1Id });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it("should clear the queue", async () => {
    const res = await request(app)
      .delete("/api/v1/queue/clear")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const checkRes = await request(app)
      .get("/api/v1/queue")
      .set("Authorization", `Bearer ${userToken}`);
    expect(checkRes.body.data.length).toBe(0);
  });
});
