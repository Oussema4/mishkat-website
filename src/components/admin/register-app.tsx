"use client";

import { useEffect } from "react";

/** Registers the dashboard's service worker, so phones can install the dashboard as an app. */
export function RegisterAdminApp() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/admin-sw.js", { scope: "/admin" }).catch(() => {});
  }, []);
  return null;
}
