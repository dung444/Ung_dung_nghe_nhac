import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../../app";
import { prisma } from "../../config/database";

const app = createApp();

describe("Rooms Endpoints", () => {
  let userToken: string;
  let roomId: string;
  
  beforeAll(async () => {
    const user = { email: "roomuser@waifu.test", username: "roomuser", password: "Password123!" };
    await request(app).post("/api/v1/auth/register").send(user);
    const userRes = await request(app).post("/api/v1/auth/login").send({ email: user.email, password: user.password });
    userToken = userRes.body.data.accessToken;
  });

  afterAll(async () => {
    await prisma.room.deleteMany({ where: { name: "Test Room" } });
    await prisma.user.deleteMany({ where: { email: "roomuser@waifu.test" } });
    await prisma.$disconnect();
  });

  it("should create a new room", async () => {
    const res = await request(app)
      .post("/api/v1/rooms")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ name: "Test Room" });
    
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe("Test Room");
    roomId = res.body.data.id;
  });

  it("should get active rooms", async () => {
    const res = await request(app)
      .get("/api/v1/rooms")
      .set("Authorization", `Bearer ${userToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
