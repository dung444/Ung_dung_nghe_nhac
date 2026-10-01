import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../../app";
import { prisma } from "../../config/database";

const app = createApp();

describe("Copyright & Licensing Endpoints", () => {
  let adminToken: string;
  let userToken: string;
  let songId: string;
  let claimId: string;

  beforeAll(async () => {
    // 1. Create admin user
    const admin = { email: "cpadmin@waifu.test", username: "cpadmin", password: "Password123!" };
    await request(app).post("/api/v1/auth/register").send(admin);
    await prisma.user.update({ where: { email: admin.email }, data: { role: "ADMIN" } });
    const adminLogin = await request(app).post("/api/v1/auth/login").send({ email: admin.email, password: admin.password });
    adminToken = adminLogin.body.data.accessToken;

    // 2. Create regular user
    const user = { email: "cpuser@waifu.test", username: "cpuser", password: "Password123!" };
    await request(app).post("/api/v1/auth/register").send(user);
    const userLogin = await request(app).post("/api/v1/auth/login").send({ email: user.email, password: user.password });
    userToken = userLogin.body.data.accessToken;

    // 3. Create song
    const song = await prisma.song.create({
      data: {
        title: "Copyrighted Anime OST",
        duration: 210,
        fileUrl: "/audio/copyright_test.mp3",
        isPublic: true,
      },
    });
    songId = song.id;
  });

  afterAll(async () => {
    await prisma.copyrightClaim.deleteMany({ where: { songId } });
    await prisma.songCopyright.deleteMany({ where: { songId } });
    await prisma.song.deleteMany({ where: { id: songId } });
    await prisma.user.deleteMany({ where: { email: { in: ["cpadmin@waifu.test", "cpuser@waifu.test"] } } });
    await prisma.$disconnect();
  });

  it("should get default copyright info for song", async () => {
    const res = await request(app).get(`/api/v1/copyright/songs/${songId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.songId).toBe(songId);
    expect(res.body.data.isRegistered).toBe(false);
  });

  it("should prevent unauthorized user from registering copyright", async () => {
    const res = await request(app)
      .put(`/api/v1/copyright/songs/${songId}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        ownerName: "Illegal Owner",
        licenseType: "ALL_RIGHTS_RESERVED",
      });
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it("should allow admin to register song copyright", async () => {
    const res = await request(app)
      .put(`/api/v1/copyright/songs/${songId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        ownerName: "Crypton Future Media & Sony Music",
        licenseType: "ALL_RIGHTS_RESERVED",
        isrc: "JP-CFM-26-0001",
        copyrightYear: 2026,
        distributionRights: "GLOBAL",
        allowRemix: false,
        commercialUse: false,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.ownerName).toBe("Crypton Future Media & Sony Music");
    expect(res.body.data.isrc).toBe("JP-CFM-26-0001");
  });

  it("should list licensed songs", async () => {
    const res = await request(app).get("/api/v1/copyright/licenses");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it("should get copyright statistics", async () => {
    const res = await request(app).get("/api/v1/copyright/stats");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalLicensedSongs).toBeGreaterThanOrEqual(1);
    expect(res.body.data.licenseTypeBreakdown).toBeDefined();
  });

  it("should allow user to submit a copyright claim", async () => {
    const res = await request(app)
      .post("/api/v1/copyright/claims")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        songId,
        reason: "Sử dụng giai điệu không xin phép tác giả",
        description: "Bài hát này sử dụng đoạn hook và melody của bài hát gốc thuộc quyền sở hữu của tôi.",
        proofUrl: "https://copyright.example.com/certificate/123",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("PENDING");
    claimId = res.body.data.id;
  });

  it("should get claims list", async () => {
    const res = await request(app)
      .get("/api/v1/copyright/claims")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("should prevent regular user from reviewing claim", async () => {
    const res = await request(app)
      .patch(`/api/v1/copyright/claims/${claimId}/review`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        status: "APPROVED",
        adminNotes: "Takedown now",
      });

    expect(res.status).toBe(403);
  });

  it("should allow admin to review claim and takedown song", async () => {
    const res = await request(app)
      .patch(`/api/v1/copyright/claims/${claimId}/review`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        status: "APPROVED",
        adminNotes: "Đã xác minh vi phạm bản quyền. Tạm gỡ bài hát.",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("APPROVED");

    // Verify song was taken down
    const song = await prisma.song.findUnique({ where: { id: songId } });
    expect(song?.isPublic).toBe(false);
  });
});
