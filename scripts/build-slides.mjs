// Builds the in-site presentations from slides/*.html into public/rules/.
// The sources reference images as {{card:<name>}} / {{brand:<name>}}; this swaps in the current
// hashed paths from the manifests written by prepare-assets.mjs, so the decks never point at stale files.
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");

async function manifest(file) {
  const src = await readFile(path.join(root, "src", "lib", file), "utf8");
  return Object.fromEntries([...src.matchAll(/"([\w-]+)":\s*\{\s*src:\s*"([^"]+)"/g)].map((m) => [m[1], m[2]]));
}

const images = { card: await manifest("card-images.ts"), brand: await manifest("brand-images.ts") };
const outDir = path.join(root, "public", "rules");
await mkdir(outDir, { recursive: true });

// {{site}}: the public address for canonical and share tags (same order as src/lib/site.ts, with the
// production domain as the default so a local build still writes the real address).
const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const site = (process.env.NEXT_PUBLIC_SITE_URL || (vercelHost ? `https://${vercelHost}` : "https://www.mishkattn.com")).replace(/\/$/, "");

for (const name of await readdir(path.join(root, "slides"))) {
  if (!name.endsWith(".html")) continue;
  const html = (await readFile(path.join(root, "slides", name), "utf8"))
    .replace(/\{\{(card|brand):([\w-]+)\}\}/g, (_, kind, key) => {
      const src = images[kind][key];
      if (!src) throw new Error(`${name}: unknown image {{${kind}:${key}}}`);
      return src;
    })
    .replaceAll("{{site}}", site);
  const out = name.replace(/-rules\.html$/, ".html");
  await writeFile(path.join(outDir, out), html);
  console.log(`public/rules/${out}`);
}
