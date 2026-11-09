import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { hashedUserData, normalizePhone, normalizeText } from "@/lib/meta-user-data";

const sha = (v: string) => createHash("sha256").update(v).digest("hex");

describe("Meta customer data", () => {
  it("puts the country code on shop phones", () => {
    expect(normalizePhone("92359349")).toBe("21692359349");
    expect(normalizePhone("92 359 349")).toBe("21692359349");
  });

  it("lowercases and drops spaces and punctuation", () => {
    expect(normalizeText("  Ben Arous ")).toBe("benarous");
    expect(normalizeText("Sidi-Bou Saïd")).toBe("sidibousaïd");
    expect(normalizeText("محمد علي")).toBe("محمدعلي");
  });

  it("hashes every field and never sends one in clear", () => {
    const data = hashedUserData({ firstName: "Ali", lastName: "Ben Salah", phone: "92359349", city: "La Marsa", governorate: "تونس" });
    expect(data.ph).toEqual([sha("21692359349")]);
    expect(data.fn).toEqual([sha("ali")]);
    expect(data.ln).toEqual([sha("bensalah")]);
    expect(data.ct).toEqual([sha("lamarsa")]);
    expect(data.country).toEqual([sha("tn")]);
    // The governorate goes by its Latin name.
    expect(data.st?.[0]).not.toBe(sha("تونس"));
    for (const value of Object.values(data)) expect(value?.[0]).toMatch(/^[0-9a-f]{64}$/);
  });

  it("leaves out empty fields", () => {
    const data = hashedUserData({ firstName: "Ali", lastName: "", phone: "92359349", city: "", governorate: "تونس" });
    expect(data.ln).toBeUndefined();
    expect(data.ct).toBeUndefined();
  });
});
