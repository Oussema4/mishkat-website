import { IBM_Plex_Sans_Arabic, Reem_Kufi } from "next/font/google";

/** Charter: Reem Kufi for headings — geometric Kufic in tune with the square letters of the logo. */
export const display = Reem_Kufi({
  subsets: ["arabic", "latin"],
  weight: ["500", "600", "700"],
  variable: "--font-reem-kufi",
  display: "swap",
});

/** Body text; its Latin letters serve the French and English pages too. */
export const body = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-arabic",
  display: "swap",
});

export const fontClasses = `${display.variable} ${body.variable}`;
