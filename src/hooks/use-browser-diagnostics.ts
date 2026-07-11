"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  bucketLogicalProcessors,
  countScriptVisibleCookies,
  normalizeDeviceMemory,
} from "@/lib/browser-metrics";
import type { BrowserDiagnostics } from "@/types";
import type { BrowserDiagnosticsSnapshot } from "@/lib/privacy-score";

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
type ResponseHeaders = BrowserDiagnostics["security"]["responseHeaders"];

const EMPTY_HEADERS: ResponseHeaders = {
  csp: null,
  referrerPolicy: null,
  permissionsPolicy: null,
  xFrameOptions: null,
  xContentTypeOptions: null,
  cacheControl: null,
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

function getCookieCount(): number {
  if (typeof document === "undefined") return 0;
  return countScriptVisibleCookies(document.cookie);
}

async function queryPermission(
  name: PermissionName,
): Promise<PermissionState | "unsupported" | "error"> {
  if (typeof navigator === "undefined" || !navigator.permissions?.query)
    return "unsupported";
  try {
    const result = await navigator.permissions.query({
      name,
    } as PermissionDescriptor);
    return result.state;
  } catch (error) {
    return error instanceof TypeError ? "unsupported" : "error";
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

async function probeCurrentPage() {
  try {
    const start = performance.now();
    const response = await fetch(window.location.pathname || "/", {
      method: "HEAD",
      cache: "no-store",
    });

    return {
      status: "measured" as const,
      pageFetchMs: Math.round(performance.now() - start),
      responseHeaders: {
        csp: response.headers.get("content-security-policy"),
        referrerPolicy: response.headers.get("referrer-policy"),
        permissionsPolicy: response.headers.get("permissions-policy"),
        xFrameOptions: response.headers.get("x-frame-options"),
        xContentTypeOptions: response.headers.get("x-content-type-options"),
        cacheControl: response.headers.get("cache-control"),
      } satisfies ResponseHeaders,
    };
  } catch {
    return {
      status: "unavailable" as const,
      pageFetchMs: null,
      responseHeaders: EMPTY_HEADERS,
    };
  }
}

export function useBrowserDiagnostics(enableAdvanced: boolean) {
  const [data, setData] = useState<BrowserDiagnosticsSnapshot | null>(null);
  const lastNetworkSignature = useRef<string | null>(null);
  const lastConnectionChangedAt = useRef<string | null>(null);

  const collectBase = useCallback((): BrowserDiagnosticsSnapshot => {
    const connection = getConnection();
    const currentSignature = [
      connection?.effectiveType ?? null,
      connection?.type ?? null,
      connection?.downlink ?? null,
      connection?.rtt ?? null,
      connection?.saveData ?? null,
    ].join("|");

    if (
      lastNetworkSignature.current &&
      lastNetworkSignature.current !== currentSignature
    ) {
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
        pageFetchMs: null,
      },
      preferences: {
        colorScheme: window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light",
        reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)")
          .matches,
        highContrast: window.matchMedia("(prefers-contrast: more)").matches,
        touchCapable: navigator.maxTouchPoints > 0,
        maxTouchPoints: navigator.maxTouchPoints,
        cookieEnabled: navigator.cookieEnabled,
      },
      capabilities: {
        hardwareConcurrencyBucket: bucketLogicalProcessors(
          nav.hardwareConcurrency,
        ),
        deviceMemoryGB: normalizeDeviceMemory(nav.deviceMemory),
        pdfViewerEnabled: nav.pdfViewerEnabled ?? null,
        secureContext: window.isSecureContext,
        crossOriginIsolated: window.crossOriginIsolated,
      },
      privacy: {
        scriptVisibleCookieCount: getCookieCount(),
        permissions: {
          notifications: "unsupported",
          geolocation: "unsupported",
          camera: "unsupported",
          microphone: "unsupported",
        },
      },
      security: {
        protocol: window.location.protocol,
        responseHeaders: EMPTY_HEADERS,
        responseHeadersStatus: "checking",
      },
    };
  }, []);

  const refreshHeaderProbe = useCallback(async () => {
    const probe = await probeCurrentPage();
    setData((current) =>
      current
        ? {
            ...current,
            connection: {
              ...current.connection,
              pageFetchMs: probe.pageFetchMs,
            },
            security: {
              ...current.security,
              responseHeaders: probe.responseHeaders,
              responseHeadersStatus: probe.status,
            },
          }
        : current,
    );
  }, []);

  useEffect(() => {
    const populate = () => {
      const next = collectBase();
      setData((current) =>
        current
          ? {
              ...next,
              connection: {
                ...next.connection,
                pageFetchMs: current.connection.pageFetchMs,
              },
              privacy: {
                ...next.privacy,
                permissions: current.privacy.permissions,
              },
              security: current.security,
            }
          : next,
      );
    };

    const onOnline = () => {
      populate();
      void refreshHeaderProbe();
    };

    const initialFrame = window.requestAnimationFrame(() => {
      populate();
      void refreshHeaderProbe();
    });
    window.addEventListener("resize", populate);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", populate);

    const connection = getConnection();
    connection?.addEventListener?.("change", populate);
    return () => {
      window.cancelAnimationFrame(initialFrame);
      window.removeEventListener("resize", populate);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", populate);
      connection?.removeEventListener?.("change", populate);
    };
  }, [collectBase, refreshHeaderProbe]);

  useEffect(() => {
    if (!enableAdvanced) return;
    let cancelled = false;
    void getPermissions().then((permissions) => {
      if (cancelled) return;
      setData((current) =>
        current
          ? { ...current, privacy: { ...current.privacy, permissions } }
          : current,
      );
    });
    return () => {
      cancelled = true;
    };
  }, [enableAdvanced]);

  return useMemo(() => data, [data]);
}
