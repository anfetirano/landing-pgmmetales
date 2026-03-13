"use client";

import { useEffect } from "react";

const RELOAD_GUARD_KEY = "pmg-sw-reload-at";
const RELOAD_GUARD_MS = 12_000;

const canReloadNow = () => {
  try {
    const lastReloadAt = Number(window.sessionStorage.getItem(RELOAD_GUARD_KEY) ?? 0);
    const now = Date.now();
    if (now - lastReloadAt < RELOAD_GUARD_MS) return false;
    window.sessionStorage.setItem(RELOAD_GUARD_KEY, String(now));
    return true;
  } catch {
    return true;
  }
};

export default function PwaAutoRefresh() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    let stopped = false;

    const reloadApp = () => {
      if (stopped) return;
      if (!canReloadNow()) return;
      window.location.reload();
    };

    const requestSkipWaiting = (registration: ServiceWorkerRegistration | undefined | null) => {
      if (!registration) return;

      if (registration.waiting) {
        registration.waiting.postMessage({ type: "SKIP_WAITING" });
      }

      if (registration.installing) {
        registration.installing.addEventListener("statechange", () => {
          if (
            registration.installing?.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            registration.waiting?.postMessage({ type: "SKIP_WAITING" });
          }
        });
      }
    };

    const syncServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        requestSkipWaiting(registration);
        await registration?.update();
        requestSkipWaiting(registration);
      } catch {
        // Keep silent: this is only a best-effort refresh helper for PWA.
      }
    };

    const onControllerChange = () => reloadApp();
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void syncServiceWorker();
      }
    };
    const onFocus = () => {
      void syncServiceWorker();
    };

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);

    void syncServiceWorker();

    return () => {
      stopped = true;
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  return null;
}
