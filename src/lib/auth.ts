import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { db } from "./db";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-dev-secret"
);
const REFRESH_SECRET = new TextEncoder().encode(
  process.env.JWT_REFRESH_SECRET || "fallback-refresh-secret"
);

export interface JWTPayload {
  userId: string;
  email: string;
  tenantId: string;
  tenantRole: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createAccessToken(payload: JWTPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(JWT_SECRET);
}

export async function createRefreshToken(payload: JWTPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(REFRESH_SECRET);
}

export async function verifyAccessToken(
  token: string
): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(
  token: string
): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, REFRESH_SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function setAuthCookies(payload: JWTPayload) {
  const cookieStore = await cookies();
  const accessToken = await createAccessToken(payload);
  const refreshToken = await createRefreshToken(payload);

  cookieStore.set("access_token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 15 * 60, // 15 minutes
    path: "/",
  });

  cookieStore.set("refresh_token", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: "/",
  });
}

export async function clearAuthCookies() {
  const cookieStore = await cookies();
  cookieStore.delete("access_token");
  cookieStore.delete("refresh_token");
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  if (!accessToken) {
    // Try refresh token
    const refreshToken = cookieStore.get("refresh_token")?.value;
    if (!refreshToken) return null;

    const refreshPayload = await verifyRefreshToken(refreshToken);
    if (!refreshPayload) return null;

    // Issue new access token
    const newPayload: JWTPayload = {
      userId: refreshPayload.userId,
      email: refreshPayload.email,
      tenantId: refreshPayload.tenantId,
      tenantRole: refreshPayload.tenantRole,
    };
    await setAuthCookies(newPayload);

    return {
      id: refreshPayload.userId,
      email: refreshPayload.email,
      tenantId: refreshPayload.tenantId,
      tenantRole: refreshPayload.tenantRole,
    };
  }

  const payload = await verifyAccessToken(accessToken);
  if (!payload) return null;

  return {
    id: payload.userId,
    email: payload.email,
    tenantId: payload.tenantId,
    tenantRole: payload.tenantRole,
  };
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

export async function requireAdmin() {
  const user = await requireAuth();
  if (user.tenantRole !== "ADMIN" && user.tenantRole !== "MANAGER") {
    throw new Error("Forbidden");
  }
  return user;
}

export async function requireSuperAdmin() {
  const user = await requireAuth();
  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: { isSuperAdmin: true },
  });
  if (!dbUser?.isSuperAdmin) {
    throw new Error("Forbidden: Super admin access required");
  }
  return user;
}
