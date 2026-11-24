"use client";

import { useEffect } from "react";

/** Registers an installable app's service worker (dashboard: /admin, driver app: /driver). */
export function RegisterAdminApp({ sw = "/admin-sw.js", scope = "/admin" }: { sw?: string; scope?: string }) {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register(sw, { scope }).catch(() => {});
  }, [sw, scope]);
  return null;
}
