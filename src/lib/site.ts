export function siteUrl() {
  // Explicit setting first, then Vercel's stable production domain, then the per-deploy URL.
  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL || (vercelHost ? `https://${vercelHost}` : "");
  return (fromEnv || "http://localhost:3000").replace(/\/$/, "");
}

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
