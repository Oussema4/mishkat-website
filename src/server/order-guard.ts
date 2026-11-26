import "server-only";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { blockedCustomers } from "@/db/schema";

/*
 * Guards on the store's order form, on top of the hidden trap field and the per-IP / per-phone caps:
 *  - a ticket: the form asks for one when the customer starts filling it in; an order needs a ticket
 *    at least MIN_TICKET_AGE_MS old, and each ticket places one order. A script posting orders
 *    straight to the server has to fetch and wait for a ticket every time.
 *  - connections blocked from the dashboard, for IP_BLOCK_DAYS days (the phone number is not
 *    blocked: fake orders use other people's numbers).
 * IPs are never stored as such: only a keyed hash, enough to recognise the same connection.
 */

export const MIN_TICKET_AGE_MS = 3_000;
export const TICKET_LIFETIME_MS = 6 * 60 * 60_000;
export const IP_BLOCK_DAYS = 30;

function key(purpose: string) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return createHash("sha256").update(`mishkat-${purpose}:${secret}`).digest();
}

const sign = (payload: string) => createHmac("sha256", key("order-ticket")).update(payload).digest("base64url");

/** "issuedAt.nonce.signature" */
export function issueTicket(now = Date.now()) {
  const payload = `${now}.${randomBytes(12).toString("base64url")}`;
  return `${payload}.${sign(payload)}`;
}

/** The ticket's nonce when it is genuine, old enough and not expired; otherwise null. */
export function checkTicket(ticket: unknown, now = Date.now()): string | null {
  if (typeof ticket !== "string" || ticket.length > 200) return null;
  const [issued, nonce, signature] = ticket.split(".");
  if (!issued || !nonce || !signature) return null;
  const expected = Buffer.from(sign(`${issued}.${nonce}`));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  const age = now - Number(issued);
  return age >= MIN_TICKET_AGE_MS && age <= TICKET_LIFETIME_MS ? nonce : null;
}

/** The same connection gives the same hash; the IP itself can't be read back from it. */
export function hashIp(ip: string) {
  if (!ip || ip === "local") return null;
  return createHmac("sha256", key("ip")).update(ip).digest("hex").slice(0, 32);
}

/** True when this connection was blocked from the dashboard and the block still holds. */
export async function isBlockedConnection(ipHash: string | null, now = new Date()) {
  if (!ipHash) return false;
  const [row] = await db
    .select({ id: blockedCustomers.id })
    .from(blockedCustomers)
    .where(and(eq(blockedCustomers.kind, "ip"), eq(blockedCustomers.value, ipHash), gt(blockedCustomers.expiresAt, now)))
    .limit(1);
  return Boolean(row);
}
