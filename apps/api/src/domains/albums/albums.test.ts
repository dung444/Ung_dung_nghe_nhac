import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../../app";
import { prisma } from "../../config/database";

const app = createApp();

describe("Albums Endpoints", () => {
  let artistId: string;
  let albumId: string;

  beforeAll(async () => {
    // Create test artist
    const artist = await prisma.artist.create({
      data: { name: "Album Test Artist", verified: true },
    });
    artistId = artist.id;

    // Create test album
    const album = await prisma.album.create({
      data: {
        title: "Test Waifu Album",
        artistId,
        releaseDate: new Date("2026-01-01"),
      },
    });
    albumId = album.id;
  });

  afterAll(async () => {
    await prisma.album.deleteMany({ where: { id: albumId } });
    await prisma.artist.deleteMany({ where: { id: artistId } });
    await prisma.$disconnect();
  });

  it("should get list of albums", async () => {
    const res = await request(app).get("/api/v1/albums");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("should get album details by id", async () => {
    const res = await request(app).get(`/api/v1/albums/${albumId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(albumId);
    expect(res.body.data.title).toBe("Test Waifu Album");
    expect(res.body.data.artist.name).toBe("Album Test Artist");
  });
});
