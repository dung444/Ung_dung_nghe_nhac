import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../../app";
import { prisma } from "../../config/database";

const app = createApp();

describe("Auth Endpoints", () => {
  beforeAll(async () => {
    // Clean up test users if they exist
    await prisma.user.deleteMany({
      where: { email: { startsWith: "test" } },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  const testUser = {
    email: "testuser1@example.com",
    username: "testuser1",
    password: "Password123!",
  };

  it("should register a new user successfully", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send(testUser);
    
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testUser.email);
    expect(res.body.data.user.username).toBe(testUser.username);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it("should fail to register with an existing email", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send(testUser);
    
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should login successfully with correct credentials", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: testUser.email,
        password: testUser.password,
      });
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it("should login successfully using username instead of email", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: testUser.username,
        password: testUser.password,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.username).toBe(testUser.username);
    expect(res.body.data.accessToken).toBeDefined();
  });

  let validRefreshToken: string;
  let validAccessToken: string;

  it("should return valid tokens on login and allow token refresh", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    expect(res.status).toBe(200);
    validAccessToken = res.body.data.accessToken;
    validRefreshToken = res.body.data.refreshToken;
    expect(validRefreshToken).toBeDefined();

    // Now test token refresh
    const refreshRes = await request(app)
      .post("/api/v1/auth/refresh")
      .send({ refreshToken: validRefreshToken });

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.success).toBe(true);
    expect(refreshRes.body.data.accessToken).toBeDefined();
    expect(refreshRes.body.data.refreshToken).toBeDefined();
    // Update valid tokens with rotated values
    validAccessToken = refreshRes.body.data.accessToken;
    validRefreshToken = refreshRes.body.data.refreshToken;
  });

  it("should reject invalid or expired refresh token", async () => {
    const res = await request(app)
      .post("/api/v1/auth/refresh")
      .send({ refreshToken: "invalid.jwt.token" });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("should get current user profile with valid access token", async () => {
    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${validAccessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(testUser.email);
    expect(res.body.data.username).toBe(testUser.username);
  });

  it("should reject /auth/me without authorization token", async () => {
    const res = await request(app).get("/api/v1/auth/me");
    expect(res.status).toBe(401);
  });

  it("should logout successfully and revoke refresh token", async () => {
    const logoutRes = await request(app)
      .post("/api/v1/auth/logout")
      .send({ refreshToken: validRefreshToken });

    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.success).toBe(true);

    // After logout, the revoked refresh token should fail
    const refreshAfterLogout = await request(app)
      .post("/api/v1/auth/refresh")
      .send({ refreshToken: validRefreshToken });

    expect(refreshAfterLogout.status).toBe(401);
  });
});
