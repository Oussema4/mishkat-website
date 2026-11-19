import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { checkoutLeads, orderItems, orders } from "@/db/schema";
import { formatTND } from "@/lib/money";
import { siteUrl } from "@/lib/site";

/**
 * New-order alert in Slack, through an incoming webhook (SLACK_WEBHOOK_URL, set in Vercel).
 * Without the variable nothing is sent. A failure is only logged: the order is already saved,
 * and the dashboard stays the reference.
 */
const SLACK_HOST = "https://hooks.slack.com/";

/** Customer text goes into Slack's markup: neutralise its control characters. */
function esc(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function slackWebhook() {
  const webhook = process.env.SLACK_WEBHOOK_URL?.trim();
  if (!webhook) return null;
  if (!webhook.startsWith(SLACK_HOST)) {
    console.error("SLACK_WEBHOOK_URL must start with https://hooks.slack.com/");
    return null;
  }
  return webhook;
}

/**
 * A customer has typed their phone number in the order form (they may still finish the order).
 * If no order follows, the checkout shows under «ما كمّلوش» in the dashboard.
 */
export async function notifyNewLead(leadId: number) {
  const webhook = slackWebhook();
  if (!webhook) return;
  try {
    const [lead] = await db.select().from(checkoutLeads).where(eq(checkoutLeads.id, leadId)).limit(1);
    if (!lead || lead.orderId) return;
    const name = `${lead.firstName} ${lead.lastName}`.trim() || "بلا اسم";
    const headline = `حريف بدا يعمّر الطلب · ${lead.phone}`;
    const lines = [
      `*${headline}*`,
      `*الحريف:* ${esc(name)} · ${lead.phone}${lead.governorate ? ` · ${esc(lead.governorate)}` : ""}`,
      lead.items.length ? `*يحب:* ${lead.items.map((i) => `${esc(i.name)} × ${i.quantity} (${formatTND(i.lineTotal)})`).join("، ")}` : null,
      "كان ما كمّلش الطلب، يبان في «ما كمّلوش» بعد 15 دقيقة.",
      `<${siteUrl()}/admin/abandoned|فتح «ما كمّلوش» في لوحة التحكم>`,
    ].filter(Boolean);
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: headline, blocks: [{ type: "section", text: { type: "mrkdwn", text: lines.join("\n") } }] }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) console.error("Slack lead notification failed", res.status);
  } catch (err) {
    console.error("Slack lead notification failed", err);
  }
}

export async function notifyNewOrder(publicToken: string) {
  const webhook = slackWebhook();
  if (!webhook) return;

  try {
    const [order] = await db.select().from(orders).where(eq(orders.publicToken, publicToken)).limit(1);
    if (!order) return;
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));

    const headline = `طلب جديد ${order.reference} · ${formatTND(order.total)}`;
    const lines = [
      `*${headline}*`,
      `*الحريف:* ${esc(`${order.firstName} ${order.lastName}`)} · ${order.phone}`,
      `*العنوان:* ${esc([order.address, order.city, order.governorate].filter(Boolean).join("، "))}`,
      `*الطلب:* ${items.map((i) => `${esc(i.productName)} × ${i.quantity} (${formatTND(i.lineTotal)})`).join("، ")}`,
      `*المجموع:* ${formatTND(order.subtotal)} + توصيل ${formatTND(order.deliveryFee)} = ${formatTND(order.total)} · الدفع عند الاستلام`,
      order.note ? `*ملاحظة:* ${esc(order.note)}` : null,
      `<${siteUrl()}/admin/orders/${order.id}|فتح الطلب في لوحة التحكم>`,
    ].filter(Boolean);

    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // `text` is what the phone notification shows; the block is the full message.
      body: JSON.stringify({ text: headline, blocks: [{ type: "section", text: { type: "mrkdwn", text: lines.join("\n") } }] }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) console.error("Slack notification failed", res.status, await res.text().catch(() => ""));
  } catch (err) {
    console.error("Slack notification failed", err);
  }
}
