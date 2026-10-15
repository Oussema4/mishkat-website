import { asc } from "drizzle-orm";
import { db } from "@/db";
import { reviews } from "@/db/schema";
import { getSettings } from "@/server/settings";
import { ReviewsManager } from "./reviews-manager";
import { SettingsForm } from "./settings-form";

export const metadata = { title: "الإعدادات والمحتوى" };

export default async function SettingsPage() {
  const [settings, reviewRows] = await Promise.all([getSettings(), db.select().from(reviews).orderBy(asc(reviews.sortOrder), asc(reviews.id))]);
  return (
    <div className="space-y-6">
      <h1 className="text-3xl">الإعدادات والمحتوى</h1>
      <SettingsForm settings={settings} />
      <ReviewsManager reviews={reviewRows} />
    </div>
  );
}
