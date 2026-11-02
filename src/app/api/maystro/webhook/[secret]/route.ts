import { revalidatePath } from "next/cache";
import { after, NextResponse, type NextRequest } from "next/server";
import { parseWebhook } from "@/lib/maystro";
import { findOrderForWebhook, isWebhookSecret, syncOrderFromMaystro } from "@/server/maystro";

/**
 * Maystro calls this for every parcel update. The secret in the path is the only authentication
 * (Maystro doesn't sign webhooks), and the event is only a hint: the parcel is re-read from the
 * API before anything changes. Answers at once; the work runs after the response.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ secret: string }> }) {
  const { secret } = await params;
  if (!isWebhookSecret(secret)) return new NextResponse(null, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const event = parseWebhook(body);
  if (!event) return NextResponse.json({ error: "unreadable event" }, { status: 400 });

  after(async () => {
    const orderId = await findOrderForWebhook(event.orderId, event.externalId);
    if (!orderId) {
      console.warn("Maystro webhook for an unknown parcel", event.event);
      return;
    }
    const synced = await syncOrderFromMaystro(orderId);
    if (!synced.ok) console.warn("Maystro webhook sync failed", synced.message);
    revalidatePath("/admin", "layout");
  });
  return NextResponse.json({ ok: true });
}
