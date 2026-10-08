import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../../app";
import { prisma } from "../../config/database";

const app = createApp();

describe("Admin Management Endpoints", () => {
  let adminToken: string;
  let userToken: string;
  let adminId: string;
  let normalUserId: string;
  let testArtistId: string;
  let testAlbumId: string;
  let testGenreId: string;

  beforeAll(async () => {
    await prisma.artist.deleteMany({ where: { name: "Admin Created Artist Test" } });
    await prisma.genre.deleteMany({ where: { name: "Admin Created Genre Test" } });

    // 1. Create admin user
    const adminData = {
      email: "admintest@waifu.moe",
      username: "superadmin",
      password: "Password123!",
    };
    await request(app).post("/api/v1/auth/register").send(adminData);
    const adminInDb = await prisma.user.update({
      where: { email: adminData.email },
      data: { role: "ADMIN" },
    });
    adminId = adminInDb.id;

    const adminLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: adminData.email, password: adminData.password });
    adminToken = adminLogin.body.data.accessToken;

    // 2. Create normal user
    const userData = {
      email: "useradmin@waifu.moe",
      username: "normaluser",
      password: "Password123!",
    };
    const userReg = await request(app).post("/api/v1/auth/register").send(userData);
    normalUserId = userReg.body.data.user.id;

    const userLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: userData.email, password: userData.password });
    userToken = userLogin.body.data.accessToken;
  });

  afterAll(async () => {
    if (testGenreId) {
      await prisma.genre.deleteMany({ where: { id: testGenreId } });
    }
    if (testAlbumId) {
      await prisma.album.deleteMany({ where: { id: testAlbumId } });
    }
    if (testArtistId) {
      await prisma.artist.deleteMany({ where: { id: testArtistId } });
    }
    await prisma.user.deleteMany({
      where: {
        email: { in: ["admintest@waifu.moe", "useradmin@waifu.moe"] },
      },
    });
  });

  it("should fail when a non-admin accesses admin stats (403)", async () => {
    const res = await request(app)
      .get("/api/v1/admin/stats")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it("should allow admin to get dashboard statistics (200)", async () => {
    const res = await request(app)
      .get("/api/v1/admin/stats")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalUsers).toBeGreaterThanOrEqual(2);
    expect(typeof res.body.data.totalSongs).toBe("number");
    expect(Array.isArray(res.body.data.recentUsers)).toBe(true);
    expect(Array.isArray(res.body.data.recentSongs)).toBe(true);
  });

  it("should list users with pagination (200)", async () => {
    const res = await request(app)
      .get("/api/v1/admin/users?limit=10")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.total).toBeGreaterThanOrEqual(2);
  });

  it("should update user role and VIP status (200)", async () => {
    const res = await request(app)
      .patch(`/api/v1/admin/users/${normalUserId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        role: "ARTIST",
        isPremium: true,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.role).toBe("ARTIST");
    expect(res.body.data.isPremium).toBe(true);
  });

  it("should not allow admin to delete their own account (400)", async () => {
    const res = await request(app)
      .delete(`/api/v1/admin/users/${adminId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should allow admin to create a new artist (201)", async () => {
    const res = await request(app)
      .post("/api/v1/admin/artists")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Admin Created Artist Test",
        bio: "Bio created by admin portal",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe("Admin Created Artist Test");
    testArtistId = res.body.data.id;
  });

  it("should allow an admin to add a genre and expose it in the public catalogue", async () => {
    const createRes = await request(app)
      .post("/api/v1/admin/genres")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Admin Created Genre Test" });

    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    expect(createRes.body.data).toMatchObject({ name: "Admin Created Genre Test", slug: "admin-created-genre-test" });
    testGenreId = createRes.body.data.id;

    const catalogueRes = await request(app).get("/api/v1/genres");
    expect(catalogueRes.status).toBe(200);
    expect(catalogueRes.body.data).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: testGenreId, name: "Admin Created Genre Test" }),
    ]));
  });

  it("should reject duplicate genre names", async () => {
    const res = await request(app)
      .post("/api/v1/admin/genres")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Admin Created Genre Test" });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it("should reject a duplicate artist name (409)", async () => {
    const res = await request(app)
      .post("/api/v1/admin/artists")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Admin Created Artist Test",
        bio: "Duplicate artist should not be created",
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it("should allow admin to create a new album (201)", async () => {
    const res = await request(app)
      .post("/api/v1/admin/albums")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Admin Created Album Test",
        artistId: testArtistId,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe("Admin Created Album Test");
    testAlbumId = res.body.data.id;
  });

  it("should allow admin to delete a managed user (200)", async () => {
    const res = await request(app)
      .delete(`/api/v1/admin/users/${normalUserId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
