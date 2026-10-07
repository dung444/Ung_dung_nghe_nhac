import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../../app";
import { prisma } from "../../config/database";

const app = createApp();

describe("Payments & VIP Subscription Endpoints", () => {
  let userToken: string;
  let testUserId: string;
  let adminToken: string;
  let adminUserId: string;

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

    // 2. Create an admin user
    const adminUser = {
      email: "admin_payment@waifu.test",
      username: "admin_payment",
      password: "Password123!",
      displayName: "Payment Admin",
    };
    const adminRegRes = await request(app).post("/api/v1/auth/register").send(adminUser);
    adminUserId = adminRegRes.body.data.user.id;

    // Promote to ADMIN in DB
    await prisma.user.update({
      where: { id: adminUserId },
      data: { role: "ADMIN" },
    });

    // Login to get token with ADMIN role
    const loginRes = await request(app).post("/api/v1/auth/login").send({
      email: "admin_payment@waifu.test",
      password: "Password123!",
    });
    adminToken = loginRes.body.data.accessToken;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: { in: [testUserId, adminUserId] } } });
    await prisma.$disconnect();
  });

  it("should list available VIP packages", async () => {
    const res = await request(app).get("/api/v1/payments/packages");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.packages)).toBe(true);
    expect(res.body.data.packages.length).toBeGreaterThanOrEqual(3);
  });

  it("should get bank configuration and supported banks", async () => {
    const res = await request(app).get("/api/v1/payments/bank-config");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.config).toBeDefined();
    expect(res.body.data.config.bankId).toBeDefined();
    expect(res.body.data.config.accountNo).toBeDefined();
    expect(Array.isArray(res.body.data.supportedBanks)).toBe(true);
  });

  it("should prevent non-admin from updating bank configuration", async () => {
    const res = await request(app)
      .put("/api/v1/payments/bank-config")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        bankId: "VCB",
        accountNo: "999888777",
        accountName: "HACKER",
      });
    expect(res.status).toBe(403);
  });

  it("should allow admin to update bank configuration", async () => {
    const res = await request(app)
      .put("/api/v1/payments/bank-config")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        bankId: "TCB",
        accountNo: "1903668899",
        accountName: "WAIFU MASTER ADMIN",
        template: "compact2",
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.config.bankId).toBe("TCB");
    expect(res.body.config.accountNo).toBe("1903668899");
    expect(res.body.config.accountName).toBe("WAIFU MASTER ADMIN");
  });

  it("should generate dynamic VietQR payment code with exact amount", async () => {
    const res = await request(app)
      .post("/api/v1/payments/generate-qr")
      .send({
        amount: 129000,
        purpose: "VIP",
        packageId: "VIP_3_MONTHS",
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.qrUrl).toContain("https://img.vietqr.io/image/");
    expect(res.body.data.qrUrl).toContain("amount=129000");
    expect(res.body.data.amount).toBe(129000);
    expect(res.body.data.transactionCode).toBeDefined();
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
    expect(res.body.data.transaction.qrUrl).toContain("amount=100000");
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

  it("should allow admin to view all transactions ledger", async () => {
    const res = await request(app)
      .get("/api/v1/payments/admin/transactions")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.transactions)).toBe(true);
    expect(res.body.data.totalRevenue).toBeGreaterThan(0);
  });
});

