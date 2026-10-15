import { jwtVerify, SignJWT } from "jose";

export const SESSION_COOKIE = "mishkat_admin";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET is missing or shorter than 32 characters. See .env.example");
  }
  return new TextEncoder().encode(secret);
}

export type SessionPayload = { adminId: number; version: number };

export async function signSession(payload: SessionPayload) {
  return new SignJWT({ v: payload.version })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(payload.adminId))
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secretKey());
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    const adminId = Number(payload.sub);
    const version = Number(payload.v);
    if (!Number.isInteger(adminId) || !Number.isInteger(version)) return null;
    return { adminId, version };
  } catch {
    return null;
  }
}
