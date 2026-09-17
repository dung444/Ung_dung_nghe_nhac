import { describe, it, expect, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../../app";
import { prisma } from "../../config/database";

const app = createApp();

describe("Search Endpoints", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("should fail when query q is missing", async () => {
    const res = await request(app).get("/api/v1/search");
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should return search results for a query", async () => {
    const res = await request(app).get("/api/v1/search?q=Miku");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
  });

  it("should return trending items", async () => {
    const res = await request(app).get("/api/v1/search/trending");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.songs).toBeDefined();
    expect(Array.isArray(res.body.data.songs)).toBe(true);
  });
});
