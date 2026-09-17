import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../../app";
import { prisma } from "../../config/database";

const app = createApp();

describe("Playlists Endpoints", () => {
  let userToken: string;
  let playlistId: string;
  
  beforeAll(async () => {
    const user = { email: "plistuser@waifu.test", username: "plistuser", password: "Password123!" };
    await request(app).post("/api/v1/auth/register").send(user);
    
    const userRes = await request(app).post("/api/v1/auth/login").send({ email: user.email, password: user.password });
    userToken = userRes.body.data.accessToken;
  });

  afterAll(async () => {
    await prisma.playlist.deleteMany({ where: { name: "Test Playlist" } });
    await prisma.user.deleteMany({ where: { email: "plistuser@waifu.test" } });
    await prisma.$disconnect();
  });

  it("should create a new playlist", async () => {
    const res = await request(app)
      .post("/api/v1/playlists")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ name: "Test Playlist", description: "My anime songs" });
    
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe("Test Playlist");
    playlistId = res.body.data.id;
  });

  it("should get my playlists", async () => {
    const res = await request(app)
      .get("/api/v1/playlists")
      .set("Authorization", `Bearer ${userToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
  
  it("should fail to add a non-existent song to playlist", async () => {
    const res = await request(app)
      .post(`/api/v1/playlists/${playlistId}/songs`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ songId: "00000000-0000-0000-0000-000000000000" });
    
    // The song doesn't exist, prisma will throw or controller will validate
    expect(res.status).toBeGreaterThanOrEqual(400); 
  });
});
