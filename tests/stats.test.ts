import { describe, expect, it } from "vitest";
import { computeStats, customRange, daysOfStock, deliveryBreakdown, periodRange, periodStart, tunisHour, type StatOrder } from "@/lib/stats";

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
    // Box prices only, without the 8 DT delivery.
    expect(s.value).toBe(59_000 * 3 + 100_000);
    expect(s.deliveredValue).toBe(59_000 + 100_000);
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
    expect(groups.find((g) => g.key === "driver:1")).toMatchObject({ label: "عزيز", delivered: 1, deliveredValue: 59_000 });
    expect(groups.find((g) => g.key === "driver:2")).toMatchObject({ label: "حمزة", open: 1 });
    expect(groups.find((g) => g.key === "maystro")?.delivered).toBe(1);
  });

  it("starts periods on Tunisian days and estimates stock", () => {
    const now = new Date("2026-11-19T00:30:00+01:00");
    expect(periodStart("7", now)?.toISOString()).toBe("2026-11-12T23:00:00.000Z");
    expect(periodStart("month", now)?.toISOString()).toBe("2026-10-31T23:00:00.000Z");
    expect(periodStart("all", now)).toBeNull();
    expect(periodRange("today", now)).toEqual({ start: new Date("2026-11-18T23:00:00.000Z"), end: null });
    expect(periodRange("yesterday", now)).toEqual({ start: new Date("2026-11-17T23:00:00.000Z"), end: new Date("2026-11-18T23:00:00.000Z") });
    // A picked range includes both days; one day = the same date twice; backwards dates are swapped.
    expect(customRange("2026-11-01", "2026-11-03")).toMatchObject({ start: new Date("2026-10-31T23:00:00.000Z"), end: new Date("2026-11-03T23:00:00.000Z") });
    expect(customRange("2026-11-05", "2026-11-05")?.end).toEqual(new Date("2026-11-05T23:00:00.000Z"));
    expect(customRange("2026-11-09", "2026-11-02")).toMatchObject({ from: "2026-11-02", to: "2026-11-09" });
    expect(customRange("nope", undefined)).toBeNull();
    expect(tunisHour(new Date("2026-11-18T22:30:00Z"))).toBe(23);
    expect(daysOfStock(100, 30, 30)).toBe(100);
    expect(daysOfStock(100, 0, 30)).toBeNull();
  });
});
