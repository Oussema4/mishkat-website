import { describe, expect, it } from "vitest";
import { buildParcel, cleanCommunes, findCommune, MAYSTRO_WILAYAS, parseWebhook, shopStatusFor, type ParcelOrder } from "@/lib/maystro";
import { GOVERNORATES } from "@/lib/tunisia";

describe("Maystro reference data", () => {
  it("maps every governorate to a distinct Tunisian code (59–82)", () => {
    const codes = GOVERNORATES.map((g) => MAYSTRO_WILAYAS[g].code);
    expect(new Set(codes).size).toBe(24);
    expect(codes.every((c) => c >= 59 && c <= 82)).toBe(true);
  });

  it("keeps Tunisian delegations only, one per name, with the lowest id", () => {
    const list = cleanCommunes([
      { id: 1638, name: "Douz", commune_ar: null, wilaya: 68 },
      { id: 1639, name: "Douz", commune_ar: null, wilaya: 68 },
      { id: 1637, name: "Thala", commune_ar: null, wilaya: 67 },
      { id: 1718, name: "Thala", commune_ar: null, wilaya: 75 },
      { id: 12, name: "Adrar", commune_ar: null, wilaya: 1 },
      { id: "x", name: "broken", wilaya: 60 },
    ]);
    expect(list).toEqual([
      { id: 1638, name: "Douz", wilaya: 68 },
      { id: 1637, name: "Thala", wilaya: 67 },
      { id: 1718, name: "Thala", wilaya: 75 },
    ]);
    expect(cleanCommunes({ detail: "error" })).toEqual([]);
  });

  it("accepts a delegation only inside the chosen governorate", () => {
    const list = [{ id: 1637, name: "Thala", wilaya: 67 }];
    expect(findCommune(list, 1637, "القصرين")).toEqual(list[0]);
    expect(findCommune(list, 1637, "صفاقس")).toBeNull();
    expect(findCommune(list, 9999, "القصرين")).toBeNull();
  });
});

describe("Maystro parcel", () => {
  const order: ParcelOrder = {
    reference: "MSK-000012",
    firstName: "سارة",
    lastName: "بن علي",
    phone: "55123456",
    governorate: "قابس",
    city: "Gabès Ville",
    address: "",
    note: "بعد العصر",
    subtotal: 100000,
    total: 108000,
    communeId: 1600,
  };
  const line = { productName: "سبيلي", quantity: 2, maystroProductId: "uuid-sabili" };

  it("builds the delivery order with the cash amount and our reference", () => {
    const parcel = buildParcel(order, [line]);
    expect(parcel.ok).toBe(true);
    if (!parcel.ok) return;
    expect(parcel.body).toMatchObject({
      external_id: "MSK-000012",
      customer_name: "سارة بن علي",
      customer_phone: "55123456",
      commune: 1600,
      destination_text: "Gabès Ville، قابس",
      product_price: "100.00",
      total_price: "108.00",
      details: [{ product: "uuid-sabili", quantity: 2 }],
    });
  });

  it("refuses to send without a delegation or with an unlinked product", () => {
    expect(buildParcel({ ...order, communeId: null }, [line]).ok).toBe(false);
    const unlinked = buildParcel(order, [{ ...line, maystroProductId: null }]);
    expect(unlinked.ok).toBe(false);
    if (!unlinked.ok) expect(unlinked.error).toContain("سبيلي");
  });
});

describe("Maystro statuses and webhooks", () => {
  it("moves the shop status only for delivery and hand-over to the driver", () => {
    expect(shopStatusFor(41)).toBe("delivered");
    expect(shopStatusFor(31)).toBe("shipped");
    expect(shopStatusFor(50)).toBeNull();
    expect(shopStatusFor(4)).toBeNull();
  });

  it("reads the base64 event envelope", () => {
    const data = Buffer.from(JSON.stringify({ event: "OrderCreated", order_id: "uuid-1", external_id: "MSK-000012", status: 11 })).toString("base64");
    expect(parseWebhook({ message: { data } })).toEqual({ orderId: "uuid-1", externalId: "MSK-000012", event: "OrderCreated" });
    expect(parseWebhook({ message: { data: "not base64 json" } })).toBeNull();
    expect(parseWebhook({})).toBeNull();
  });
});
