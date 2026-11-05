import { describe, expect, it } from "vitest";
import { ar } from "@/i18n/ar";
import { getDictionary, languageAlternates, localePath, splitLocale } from "@/i18n/config";
import { formatTND } from "@/lib/money";
import { checkoutSchemaFor } from "@/lib/validation";

/** Every key path of a dictionary (arrays by length), to compare languages. */
function shape(value: unknown, path = ""): string[] {
  if (Array.isArray(value)) return [`${path}[${value.length}]`, ...value.flatMap((v, i) => shape(v, `${path}[${i}]`))];
  if (value && typeof value === "object") return Object.entries(value).flatMap(([k, v]) => shape(v, path ? `${path}.${k}` : k));
  return [`${path}:${typeof value}`];
}

describe("dictionaries", () => {
  it("French and English have exactly the Arabic keys", () => {
    expect(shape(getDictionary("fr"))).toEqual(shape(ar));
    expect(shape(getDictionary("en"))).toEqual(shape(ar));
  });

  it("count boxes in each language", () => {
    expect([1, 2, 3].map(getDictionary("ar").boxes)).toEqual(["علبة واحدة", "علبتان", "3 علب"]);
    expect([1, 3].map(getDictionary("fr").boxes)).toEqual(["1 boîte", "3 boîtes"]);
    expect([1, 3].map(getDictionary("en").boxes)).toEqual(["1 box", "3 boxes"]);
  });
});

describe("language paths", () => {
  it("keeps Arabic at the root and prefixes the others", () => {
    expect(localePath("ar", "/shop")).toBe("/shop");
    expect(localePath("fr", "/shop")).toBe("/fr/shop");
    expect(localePath("en", "/")).toBe("/en");
    expect(localePath("ar", "/")).toBe("/");
  });

  it("reads the language back from a browser path", () => {
    expect(splitLocale("/fr/products/sabili")).toEqual({ locale: "fr", path: "/products/sabili" });
    expect(splitLocale("/en")).toEqual({ locale: "en", path: "/" });
    expect(splitLocale("/shop")).toEqual({ locale: "ar", path: "/shop" });
    // The internal address of an Arabic page, as the server renders it.
    expect(splitLocale("/ar/contact")).toEqual({ locale: "ar", path: "/contact" });
    expect(splitLocale("/ar")).toEqual({ locale: "ar", path: "/" });
  });

  it("lists hreflang alternates", () => {
    expect(languageAlternates("/faq")).toEqual({ "ar-TN": "/faq", "fr-TN": "/fr/faq", en: "/en/faq", "x-default": "/faq" });
  });
});

describe("localized formats and messages", () => {
  it("writes prices with each language's currency", () => {
    expect(formatTND(59000)).toBe("59 د.ت");
    expect(formatTND(59000, "fr")).toBe("59 DT");
    expect(formatTND(48500, "en")).toBe("48,500 TND");
  });

  it("explains checkout errors in the shopper's language", () => {
    const result = checkoutSchemaFor(getDictionary("fr").validation).safeParse({ firstName: "A" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.find((i) => i.path[0] === "firstName")?.message).toBe(getDictionary("fr").validation.firstName);
  });
});
