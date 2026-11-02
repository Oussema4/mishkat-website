/**
 * Ways an order can be delivered, chosen per order in the dashboard. A carrier with `api` is sent
 * through its integration (Maystro: src/server/maystro.ts); "manual" only records the choice.
 * Adding a carrier later = one entry here + its integration.
 */
export const CARRIER_IDS = ["maystro", "manual"] as const;
export type CarrierId = (typeof CARRIER_IDS)[number];

export type Carrier = {
  id: CarrierId;
  name: string;
  description: string;
  /** `background` fills the tile around the logo (its own backdrop colour). */
  logo?: { src: string; width: number; height: number; background: string };
  /** Sent automatically to the carrier's system (otherwise the shop handles it by hand). */
  api: boolean;
};

export const CARRIERS: Carrier[] = [
  {
    id: "maystro",
    name: "Maystro",
    description: "يُنشأ الطرد عند Maystro ويُتابَع تلقائيًا.",
    logo: { src: "/images/carriers/maystro.png", width: 94, height: 65, background: "#273142" },
    api: true,
  },
  {
    id: "manual",
    name: "توصيل آخر",
    description: "توصّله بنفسك أو مع شركة أخرى. لا يُرسل شيء.",
    api: false,
  },
];

export function carrierById(id: string | null | undefined): Carrier | null {
  return CARRIERS.find((c) => c.id === id) ?? null;
}
