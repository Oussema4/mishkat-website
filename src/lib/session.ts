import { jwtVerify, SignJWT } from "jose";

const PRODUCTION = process.env.NODE_ENV === "production";

/**
 * `__Host-` cookies are only accepted over HTTPS, for the whole site, and without a Domain, so no
 * subdomain or plain-HTTP page can plant or overwrite one. Local development (http://localhost)
 * can't use the prefix, so it keeps a plain name there.
 */
export const SESSION_COOKIE = PRODUCTION ? "__Host-mishkat_admin" : "mishkat_admin";

/** A session lapses after 12 hours without dashboard activity… */
export const SESSION_IDLE = 60 * 60 * 12;
/** …is renewed while in use once less than half of that is left (see proxy.ts)… */
export const SESSION_RENEW_BELOW = SESSION_IDLE / 2;
/** …and never outlives 7 days from the sign-in, whatever the activity. */
export const SESSION_ABSOLUTE = 60 * 60 * 24 * 7;

export const sessionCookieOptions = {
  httpOnly: true,
  secure: PRODUCTION,
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_IDLE,
};

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET is missing or shorter than 32 characters. See .env.example");
  }
  return new TextEncoder().encode(secret);
}

export type SessionPayload = {
  adminId: number;
  version: number;
  /** Unix seconds of the original sign-in (kept when the session is renewed). */
  authTime: number;
  /** Unix seconds when this token expires. */
  expiresAt: number;
};

export async function signSession({ adminId, version, authTime }: { adminId: number; version: number; authTime?: number }) {
  return new SignJWT({ v: version, at: authTime ?? Math.floor(Date.now() / 1000) })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(adminId))
    .setIssuedAt()
    .setExpirationTime(`${SESSION_IDLE}s`)
    .sign(secretKey());
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    const adminId = Number(payload.sub);
    const version = Number(payload.v);
    const authTime = Number(payload.at);
    const expiresAt = Number(payload.exp);
    if (![adminId, version, authTime, expiresAt].every(Number.isInteger)) return null;
    if (Math.floor(Date.now() / 1000) - authTime > SESSION_ABSOLUTE) return null;
    return { adminId, version, authTime, expiresAt };
  } catch {
    return null;
  }
}
