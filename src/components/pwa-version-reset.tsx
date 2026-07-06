"use client";

import { useEffect } from "react";

const STORAGE_KEY = "pmg-build-version";
const SESSION_KEY = "pmg-build-version-reset";

export default function PwaVersionReset({ buildVersion }: { buildVersion: string }) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const previousVersion = window.localStorage.getItem(STORAGE_KEY);
    const alreadyResetThisVersion = window.sessionStorage.getItem(SESSION_KEY) === buildVersion;

    if (!previousVersion) {
      window.localStorage.setItem(STORAGE_KEY, buildVersion);
      return;
    }

    if (previousVersion === buildVersion || alreadyResetThisVersion) {
      return;
    }

    const resetCaches = async () => {
      let shouldReload = false;

      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        if (registrations.length > 0) {
          shouldReload = true;
        }
        await Promise.all(registrations.map((registration) => registration.unregister()));
      }

      if ("caches" in window) {
        const cacheKeys = await window.caches.keys();
        if (cacheKeys.length > 0) {
          shouldReload = true;
        }
        await Promise.all(cacheKeys.map((cacheKey) => window.caches.delete(cacheKey)));
      }

      window.localStorage.setItem(STORAGE_KEY, buildVersion);
      window.sessionStorage.setItem(SESSION_KEY, buildVersion);

      if (shouldReload) {
        window.location.reload();
      }
    };

    resetCaches().catch((error) => {
      console.error("No se pudo reiniciar el cache PWA", error);
      window.localStorage.setItem(STORAGE_KEY, buildVersion);
    });
  }, [buildVersion]);

  return null;
}
