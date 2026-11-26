import { describe, expect, it, vi } from "vitest";
import { hasInsult, isFakePhone } from "@/lib/spam";
import { checkTicket, issueTicket, MIN_TICKET_AGE_MS, TICKET_LIFETIME_MS } from "@/server/order-guard";

vi.mock("server-only", () => ({}));
vi.mock("@/db", () => ({ db: {} }));

describe("hasInsult", () => {
  it("catches insults in Arabic and in Tunisian written in Latin letters", () => {
    expect(hasInsult("soormomek")).toBe(true);
    expect(hasInsult("يا قحبة")).toBe(true);
    expect(hasInsult("Rue 5", "nik omek")).toBe(true);
    expect(hasInsult("zebi")).toBe(true);
  });

  it("lets real names and addresses through", () => {
    for (const text of [
      "Avenue de la République 71",
      "Rue Ibn Sina 118",
      "زبير الطحان",
      "زبيدة بن علي",
      "Tahani Zebidi",
      "Mohamed Zammel",
      "نهج الزمالة، بن عروس",
      "Cité la Députée",
      "قابس",
      "achref",
    ]) {
      expect(hasInsult(text), text).toBe(false);
    }
  });
});

describe("isFakePhone", () => {
  it("refuses numbers nobody owns", () => {
    for (const p of ["22222222", "99999999", "12345678", "98765432", "20000000"]) expect(isFakePhone(p), p).toBe(true);
  });
  it("accepts ordinary numbers", () => {
    for (const p of ["20524278", "94935348", "52181960", "22733421"]) expect(isFakePhone(p), p).toBe(false);
  });
});

describe("order ticket", () => {
  it("is taken only once a few seconds old, and not forged or stale", () => {
    process.env.AUTH_SECRET = "test-secret-for-tickets";
    const now = 1_800_000_000_000;
    const ticket = issueTicket(now);
    expect(checkTicket(ticket, now + 500)).toBeNull();
    expect(checkTicket(ticket, now + MIN_TICKET_AGE_MS + 1)).toBeTypeOf("string");
    expect(checkTicket(ticket, now + TICKET_LIFETIME_MS + 1)).toBeNull();
    const [issued, nonce] = ticket.split(".");
    expect(checkTicket(`${Number(issued) - 60_000}.${nonce}.${ticket.split(".")[2]}`, now + 10_000)).toBeNull();
    expect(checkTicket("nonsense", now)).toBeNull();
  });
});
