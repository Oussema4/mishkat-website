import { beforeAll, describe, expect, it } from "vitest";
import { formatBundles, formatFaq, parseBundles, parseFaq, parseLabelValues, parseSteps, parseTND } from "@/lib/admin-format";
import { formatTND } from "@/lib/money";
import { bundleTotal, computeTotals, discountPercent } from "@/lib/pricing";
import { normalizeTunisianPhone, whatsappLink } from "@/lib/tunisia";
import { SESSION_ABSOLUTE, SESSION_IDLE, signSession, verifySession } from "@/lib/session";
import { checkoutSchema } from "@/lib/validation";

describe("money", () => {
  it("formats TND from millimes", () => {
    expect(formatTND(48000)).toBe("48 د.ت");
    expect(formatTND(7500)).toBe("7,500 د.ت");
    expect(formatTND(1250000)).toBe("1 250 د.ت");
  });
  it("parses admin amounts", () => {
    expect(parseTND("48")).toBe(48000);
    expect(parseTND("7,5")).toBe(7500);
    expect(parseTND("7.250")).toBe(7250);
    expect(parseTND("abc")).toBeNull();
    expect(parseTND("-3")).toBeNull();
  });
});

describe("pricing", () => {
  it("adds delivery once per non-empty order", () => {
    expect(computeTotals([{ unitPrice: 48000, quantity: 2 }], 8000)).toEqual({ subtotal: 96000, deliveryFee: 8000, total: 104000 });
    expect(computeTotals([], 8000).total).toBe(0);
  });
  it("prices quantities with the cheapest mix of offers", () => {
    const offers = [
      { quantity: 2, price: 100000 },
      { quantity: 3, price: 150000 },
    ];
    expect([1, 2, 3, 4, 5, 7].map((q) => bundleTotal(59000, q, offers))).toEqual([59000, 100000, 150000, 200000, 250000, 350000]);
    expect(bundleTotal(59000, 3, [])).toBe(177000);
    expect(computeTotals([{ unitPrice: 59000, quantity: 2, bundles: offers }], 8000).total).toBe(108000);
  });
  it("computes the discount badge", () => {
    expect(discountPercent(48000, 59000)).toBe(19);
    expect(discountPercent(48000, null)).toBeNull();
    expect(discountPercent(48000, 40000)).toBeNull();
  });
});

describe("phone numbers", () => {
  it.each([
    ["92359349", "92359349"],
    ["+216 92 359 349", "92359349"],
    ["0021692359349", "92359349"],
    ["92-359-349", "92359349"],
    ["٩٢٣٥٩٣٤٩", "92359349"],
  ])("normalizes %s", (input, expected) => expect(normalizeTunisianPhone(input)).toBe(expected));

  it.each(["1234567", "123456789", "02359349", "abc"])("rejects %s", (input) => expect(normalizeTunisianPhone(input)).toBeNull());

  it("builds wa.me links", () => {
    expect(whatsappLink("92359349")).toBe("https://wa.me/21692359349");
  });
});

describe("checkout validation", () => {
  const valid = {
    firstName: "سارة",
    lastName: "بن علي",
    phone: "55 123 456",
    governorate: "صفاقس",
    city: "ساقية الزيت",
    address: "طريق تونس كلم 5",
    items: [{ productId: 1, quantity: 1 }],
    idempotencyKey: "0123456789abcdef0123",
  };
  it("accepts a valid order", () => expect(checkoutSchema.safeParse(valid).success).toBe(true));
  it("rejects unknown governorates", () => expect(checkoutSchema.safeParse({ ...valid, governorate: "باريس" }).success).toBe(false));
  it("rejects empty carts", () => expect(checkoutSchema.safeParse({ ...valid, items: [] }).success).toBe(false));
  it("rejects missing address", () => expect(checkoutSchema.safeParse({ ...valid, address: " " }).success).toBe(false));
});

describe("admin text formats", () => {
  it("reads quantity offers", () => {
    expect(parseBundles("3 = 150\n2=100,5")).toEqual([
      { quantity: 2, price: 100500 },
      { quantity: 3, price: 150000 },
    ]);
    expect(parseBundles("")).toEqual([]);
    expect(parseBundles("2 بـ 100")).toBeNull();
    expect(formatBundles([{ quantity: 2, price: 100000 }])).toBe("2 = 100");
  });
  it("round-trips FAQ blocks", () => {
    const faq = [
      { q: "سؤال أول؟", a: "جواب أول." },
      { q: "سؤال ثانٍ؟", a: "جواب\nعلى سطرين." },
    ];
    expect(parseFaq(formatFaq(faq))).toEqual(faq);
  });
  it("parses label/value lines and steps", () => {
    expect(parseLabelValues("بطاقات: 125\nورقة القواعد")).toEqual([
      { label: "بطاقات", value: "125" },
      { label: "ورقة القواعد", value: "" },
    ]);
    expect(parseSteps("المرحلة 1\nشرح\n\nالمرحلة 2\nشرح 2")).toEqual([
      { title: "المرحلة 1", body: "شرح" },
      { title: "المرحلة 2", body: "شرح 2" },
    ]);
  });
});

describe("admin sessions", () => {
  beforeAll(() => {
    process.env.AUTH_SECRET ??= "test-secret-test-secret-test-secret-123";
  });

  it("round-trips a session and keeps the original sign-in time when renewed", async () => {
    const authTime = Math.floor(Date.now() / 1000) - 3600;
    const token = await signSession({ adminId: 7, version: 3, authTime });
    const s = await verifySession(token);
    expect(s).toMatchObject({ adminId: 7, version: 3, authTime });
    expect(s!.expiresAt - Math.floor(Date.now() / 1000)).toBeLessThanOrEqual(SESSION_IDLE);
  });

  it("refuses a session older than the absolute limit, even if freshly renewed", async () => {
    const authTime = Math.floor(Date.now() / 1000) - SESSION_ABSOLUTE - 60;
    expect(await verifySession(await signSession({ adminId: 7, version: 3, authTime }))).toBeNull();
  });

  it("refuses tampered tokens", async () => {
    const token = await signSession({ adminId: 7, version: 3 });
    const [h, p, sig] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(p, "base64url").toString()), sub: "1" })).toString("base64url");
    expect(await verifySession(`${h}.${forged}.${sig}`)).toBeNull();
    expect(await verifySession("not-a-token")).toBeNull();
  });
});
