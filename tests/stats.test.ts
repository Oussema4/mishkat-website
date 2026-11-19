import { describe, expect, it } from "vitest";
import { computeStats, daysOfStock, deliveryBreakdown, periodStart, type StatOrder } from "@/lib/stats";

const order = (over: Partial<StatOrder>): StatOrder => ({
  status: "new",
  total: 67_000,
  subtotal: 59_000,
  deliveryFee: 8_000,
  boxes: 1,
  governorate: "تونس",
  carrier: null,
  driverId: null,
  createdAt: new Date("2026-11-18T10:00:00+01:00"),
  ...over,
});

describe("dashboard statistics", () => {
  const list = [
    order({ status: "delivered", carrier: "manual", driverId: 1 }),
    order({ status: "delivered", total: 108_000, subtotal: 100_000, boxes: 2, carrier: "maystro", governorate: "صفاقس" }),
    order({ status: "shipped", carrier: "manual", driverId: 2 }),
    order({ status: "cancelled" }),
    order({ status: "new", createdAt: new Date("2026-11-19T09:00:00+01:00") }),
  ];

  it("counts money and boxes without the cancelled orders", () => {
    const s = computeStats(list);
    expect(s.orders).toBe(5);
    expect(s.liveOrders).toBe(4);
    expect(s.boxes).toBe(5);
    expect(s.value).toBe(67_000 * 3 + 108_000);
    expect(s.deliveredValue).toBe(67_000 + 108_000);
    expect(s.inProgressOrders).toBe(1);
    expect(s.waiting).toBe(1);
  });

  it("works out the rates", () => {
    const s = computeStats(list);
    expect(s.confirmRate).toBe(75); // 4 handled, 1 cancelled
    expect(s.deliverRate).toBe(66.7); // 2 delivered, 1 cancelled
    expect(s.cancelRate).toBe(20);
    expect(s.mix.find((m) => m.boxes === 2)?.orders).toBe(1);
    expect(s.days.map((d) => d.day)).toEqual(["2026-11-18", "2026-11-19"]);
  });

  it("groups deliveries by who takes them", () => {
    const groups = deliveryBreakdown(list, [
      { id: 1, name: "عزيز" },
      { id: 2, name: "حمزة" },
    ]);
    expect(groups.find((g) => g.key === "driver:1")).toMatchObject({ label: "عزيز", delivered: 1, deliveredValue: 67_000 });
    expect(groups.find((g) => g.key === "driver:2")).toMatchObject({ label: "حمزة", open: 1 });
    expect(groups.find((g) => g.key === "maystro")?.delivered).toBe(1);
  });

  it("starts periods on Tunisian days and estimates stock", () => {
    const now = new Date("2026-11-19T00:30:00+01:00");
    expect(periodStart("7", now)?.toISOString()).toBe("2026-11-12T23:00:00.000Z");
    expect(periodStart("month", now)?.toISOString()).toBe("2026-10-31T23:00:00.000Z");
    expect(periodStart("all", now)).toBeNull();
    expect(daysOfStock(100, 30, 30)).toBe(100);
    expect(daysOfStock(100, 0, 30)).toBeNull();
  });
});
