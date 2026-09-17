import { prisma } from "../../config/database";
import { hashPassword, comparePassword } from "../../lib/bcrypt";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../lib/jwt";
import { AppError } from "../../middleware/error.middleware";
import type { RegisterInput, LoginInput } from "@waifu-player/validation";
import crypto from "crypto";

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: input.email }, { username: input.username }] },
  });
  if (existing) {
    throw new AppError(
      existing.email === input.email ? "Email already in use" : "Username already taken",
      409
    );
  }

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: {
      email: input.email,
      username: input.username,
      displayName: input.displayName ?? input.username,
      passwordHash,
    },
    select: { id: true, email: true, username: true, displayName: true, role: true, createdAt: true },
  });

  const tokens = await generateTokenPair(user.id, user.role);
  return { user, ...tokens };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) throw new AppError("Invalid email or password", 401);

  const valid = await comparePassword(input.password, user.passwordHash);
  if (!valid) throw new AppError("Invalid email or password", 401);

  const tokens = await generateTokenPair(user.id, user.role);
  const { passwordHash: _, ...safeUser } = user;
  return { user: safeUser, ...tokens };
}

export async function refresh(token: string) {
  let payload: ReturnType<typeof verifyRefreshToken>;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw new AppError("Invalid refresh token", 401);
  }

  const stored = await prisma.refreshToken.findUnique({ where: { token } });
  if (!stored || stored.expiresAt < new Date()) {
    throw new AppError("Refresh token expired or revoked", 401);
  }

  // Rotate: delete old, issue new
  await prisma.refreshToken.delete({ where: { token } });
  return generateTokenPair(payload.userId, payload.role);
}

export async function logout(token: string) {
  await prisma.refreshToken.deleteMany({ where: { token } });
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, username: true, displayName: true, avatarUrl: true, isPremium: true, role: true, createdAt: true },
  });
  if (!user) throw new AppError("User not found", 404);
  return user;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

async function generateTokenPair(userId: string, role: string) {
  const accessToken = signAccessToken({ userId, role });
  const refreshTokenValue = crypto.randomBytes(64).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await prisma.refreshToken.create({
    data: { token: refreshTokenValue, userId, expiresAt },
  });

  return { accessToken, refreshToken: refreshTokenValue };
}
