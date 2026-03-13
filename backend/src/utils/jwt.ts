import jwt from "jsonwebtoken";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "access-secret";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "refresh-secret";

interface JwtPayload {
  userId: string;
}

// Short-lived — verified on every protected request
export function generateAccessToken(userId: string): string {
  return jwt.sign({ userId }, ACCESS_SECRET, { expiresIn: "15m" });
}

// Long-lived — only used to issue new access tokens
export function generateRefreshToken(userId: string): string {
  return jwt.sign({ userId }, REFRESH_SECRET, { expiresIn: "7d" });
}

export function verifyAccessToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, ACCESS_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, REFRESH_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}