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

  it("should fail to login with incorrect password", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: testUser.email,
        password: "WrongPassword123!",
      });
    
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
