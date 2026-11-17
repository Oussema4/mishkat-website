import { describe, expect, it } from "vitest";
import { checkoutSchema, splitFullName } from "@/lib/validation";

describe("one name field at checkout", () => {
  it("splits the first word from the rest", () => {
    expect(splitFullName("  محمد   بن علي ")).toEqual({ firstName: "محمد", lastName: "بن علي" });
    expect(splitFullName("Sarra Ben Ali")).toEqual({ firstName: "Sarra", lastName: "Ben Ali" });
  });

  it("accepts a one-word name and refuses an empty one", () => {
    expect(splitFullName("أحمد")).toEqual({ firstName: "أحمد", lastName: "" });
    expect(splitFullName("   ")).toEqual({ firstName: "", lastName: "" });
    const base = { phone: "92359349", governorate: "تونس", city: "La Marsa", items: [{ productId: 1, quantity: 1 }], idempotencyKey: "k".repeat(20) };
    expect(checkoutSchema.safeParse({ ...base, ...splitFullName("أحمد") }).success).toBe(true);
    expect(checkoutSchema.safeParse({ ...base, ...splitFullName(" ") }).success).toBe(false);
  });
});
