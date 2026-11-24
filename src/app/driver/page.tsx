import type { Metadata } from "next";
import { requireDriver } from "@/server/driver";
import { DriverScreen, type SearchParams } from "./driver-screen";

export const metadata: Metadata = { title: "طلباتي" };
export const dynamic = "force-dynamic";

/** The driver app's only screen: his orders (see DriverScreen). */
export default async function DriverPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const driver = await requireDriver();
  return (
    <main>
      <DriverScreen driver={driver} params={await searchParams} base="/driver" />
    </main>
  );
}
