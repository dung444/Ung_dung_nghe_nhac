import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../lib/jwt";

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ success: false, error: "Unauthorized: No token provided" });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyAccessToken(token);
    req.user = { userId: payload.userId, role: payload.role as any };
    next();
  } catch {
    res.status(401).json({ success: false, error: "Unauthorized: Invalid or expired token" });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (req.user?.role !== "ADMIN") {
    res.status(403).json({ success: false, error: "Forbidden: Admin access required" });
    return;
  }
  next();
}
