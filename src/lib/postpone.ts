import { tunisDay } from "@/lib/stats";

/**
 * The day an order is postponed to: a YYYY-MM-DD from a date picker, from today (Tunis time) up
 * to three months ahead. Null when missing or out of range.
 */
export function parsePostponeDay(raw: unknown, now = new Date()): string | null {
  if (typeof raw !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const today = tunisDay(now);
  const last = tunisDay(new Date(now.getTime() + 92 * 86_400_000));
  if (Number.isNaN(new Date(`${raw}T12:00:00Z`).getTime()) || raw < today || raw > last) return null;
  return raw;
}

/** The picker's bounds: today and three months ahead (Tunis time). */
export function postponeBounds(now = new Date()) {
  return { min: tunisDay(now), max: tunisDay(new Date(now.getTime() + 92 * 86_400_000)) };
}

/** "الخميس 26/11" */
export function dayLabel(day: string) {
  const d = new Date(`${day}T12:00:00Z`);
  const weekday = d.toLocaleDateString("ar-TN", { weekday: "long", timeZone: "UTC" });
  return `${weekday} ${day.slice(8, 10)}/${day.slice(5, 7)}`;
}

/** "مؤجّل لـ الخميس 26/11", or when the day has come / gone. */
export function postponedLabel(day: string, now = new Date()) {
  const today = tunisDay(now);
  if (day === today) return "مؤجّل لليوم";
  if (day < today) return `فات موعدو (${dayLabel(day)})`;
  return `مؤجّل لـ ${dayLabel(day)}`;
}
