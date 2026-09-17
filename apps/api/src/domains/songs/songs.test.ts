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
});
