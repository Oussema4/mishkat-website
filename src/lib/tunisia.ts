/** The 24 governorates (ولايات) of Tunisia. */
export const GOVERNORATES = [
  "تونس",
  "أريانة",
  "بن عروس",
  "منوبة",
  "نابل",
  "زغوان",
  "بنزرت",
  "باجة",
  "جندوبة",
  "الكاف",
  "سليانة",
  "سوسة",
  "المنستير",
  "المهدية",
  "صفاقس",
  "القيروان",
  "القصرين",
  "سيدي بوزيد",
  "قابس",
  "مدنين",
  "تطاوين",
  "قفصة",
  "توزر",
  "قبلي",
] as const;

export type Governorate = (typeof GOVERNORATES)[number];

/** Normalizes "+216 92 359 349", "0021692359349", "92-359-349" → "92359349". Returns null if invalid. */
export function normalizeTunisianPhone(input: string): string | null {
  // Arabic-Indic digits → Western first, so they survive the clean-up below.
  const western = input.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
  let digits = western.replace(/[^\d+]/g, "").replace(/^\+/, "00");
  if (digits.startsWith("00216")) digits = digits.slice(5);
  else if (digits.length === 11 && digits.startsWith("216")) digits = digits.slice(3);
  return /^[2-9]\d{7}$/.test(digits) ? digits : null;
}

export function formatTunisianPhone(local8: string): string {
  return `${local8.slice(0, 2)} ${local8.slice(2, 5)} ${local8.slice(5)}`;
}

/** "https://www.instagram.com/mishkat.2025/" → "@mishkat.2025" */
export function instagramHandle(url: string) {
  const handle = url.replace(/\/+$/, "").split("/").pop() ?? "";
  return handle ? `@${handle.replace(/^@/, "")}` : url;
}

/** wa.me link; `number` may be local 8 digits or international without "+". */
export function whatsappLink(number: string, text?: string): string {
  const clean = number.replace(/\D/g, "");
  const intl = clean.length === 8 ? `216${clean}` : clean;
  const q = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${intl}${q}`;
}
