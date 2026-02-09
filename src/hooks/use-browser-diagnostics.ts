"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BrowserDiagnostics } from "@/types";

type NetworkInfo = {
  effectiveType?: string;
  type?: string;
  downlink?: number;
  downlinkMax?: number;
  rtt?: number;
  saveData?: boolean;
  addEventListener?: (event: string, listener: () => void) => void;
  removeEventListener?: (event: string, listener: () => void) => void;
};

type PermissionSummary = BrowserDiagnostics["privacy"]["permissions"];

function getConnection(): NetworkInfo | null {
  if (typeof navigator === "undefined") return null;
  const nav = navigator as Navigator & {
    connection?: NetworkInfo;
    mozConnection?: NetworkInfo;
    webkitConnection?: NetworkInfo;
  };
  return nav.connection ?? nav.mozConnection ?? nav.webkitConnection ?? null;
}

function bucketMemory(memory: number | undefined): string | null {
  if (typeof memory !== "number") return null;
  if (memory <= 2) return "<=2GB";
  if (memory <= 4) return "4GB";
  if (memory <= 8) return "8GB";
  return ">=16GB";
}

function bucketCpuThreads(threads: number | undefined): string | null {
  if (typeof threads !== "number") return null;
  if (threads <= 2) return "1-2";
  if (threads <= 4) return "3-4";
  if (threads <= 8) return "5-8";
  return "9+";
}

function getCookieCount(): number {
  if (typeof document === "undefined") return 0;
  const raw = document.cookie.trim();
  if (!raw) return 0;
  return raw.split(";").filter(Boolean).length;
}

async function queryPermission(name: PermissionName): Promise<PermissionState | "unsupported" | "error"> {
  if (typeof navigator === "undefined" || !("permissions" in navigator) || !navigator.permissions?.query) {
    return "unsupported";
  }

  try {
    const result = await navigator.permissions.query({ name } as PermissionDescriptor);
    return result.state;
  } catch (error) {
    if (error instanceof TypeError) return "unsupported";
    return "error";
  }
}

async function getPermissions(): Promise<PermissionSummary> {
  const [notifications, geolocation, camera, microphone] = await Promise.all([
    queryPermission("notifications"),
    queryPermission("geolocation"),
    queryPermission("camera"),
    queryPermission("microphone"),
  ]);

  return { notifications, geolocation, camera, microphone };
}

async function probeApi() {
  try {
    const start = performance.now();
    const response = await fetch("/api/ip?format=json", { cache: "no-store" });
    const apiRttMs = Math.round(performance.now() - start);

    return {
      apiRttMs,
      responseHeaders: {
        csp: response.headers.get("content-security-policy"),
        referrerPolicy: response.headers.get("referrer-policy"),
        permissionsPolicy: response.headers.get("permissions-policy"),
        xFrameOptions: response.headers.get("x-frame-options"),
        xContentTypeOptions: response.headers.get("x-content-type-options"),
        cacheControl: response.headers.get("cache-control"),
      },
    };
  } catch {
    return {
      apiRttMs: null,
      responseHeaders: {
        csp: null,
        referrerPolicy: null,
        permissionsPolicy: null,
        xFrameOptions: null,
        xContentTypeOptions: null,
        cacheControl: null,
      },
    };
  }
}

export function useBrowserDiagnostics(enableAdvanced: boolean) {
  const [data, setData] = useState<BrowserDiagnostics | null>(null);
  const lastNetworkSignature = useRef<string | null>(null);
  const lastConnectionChangedAt = useRef<string | null>(null);

  const collectBase = useCallback(() => {
    const connection = getConnection();
    const currentSignature = [
      connection?.effectiveType ?? null,
      connection?.type ?? null,
      connection?.downlink ?? null,
      connection?.rtt ?? null,
      connection?.saveData ?? null,
    ].join("|");

    if (lastNetworkSignature.current && lastNetworkSignature.current !== currentSignature) {
      lastConnectionChangedAt.current = new Date().toISOString();
    }
    lastNetworkSignature.current = currentSignature;

    const nav = navigator as Navigator & {
      hardwareConcurrency?: number;
      deviceMemory?: number;
      pdfViewerEnabled?: boolean;
    };

    return {
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
        type: connection?.type ?? null,
        downlink: connection?.downlink ?? null,
        downlinkMax: connection?.downlinkMax ?? null,
        rtt: connection?.rtt ?? null,
        saveData: connection?.saveData ?? null,
        changedAt: lastConnectionChangedAt.current,
        apiRttMs: null,
      },
      preferences: {
        colorScheme: window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
        reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        highContrast: window.matchMedia("(prefers-contrast: more)").matches,
        touchCapable: navigator.maxTouchPoints > 0,
        maxTouchPoints: navigator.maxTouchPoints,
        cookieEnabled: navigator.cookieEnabled,
        doNotTrack: navigator.doNotTrack,
      },
      capabilities: {
        hardwareConcurrencyBucket: bucketCpuThreads(nav.hardwareConcurrency),
        deviceMemoryBucket: bucketMemory(nav.deviceMemory),
        pdfViewerEnabled: nav.pdfViewerEnabled ?? null,
        secureContext: window.isSecureContext,
        crossOriginIsolated: window.crossOriginIsolated,
      },
      privacy: {
        firstPartyCookieCount: getCookieCount(),
        permissions: {
          notifications: "unsupported",
          geolocation: "unsupported",
          camera: "unsupported",
          microphone: "unsupported",
        },
      },
      security: {
        protocol: window.location.protocol,
        referrerPolicy: null,
        responseHeaders: {
          csp: null,
          referrerPolicy: null,
          permissionsPolicy: null,
          xFrameOptions: null,
          xContentTypeOptions: null,
          cacheControl: null,
        },
      },
    } satisfies BrowserDiagnostics;
  }, []);

  const collectEnriched = useCallback(async () => {
    const [permissions, probe] = await Promise.all([getPermissions(), probeApi()]);
    setData((current) => {
      if (!current) return current;

      return {
        ...current,
        connection: {
          ...current.connection,
          apiRttMs: probe.apiRttMs,
        },
        privacy: {
          ...current.privacy,
          permissions,
        },
        security: {
          ...current.security,
          responseHeaders: probe.responseHeaders,
        },
      };
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    const populate = () => {
      const next = collectBase();
      if (!cancelled) setData(next);
    };

    const populateWithEnrichment = () => {
      populate();
      if (enableAdvanced) {
        void collectEnriched();
      }
    };

    populateWithEnrichment();
    window.addEventListener("resize", populate);
    window.addEventListener("online", populateWithEnrichment);
    window.addEventListener("offline", populate);

    const connection = getConnection();
    const onConnectionChange = () => {
      if (enableAdvanced) {
        populateWithEnrichment();
      } else {
        populate();
      }
    };
    connection?.addEventListener?.("change", onConnectionChange);

    return () => {
      cancelled = true;
      window.removeEventListener("resize", populate);
      window.removeEventListener("online", populateWithEnrichment);
      window.removeEventListener("offline", populate);
      connection?.removeEventListener?.("change", onConnectionChange);
    };
  }, [collectBase, collectEnriched, enableAdvanced]);

  return useMemo(() => data, [data]);
}
