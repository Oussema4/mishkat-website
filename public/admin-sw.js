/*
 * Service worker of the dashboard app. It caches nothing (orders and customer details must never be
 * stored on the phone): every request goes to the network as usual. Its only job is to show a clear
 * message instead of the browser's error page when the phone has no internet.
 */
const OFFLINE_PAGE = `<!doctype html><html lang="ar-TN" dir="rtl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>ما فماش انترنت</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0b0b0b;color:#f5f1e8;
font-family:system-ui,sans-serif;text-align:center;padding:24px}button{margin-top:20px;padding:12px 28px;
border:0;border-radius:999px;background:#d4a843;color:#0b0b0b;font-size:16px;font-weight:700}</style></head>
<body><div><h1 style="font-size:22px">ما فماش انترنت</h1><p>ثبّت في الكونكسيون متاعك وعاود جرّب.</p>
<button onclick="location.reload()">عاود جرّب</button></div></body></html>`;

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;
  event.respondWith(
    fetch(event.request).catch(
      () => new Response(OFFLINE_PAGE, { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } }),
    ),
  );
});
