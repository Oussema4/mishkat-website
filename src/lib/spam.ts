/**
 * Junk that never comes from a real customer: insults typed into the order form, and phone numbers
 * nobody owns (one digit repeated, 12345678…). Used by the store's order and started-checkout
 * actions only; orders typed in the dashboard are not checked.
 */

/** Lower case, no Arabic diacritics or tatweel, one form of alef/ya/ta marbuta, letters run together once ("zeeebi" → "zebi"). */
function fold(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[ً-ٰٟـ]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/(.)\1+/g, "$1");
}

// Matched anywhere in the folded text: long enough not to occur inside ordinary words or addresses.
// (Kept out on purpose: words that are also names or ordinary words, e.g. زبير/زبيدة, الطحان, زمالة, Tahani, Zebidi, Zammel/زامل, députée.)
const INSIDE = [
  // Arabic script (Tunisian and general)
  "قحب", "شرموط", "مناك", "منيوك", "نيكم", "نيكك", "انيك", "ينيك", "تنيك", "كسمك", "كسامك", "سرمك", "سرم امك", "عطاي", "ولد الحرام", "يلعن",
  // Tunisian written in Latin letters (after folding: "soormomek" → "sormomek")
  "sorm", "nayek", "nayik", "mnayek", "nikomek", "nik omek", "9a7b", "qa7b", "9ahb", "3atay", "fuck", "bitch", "salop", "connard", "encule",
];
// Short or ambiguous ones: only as a whole word.
const WORDS = ["زب", "زبي", "كس", "نيك", "زمال", "طحان", "nik", "zeb", "zebi", "zab", "zabour", "zok", "kahba", "tahan", "ta7an", "pute"];

/** True when the text contains an insult. */
export function hasInsult(...texts: string[]) {
  const folded = fold(texts.join(" "));
  if (INSIDE.some((w) => folded.includes(fold(w)))) return true;
  const words = folded.split(/[^\p{L}\p{N}]+/u);
  return WORDS.some((w) => words.includes(fold(w)));
}

/** A local 8-digit number that is plainly made up: one digit seven times or more, or 8 digits in a row (12345678, 98765432). */
export function isFakePhone(local8: string) {
  if (!/^\d{8}$/.test(local8)) return false;
  const counts = new Map<string, number>();
  for (const d of local8) counts.set(d, (counts.get(d) ?? 0) + 1);
  if (Math.max(...counts.values()) >= 7) return true;
  const steps = [...local8].slice(1).map((d, i) => Number(d) - Number(local8[i]));
  return steps.every((s) => s === 1) || steps.every((s) => s === -1);
}
