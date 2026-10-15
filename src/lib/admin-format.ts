import type { ContentItem, FaqItem, HowToStep } from "@/db/schema";

/**
 * Plain-text formats used by the admin forms, so non-technical editors never touch JSON.
 *  - Lists: one item per line.
 *  - Label/value: "التسمية: القيمة" per line.
 *  - Blocks (FAQ, steps): first line = title/question, following lines = body; blocks separated by an empty line.
 */

export function parseLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

export function parseLabelValues(text: string): ContentItem[] {
  return parseLines(text).map((line) => {
    const i = line.search(/[:：]/);
    return i === -1 ? { label: line, value: "" } : { label: line.slice(0, i).trim(), value: line.slice(i + 1).trim() };
  });
}

export function formatLabelValues(items: ContentItem[]): string {
  return items.map((c) => (c.value ? `${c.label}: ${c.value}` : c.label)).join("\n");
}

function parseBlocks(text: string): { head: string; body: string }[] {
  return text
    .split(/\r?\n\s*\r?\n/)
    .map((block) => block.split(/\r?\n/).map((l) => l.trim()).filter(Boolean))
    .filter((lines) => lines.length > 0)
    .map(([head, ...rest]) => ({ head, body: rest.join("\n") }));
}

export function parseFaq(text: string): FaqItem[] {
  return parseBlocks(text)
    .filter((b) => b.body)
    .map((b) => ({ q: b.head, a: b.body }));
}

export function formatFaq(items: FaqItem[]): string {
  return items.map((f) => `${f.q}\n${f.a}`).join("\n\n");
}

export function parseSteps(text: string): HowToStep[] {
  return parseBlocks(text).map((b) => ({ title: b.head, body: b.body }));
}

export function formatSteps(items: HowToStep[]): string {
  return items.map((s) => `${s.title}\n${s.body}`).join("\n\n");
}

/** "48" / "48.5" / "48,500" (TND) → millimes. Returns null when not a valid non-negative amount. */
export function parseTND(input: string): number | null {
  const clean = input.trim().replace(/\s/g, "").replace(",", ".");
  if (!clean) return null;
  if (!/^\d+(\.\d{1,3})?$/.test(clean)) return null;
  return Math.round(Number(clean) * 1000);
}

export function formatTNDInput(millimes: number | null | undefined): string {
  if (millimes === null || millimes === undefined) return "";
  const v = millimes / 1000;
  return Number.isInteger(v) ? String(v) : v.toFixed(3).replace(/0+$/, "");
}

export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9؀-ۿ]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
