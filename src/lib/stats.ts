import type { OrderStatus } from "@/db/schema";

/**
 * Shop statistics for the dashboard, computed from plain order rows so the numbers can be tested.
 * Money is in millimes and counts the boxes only, without the delivery fee (the shop's own
 * money: the courier keeps the delivery). "Live" orders are every order except cancelled ones.
 */

export const PERIODS = { "7": "7 أيام", "30": "30 يوم", "90": "3 شهر", month: "الشهر هذا", all: "من البداية" } as const;
export type Period = keyof typeof PERIODS;

export type StatOrder = {
  status: OrderStatus;
  total: number;
  subtotal: number;
  deliveryFee: number;
  boxes: number;
  governorate: string;
  /** "maystro", "manual" or null (not chosen yet). */
  carrier: string | null;
  driverId: number | null;
  createdAt: Date;
};

const TUNIS_DAY = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Tunis", year: "numeric", month: "2-digit", day: "2-digit" });
/** Calendar day in Tunisia, "YYYY-MM-DD". */
export const tunisDay = (d: Date) => TUNIS_DAY.format(d);

/** Start of the period (Tunisia is UTC+1 all year), or null for "from the start". */
export function periodStart(period: Period, now = new Date()): Date | null {
  if (period === "all") return null;
  if (period === "month") return new Date(`${tunisDay(now).slice(0, 7)}-01T00:00:00+01:00`);
  const days = Number(period);
  return new Date(`${tunisDay(new Date(now.getTime() - (days - 1) * 86_400_000))}T00:00:00+01:00`);
}

const IN_PROGRESS: OrderStatus[] = ["confirmed", "preparing", "shipped"];
const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 1000) / 10 : null);
const sum = (list: StatOrder[], f: (o: StatOrder) => number) => list.reduce((n, o) => n + f(o), 0);

export function computeStats(list: StatOrder[]) {
  const live = list.filter((o) => o.status !== "cancelled");
  const byStatus = (s: OrderStatus) => list.filter((o) => o.status === s);
  const delivered = byStatus("delivered");
  const cancelled = byStatus("cancelled");
  const inProgress = list.filter((o) => IN_PROGRESS.includes(o.status));
  const handled = list.filter((o) => o.status !== "new");

  // Offer mix: how many boxes each live order took (1, 2, 3, 4 or more).
  const mix = [1, 2, 3, 4].map((boxes) => {
    const n = live.filter((o) => (boxes === 4 ? o.boxes >= 4 : o.boxes === boxes)).length;
    return { boxes, orders: n, share: pct(n, live.length) };
  });

  // Governorates, most orders first.
  const govMap = new Map<string, { orders: number; value: number }>();
  for (const o of live) {
    const g = govMap.get(o.governorate) ?? { orders: 0, value: 0 };
    g.orders += 1;
    g.value += o.subtotal;
    govMap.set(o.governorate, g);
  }
  const governorates = [...govMap.entries()].map(([name, v]) => ({ name, ...v })).sort((a, b) => b.orders - a.orders);

  // Orders per Tunisian day.
  const dayMap = new Map<string, { orders: number; value: number; boxes: number }>();
  for (const o of live) {
    const key = tunisDay(o.createdAt);
    const d = dayMap.get(key) ?? { orders: 0, value: 0, boxes: 0 };
    d.orders += 1;
    d.value += o.subtotal;
    d.boxes += o.boxes;
    dayMap.set(key, d);
  }

  return {
    orders: list.length,
    liveOrders: live.length,
    boxes: sum(live, (o) => o.boxes),
    value: sum(live, (o) => o.subtotal),
    averageOrder: live.length ? Math.round(sum(live, (o) => o.subtotal) / live.length) : 0,
    averageBoxes: live.length ? Math.round((sum(live, (o) => o.boxes) / live.length) * 100) / 100 : 0,
    deliveredValue: sum(delivered, (o) => o.subtotal),
    deliveredOrders: delivered.length,
    inProgressValue: sum(inProgress, (o) => o.subtotal),
    inProgressOrders: inProgress.length,
    waiting: byStatus("new").length,
    cancelledOrders: cancelled.length,
    /** Of the orders already handled (no longer "new"), how many were confirmed or went further. */
    confirmRate: pct(handled.length - cancelled.length, handled.length),
    /** Of the orders that are finished (delivered or cancelled), how many were delivered. */
    deliverRate: pct(delivered.length, delivered.length + cancelled.length),
    cancelRate: pct(cancelled.length, list.length),
    statuses: (["new", "confirmed", "preparing", "shipped", "delivered", "cancelled"] as OrderStatus[]).map((s) => ({
      status: s,
      orders: byStatus(s).length,
      value: sum(byStatus(s), (o) => o.subtotal),
    })),
    mix,
    governorates,
    days: [...dayMap.entries()].map(([day, v]) => ({ day, ...v })).sort((a, b) => a.day.localeCompare(b.day)),
  };
}

/** Who delivers: Maystro, each of the shop's delivery people, someone else, or not chosen yet. */
export function deliveryBreakdown(list: StatOrder[], drivers: { id: number; name: string }[]) {
  const groups = new Map<string, { label: string; delivered: number; deliveredValue: number; open: number; openValue: number }>();
  const add = (key: string, label: string, o: StatOrder) => {
    const g = groups.get(key) ?? { label, delivered: 0, deliveredValue: 0, open: 0, openValue: 0 };
    if (o.status === "delivered") {
      g.delivered += 1;
      g.deliveredValue += o.subtotal;
    } else {
      g.open += 1;
      g.openValue += o.subtotal;
    }
    groups.set(key, g);
  };
  for (const o of list) {
    if (!IN_PROGRESS.includes(o.status) && o.status !== "delivered") continue;
    if (o.carrier === "maystro") add("maystro", "Maystro", o);
    else if (o.carrier === "manual" && o.driverId) add(`driver:${o.driverId}`, drivers.find((d) => d.id === o.driverId)?.name ?? "موزّع", o);
    else if (o.carrier === "manual") add("other", "توصيل آخر (بلا اسم)", o);
    else add("none", "ما تختارش التوصيل", o);
  }
  return [...groups.entries()].map(([key, v]) => ({ key, ...v }));
}

/** Days of stock left at the period's pace of live orders (null when nothing sold). */
export function daysOfStock(stock: number, soldInPeriod: number, periodDays: number) {
  if (soldInPeriod <= 0 || periodDays <= 0) return null;
  return Math.floor(stock / (soldInPeriod / periodDays));
}
