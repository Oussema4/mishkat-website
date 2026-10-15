/** All amounts are integer millimes (1 TND = 1000). */

export const MILLIMES = 1000;

export function toMillimes(tnd: number): number {
  return Math.round(tnd * MILLIMES);
}

export function fromMillimes(millimes: number): number {
  return millimes / MILLIMES;
}

/** "48 د.ت" or "48,500 د.ت" — Western digits, Tunisian decimal comma. */
export function formatTND(millimes: number): string {
  // Formatted by hand so server and browser output always match (no ICU differences).
  const sign = millimes < 0 ? "-" : "";
  const abs = Math.abs(Math.round(millimes));
  const whole = Math.floor(abs / MILLIMES)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const frac = abs % MILLIMES;
  const text = frac ? `${whole},${String(frac).padStart(3, "0")}` : whole;
  return `${sign}${text} د.ت`;
}
