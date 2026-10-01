import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../../app";
import { prisma } from "../../config/database";

const app = createApp();

describe("Payments & VIP Subscription Endpoints", () => {
  let userToken: string;
  let testUserId: string;

  beforeAll(async () => {
    // 1. Create a regular test user
    const testUser = {
      email: "vip_buyer@waifu.test",
      username: "vip_buyer",
      password: "Password123!",
      displayName: "Sakura Fan",
    };
    const regRes = await request(app).post("/api/v1/auth/register").send(testUser);
    testUserId = regRes.body.data.user.id;
    userToken = regRes.body.data.accessToken;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: testUserId } });
    await prisma.$disconnect();
  });

  it("should list available VIP packages", async () => {
    const res = await request(app).get("/api/v1/payments/packages");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.packages)).toBe(true);
    expect(res.body.data.packages.length).toBeGreaterThanOrEqual(3);
  });

  it("should process top-up successfully", async () => {
    const res = await request(app)
      .post("/api/v1/payments/topup")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        amount: 100000,
        method: "VIETQR_BANKING",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.transaction.amount).toBe(100000);
  });

  it("should purchase VIP subscription and upgrade user to isPremium", async () => {
    const res = await request(app)
      .post("/api/v1/payments/buy-vip")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        packageId: "VIP_1_MONTH",
        method: "VIETQR_BANKING",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.isPremium).toBe(true);

    // Verify in database
    const userInDb = await prisma.user.findUnique({ where: { id: testUserId } });
    expect(userInDb?.isPremium).toBe(true);
  });

  it("should get user payment and transaction history", async () => {
    const res = await request(app)
      .get("/api/v1/payments/history")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.transactions)).toBe(true);
    expect(res.body.data.transactions.length).toBeGreaterThanOrEqual(2);
  });
});
