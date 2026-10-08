import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../../app";
import { prisma } from "../../config/database";

const app = createApp();

describe("Creator Studio Endpoints", () => {
  let creatorToken: string;
  let creatorUserId: string;
  let viewerToken: string;
  let viewerUserId: string;
  let createdSongId: string;
  let createdSongWithInvalidGenreId: string;
  let createdAlbumId: string;
  let creditedArtistId: string;

  beforeAll(async () => {
    const viewerRes = await request(app).post("/api/v1/auth/register").send({
      email: "creator_viewer@waifu.test",
      username: "creator_viewer",
      password: "Password123!",
    });
    viewerUserId = viewerRes.body.data.user.id;
    viewerToken = viewerRes.body.data.accessToken;

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

    const creditedArtist = await prisma.artist.create({
      data: { name: "Credited Artist For Creator Test" },
    });
    creditedArtistId = creditedArtist.id;
  });

  afterAll(async () => {
    if (createdSongId) {
      await prisma.songCopyright.deleteMany({ where: { songId: createdSongId } });
      await prisma.songArtist.deleteMany({ where: { songId: createdSongId } });
      await prisma.song.deleteMany({ where: { id: createdSongId } });
    }
    if (createdSongWithInvalidGenreId) {
      await prisma.songCopyright.deleteMany({ where: { songId: createdSongWithInvalidGenreId } });
      await prisma.songArtist.deleteMany({ where: { songId: createdSongWithInvalidGenreId } });
      await prisma.song.deleteMany({ where: { id: createdSongWithInvalidGenreId } });
    }
    if (createdAlbumId) {
      await prisma.album.deleteMany({ where: { id: createdAlbumId } });
    }
    await prisma.artist.deleteMany({ where: { id: creditedArtistId } });
    await prisma.artist.deleteMany({ where: { userId: creatorUserId } });
    await prisma.user.deleteMany({ where: { id: creatorUserId } });
    await prisma.user.deleteMany({ where: { id: viewerUserId } });
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
        artistIds: [creditedArtistId],
        copyrightOwnerName: "Test Rights Holder Co.",
        licenseType: "CREATIVE_COMMONS",
        commercialUse: true,
        allowRemix: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe("Sunset over Akihabara");
    expect(res.body.data.artists).toEqual([
      expect.objectContaining({ id: creditedArtistId, name: "Credited Artist For Creator Test" }),
    ]);
    createdSongId = res.body.data.id;

    const copyright = await prisma.songCopyright.findUnique({ where: { songId: createdSongId } });
    expect(copyright?.registeredById).toBe(creatorUserId);
    expect(copyright?.ownerName).toBe("Test Rights Holder Co.");
  });

  it("should not create a creator profile or upgrade role when merely opening the studio", async () => {
    const res = await request(app)
      .get("/api/v1/creator/studio")
      .set("Authorization", `Bearer ${viewerToken}`);

    expect(res.status).toBe(403);
    const viewer = await prisma.user.findUnique({ where: { id: viewerUserId }, select: { role: true } });
    const artistProfile = await prisma.artist.findFirst({ where: { userId: viewerUserId } });
    expect(viewer?.role).toBe("USER");
    expect(artistProfile).toBeNull();
  });

  it("should ignore unknown genre IDs instead of failing song publication", async () => {
    const res = await request(app)
      .post("/api/v1/creator/songs")
      .set("Authorization", `Bearer ${creatorToken}`)
      .send({
        title: "Song without a valid genre",
        duration: 180,
        fileUrl: "/uploads/audio/unknown-genre.mp3",
        genreIds: ["genre-that-does-not-exist"],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.genres).toEqual([]);
    createdSongWithInvalidGenreId = res.body.data.id;
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

  it("should allow creator to request a payout to their bank account", async () => {
    const res = await request(app)
      .post("/api/v1/creator/payouts")
      .set("Authorization", `Bearer ${creatorToken}`)
      .send({
        amount: 50000,
        bankId: "MB",
        bankName: "MBBank",
        accountNo: "0912345678",
        accountName: "NGUYEN VAN CREATOR",
        note: "Rút tiền tác quyền bài hát tháng này",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.payout.amount).toBe(50000);
    expect(res.body.data.payout.status).toBe("PENDING");
    expect(res.body.data.payout.qrUrl).toContain("https://img.vietqr.io/image/MB-0912345678");
  });

  it("should reject payout if amount is under minimum threshold", async () => {
    const res = await request(app)
      .post("/api/v1/creator/payouts")
      .set("Authorization", `Bearer ${creatorToken}`)
      .send({
        amount: 5000,
        bankId: "MB",
        accountNo: "0912345678",
        accountName: "NGUYEN VAN CREATOR",
      });

    expect(res.status).toBe(400);
  });

  it("should get payout history and balance for creator", async () => {
    const res = await request(app)
      .get("/api/v1/creator/payouts")
      .set("Authorization", `Bearer ${creatorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.payouts)).toBe(true);
    expect(res.body.data.payouts.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.totalPending).toBe(50000);
  });
});

