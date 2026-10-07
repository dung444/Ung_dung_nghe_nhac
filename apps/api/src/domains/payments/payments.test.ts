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

  it("should get anime gift catalog and coin packages", async () => {
    const res = await request(app).get("/api/v1/payments/gifts");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.gifts)).toBe(true);
    expect(res.body.data.gifts.length).toBeGreaterThanOrEqual(6);
    expect(Array.isArray(res.body.data.coinPackages)).toBe(true);
  });

  it("should check user coin balance and top up coins", async () => {
    const balanceRes = await request(app)
      .get("/api/v1/payments/coins/balance")
      .set("Authorization", `Bearer ${userToken}`);

    expect(balanceRes.status).toBe(200);
    expect(balanceRes.body.data.coins).toBeGreaterThanOrEqual(100);

    const topupRes = await request(app)
      .post("/api/v1/payments/coins/topup")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ packageId: "COIN_120" });

    expect(topupRes.status).toBe(200);
    expect(topupRes.body.success).toBe(true);
    expect(topupRes.body.data.addedCoins).toBe(120);
  });

  it("should send anime gift to a song and update leaderboard", async () => {
    const song = await prisma.song.findFirst();
    if (song) {
      const sendRes = await request(app)
        .post("/api/v1/payments/gifts/send")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          songId: song.id,
          giftId: "heart",
          count: 2,
          message: "Bài hát anime quá đỉnh!",
        });

      expect(sendRes.status).toBe(200);
      expect(sendRes.body.success).toBe(true);
      expect(sendRes.body.data.gift.name).toBe("Trái Tim Waifu");
      expect(sendRes.body.data.totalCoins).toBe(40); // 20 * 2
    }

    const leaderboardRes = await request(app).get("/api/v1/payments/gifts/leaderboard");
    expect(leaderboardRes.status).toBe(200);
    expect(leaderboardRes.body.success).toBe(true);
    expect(Array.isArray(leaderboardRes.body.data)).toBe(true);
    expect(leaderboardRes.body.data.length).toBeGreaterThan(0);
    expect(leaderboardRes.body.data[0].rank).toBe(1);
  });

  it("should create a payment order for buying coins with PENDING status and VietQR", async () => {
    const res = await request(app)
      .post("/api/v1/payments/orders/create")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        type: "COIN_TOPUP",
        packageId: "COIN_350",
        method: "VIETQR_BANKING",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.order).toBeDefined();
    expect(res.body.data.order.status).toBe("PENDING");
    expect(res.body.data.order.amount).toBe(50000);
    expect(res.body.data.order.coins).toBe(350);
    expect(res.body.data.order.orderCode).toContain("WFP");
    expect(res.body.data.order.qrUrl).toContain("https://img.vietqr.io/image/");
    expect(res.body.data.order.expiresAt).toBeDefined();
  });

  it("should get payment order status and details by orderId", async () => {
    // 1. Create order
    const createRes = await request(app)
      .post("/api/v1/payments/orders/create")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        type: "COIN_TOPUP",
        packageId: "COIN_800",
        method: "VIETQR_BANKING",
      });
    const orderId = createRes.body.data.order.id;

    // 2. Fetch order
    const getRes = await request(app)
      .get(`/api/v1/payments/orders/${orderId}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.success).toBe(true);
    expect(getRes.body.data.order.id).toBe(orderId);
    expect(getRes.body.data.order.status).toBe("PENDING");
  });

  it("should confirm payment order, credit coins to user balance, and update status to SUCCESS", async () => {
    // 1. Get initial balance
    const initRes = await request(app)
      .get("/api/v1/payments/coins/balance")
      .set("Authorization", `Bearer ${userToken}`);
    const initialCoins = initRes.body.data.coins;

    // 2. Create order for 350 coins
    const createRes = await request(app)
      .post("/api/v1/payments/orders/create")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        type: "COIN_TOPUP",
        packageId: "COIN_350",
        method: "VIETQR_BANKING",
      });
    const orderId = createRes.body.data.order.id;

    // 3. Confirm order payment
    const confirmRes = await request(app)
      .post(`/api/v1/payments/orders/${orderId}/confirm`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.success).toBe(true);
    expect(confirmRes.body.data.order.status).toBe("SUCCESS");
    expect(confirmRes.body.data.balance).toBe(initialCoins + 350);

    // 4. Verify balance via endpoint
    const finalRes = await request(app)
      .get("/api/v1/payments/coins/balance")
      .set("Authorization", `Bearer ${userToken}`);
    expect(finalRes.body.data.coins).toBe(initialCoins + 350);
  });

  it("should allow cancelling a pending payment order", async () => {
    // 1. Create order
    const createRes = await request(app)
      .post("/api/v1/payments/orders/create")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        type: "COIN_TOPUP",
        packageId: "COIN_50",
        method: "MOMO",
      });
    const orderId = createRes.body.data.order.id;

    // 2. Cancel order
    const cancelRes = await request(app)
      .post(`/api/v1/payments/orders/${orderId}/cancel`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.success).toBe(true);
    expect(cancelRes.body.data.order.status).toBe("CANCELLED");
  });

  it("should allow user to submit transfer proof image for coin topup and set status to WAITING_APPROVAL", async () => {
    // 1. Create order
    const createRes = await request(app)
      .post("/api/v1/payments/orders/create")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        type: "COIN_TOPUP",
        packageId: "COIN_120",
        method: "VIETQR_BANKING",
      });
    const orderId = createRes.body.data.order.id;

    // 2. Submit proof image
    const proofRes = await request(app)
      .post(`/api/v1/payments/orders/${orderId}/submit-proof`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        proofImageUrl: "https://example.com/receipts/bank_transfer_120_coins.png",
        note: "Đã chuyển khoản 20k từ MBBank lúc 22:30",
      });

    expect(proofRes.status).toBe(200);
    expect(proofRes.body.success).toBe(true);
    expect(proofRes.body.data.order.status).toBe("WAITING_APPROVAL");
    expect(proofRes.body.data.order.proofImageUrl).toBe("https://example.com/receipts/bank_transfer_120_coins.png");
    expect(proofRes.body.data.order.userNote).toContain("Đã chuyển khoản");
  });

  it("should allow user to submit transfer proof image for VIP purchase and set status to WAITING_APPROVAL", async () => {
    // 1. Create VIP order
    const createRes = await request(app)
      .post("/api/v1/payments/orders/create")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        type: "BUY_VIP",
        packageId: "VIP_1_MONTH",
        method: "VIETQR_BANKING",
      });
    const orderId = createRes.body.data.order.id;

    // 2. Submit proof image
    const proofRes = await request(app)
      .post(`/api/v1/payments/orders/${orderId}/submit-proof`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        proofImageUrl: "https://example.com/receipts/vip_1_month_receipt.jpg",
        note: "Thanh toán gói Waifu VIP 1 Tháng 49.000đ",
      });

    expect(proofRes.status).toBe(200);
    expect(proofRes.body.success).toBe(true);
    expect(proofRes.body.data.order.status).toBe("WAITING_APPROVAL");
    expect(proofRes.body.data.order.type).toBe("BUY_VIP");
  });

  it("should allow admin to list pending payment orders with proof images", async () => {
    const listRes = await request(app)
      .get("/api/v1/payments/admin/orders")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.success).toBe(true);
    expect(Array.isArray(listRes.body.data.orders)).toBe(true);
    expect(listRes.body.data.pendingCount).toBeGreaterThanOrEqual(2);
  });

  it("should allow admin to approve a pending coin topup order with proof and credit coins", async () => {
    // 1. Create and submit proof for 800 coins
    const initCoinsRes = await request(app)
      .get("/api/v1/payments/coins/balance")
      .set("Authorization", `Bearer ${userToken}`);
    const beforeCoins = initCoinsRes.body.data.coins;

    const createRes = await request(app)
      .post("/api/v1/payments/orders/create")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        type: "COIN_TOPUP",
        packageId: "COIN_800",
        method: "VIETQR_BANKING",
      });
    const orderId = createRes.body.data.order.id;

    await request(app)
      .post(`/api/v1/payments/orders/${orderId}/submit-proof`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        proofImageUrl: "https://example.com/receipts/bank_transfer_800.png",
      });

    // 2. Admin approves
    const reviewRes = await request(app)
      .post(`/api/v1/payments/admin/orders/${orderId}/review`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        action: "APPROVE",
        adminNote: "Đã nhận đủ 100.000 VNĐ qua MBBank",
      });

    expect(reviewRes.status).toBe(200);
    expect(reviewRes.body.success).toBe(true);
    expect(reviewRes.body.data.order.status).toBe("SUCCESS");

    // 3. User balance has increased by 800 coins
    const afterCoinsRes = await request(app)
      .get("/api/v1/payments/coins/balance")
      .set("Authorization", `Bearer ${userToken}`);
    expect(afterCoinsRes.body.data.coins).toBe(beforeCoins + 800);
  });

  it("should allow admin to reject a pending payment order with reason", async () => {
    // 1. Create and submit proof
    const createRes = await request(app)
      .post("/api/v1/payments/orders/create")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        type: "COIN_TOPUP",
        packageId: "COIN_50",
        method: "VIETQR_BANKING",
      });
    const orderId = createRes.body.data.order.id;

    await request(app)
      .post(`/api/v1/payments/orders/${orderId}/submit-proof`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        proofImageUrl: "https://example.com/fake_receipt.png",
      });

    // 2. Admin rejects
    const reviewRes = await request(app)
      .post(`/api/v1/payments/admin/orders/${orderId}/review`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        action: "REJECT",
        adminNote: "Biên lai không hợp lệ, chưa nhận được tiền trên sao kê",
      });

    expect(reviewRes.status).toBe(200);
    expect(reviewRes.body.success).toBe(true);
    expect(reviewRes.body.data.order.status).toBe("REJECTED");
    expect(reviewRes.body.data.order.adminNote).toContain("Biên lai không hợp lệ");
  });
});

