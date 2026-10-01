import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../../app";
import { prisma } from "../../config/database";

const app = createApp();

describe("Artists Endpoints", () => {
  let userToken: string;
  let artistId: string;

  beforeAll(async () => {
    // Create test user
    const user = { email: "artisttest@waifu.test", username: "artisttest", password: "Password123!" };
    await request(app).post("/api/v1/auth/register").send(user);
    const loginRes = await request(app).post("/api/v1/auth/login").send({ email: user.email, password: user.password });
    userToken = loginRes.body.data.accessToken;

    // Create test artist
    const artist = await prisma.artist.create({
      data: {
        name: "Test Waifu Artist",
        bio: "Test bio for artist integration test",
        verified: true,
      },
    });
    artistId = artist.id;
  });

  afterAll(async () => {
    await prisma.userFollowArtist.deleteMany({ where: { artistId } });
    await prisma.artist.deleteMany({ where: { id: artistId } });
    await prisma.user.deleteMany({ where: { email: "artisttest@waifu.test" } });
    await prisma.$disconnect();
  });

  it("should get list of artists", async () => {
    const res = await request(app).get("/api/v1/artists");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("should get artist details by id", async () => {
    const res = await request(app).get(`/api/v1/artists/${artistId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(artistId);
    expect(res.body.data.name).toBe("Test Waifu Artist");
  });

  it("should toggle follow artist", async () => {
    // Follow
    const followRes = await request(app)
      .post(`/api/v1/artists/${artistId}/follow`)
      .set("Authorization", `Bearer ${userToken}`);
    expect(followRes.status).toBe(200);
    expect(followRes.body.success).toBe(true);
    expect(followRes.body.data.following).toBe(true);

    // Unfollow
    const unfollowRes = await request(app)
      .post(`/api/v1/artists/${artistId}/follow`)
      .set("Authorization", `Bearer ${userToken}`);
    expect(unfollowRes.status).toBe(200);
    expect(unfollowRes.body.success).toBe(true);
    expect(unfollowRes.body.data.following).toBe(false);
  });
});
