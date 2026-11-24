import { createHash, randomInt } from "node:crypto";
import { jwtVerify, SignJWT } from "jose";

/**
 * Sign-in for the shop's delivery people (the driver app, /driver). A driver types a code once;
 * the phone then keeps a long-lived cookie. The token is signed with a key derived for drivers
 * only, so it can never pass for a dashboard session (and the other way round).
 */
const PRODUCTION = process.env.NODE_ENV === "production";

export const DRIVER_COOKIE = PRODUCTION ? "__Host-mishkat_driver" : "mishkat_driver";
/** Half a year: the driver signs in once; a new code (or pausing the driver) ends it sooner. */
export const DRIVER_SESSION_SECONDS = 60 * 60 * 24 * 180;

export const driverCookieOptions = {
  httpOnly: true,
  secure: PRODUCTION,
  sameSite: "lax" as const,
  path: "/",
  maxAge: DRIVER_SESSION_SECONDS,
};

function driverKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET is missing or shorter than 32 characters. See .env.example");
  }
  return new Uint8Array(createHash("sha256").update(`mishkat-driver-session:${secret}`).digest());
}

export async function signDriverSession(driverId: number, version: number) {
  return new SignJWT({ v: version, typ: "driver" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(driverId))
    .setAudience("driver")
    .setIssuedAt()
    .setExpirationTime(`${DRIVER_SESSION_SECONDS}s`)
    .sign(driverKey());
}

export async function verifyDriverSession(token: string | undefined): Promise<{ driverId: number; version: number } | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, driverKey(), { algorithms: ["HS256"], audience: "driver" });
    const driverId = Number(payload.sub);
    const version = Number(payload.v);
    if (payload.typ !== "driver" || !Number.isInteger(driverId) || !Number.isInteger(version)) return null;
    return { driverId, version };
  } catch {
    return null;
  }
}

// No 0/O, 1/I/L: easy to read out over the phone and to type.
const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

/** A fresh sign-in code, shown once to the admin: "K7P2-9XQM" (8 characters, ~40 bits). */
export function newDriverCode() {
  const chars = Array.from({ length: 8 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]);
  return `${chars.slice(0, 4).join("")}-${chars.slice(4).join("")}`;
}

/** What is stored: the code without spaces or dashes, upper case, hashed. */
export function hashDriverCode(code: string) {
  const plain = code.toUpperCase().replace(/[^0-9A-Z]/g, "");
  return createHash("sha256").update(`mishkat-driver-code:${plain}`).digest("hex");
}
