"use client";

import { useEffect, useMemo, useState } from "react";
import type { BrowserDiagnostics } from "@/types";

type NetworkInfo = {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
};

function getConnection(): NetworkInfo | null {
  if (typeof navigator === "undefined") return null;
  const nav = navigator as Navigator & {
    connection?: NetworkInfo;
    mozConnection?: NetworkInfo;
    webkitConnection?: NetworkInfo;
  };
  return nav.connection ?? nav.mozConnection ?? nav.webkitConnection ?? null;
}

export function useBrowserDiagnostics() {
  const [data, setData] = useState<BrowserDiagnostics | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const populate = () => {
      const connection = getConnection();
      setData({
        userAgent: navigator.userAgent,
        languages: [...navigator.languages],
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        viewport: `${window.innerWidth} x ${window.innerHeight}`,
        screenResolution: `${window.screen.width} x ${window.screen.height}`,
        availableScreen: `${window.screen.availWidth} x ${window.screen.availHeight}`,
        pixelRatio: window.devicePixelRatio,
        colorDepth: window.screen.colorDepth,
        online: navigator.onLine,
        connection: {
          effectiveType: connection?.effectiveType ?? null,
          downlink: connection?.downlink ?? null,
          rtt: connection?.rtt ?? null,
          saveData: connection?.saveData ?? null,
        },
        preferences: {
          colorScheme: window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
          reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
          highContrast: window.matchMedia("(prefers-contrast: more)").matches,
          touchCapable: navigator.maxTouchPoints > 0,
          cookieEnabled: navigator.cookieEnabled,
          doNotTrack: navigator.doNotTrack,
        },
        security: {
          protocol: window.location.protocol,
          referrerPolicy: null,
        },
      });
    };

    populate();
    window.addEventListener("resize", populate);
    window.addEventListener("online", populate);
    window.addEventListener("offline", populate);

    return () => {
      window.removeEventListener("resize", populate);
      window.removeEventListener("online", populate);
      window.removeEventListener("offline", populate);
    };
  }, []);

  return useMemo(() => data, [data]);
}