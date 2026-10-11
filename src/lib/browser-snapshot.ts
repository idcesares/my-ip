import {
  countScriptVisibleCookies,
  finiteOrNull,
  median,
  normalizeDeviceMemory,
  normalizeHardwareConcurrency,
} from "@/lib/browser-metrics";
import type { BrowserDiagnostics, BrowserDiagnosticsSnapshot } from "@/types";

export type NetworkInfo = {
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
export type ResponseHeaders = BrowserDiagnostics["security"]["responseHeaders"];

/** Sequential same-origin HEAD requests per measurement. */
export const PROBE_SAMPLES = 5;

export const EMPTY_HEADERS: ResponseHeaders = {
  csp: null,
  referrerPolicy: null,
  permissionsPolicy: null,
  strictTransportSecurity: null,
  xFrameOptions: null,
  xContentTypeOptions: null,
  cacheControl: null,
};

export function getConnection(): NetworkInfo | null {
  if (typeof navigator === "undefined") return null;
  const nav = navigator as Navigator & {
    connection?: NetworkInfo;
    mozConnection?: NetworkInfo;
    webkitConnection?: NetworkInfo;
  };
  return nav.connection ?? nav.mozConnection ?? nav.webkitConnection ?? null;
}

export function networkSignature(connection: NetworkInfo | null): string {
  return [
    connection?.effectiveType ?? null,
    connection?.type ?? null,
    connection?.downlink ?? null,
    connection?.rtt ?? null,
    connection?.saveData ?? null,
  ].join("|");
}

function localStorageAvailable(): boolean {
  try {
    const key = "__diagnostics_probe__";
    localStorage.setItem(key, "1");
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

function readUserAgentData(): BrowserDiagnostics["capabilities"]["userAgentData"] {
  const data = (
    navigator as Navigator & {
      userAgentData?: {
        platform?: string;
        mobile?: boolean;
        brands?: { brand: string; version: string }[];
      };
    }
  ).userAgentData;
  if (!data) return null;
  return {
    platform: data.platform || null,
    mobile: typeof data.mobile === "boolean" ? data.mobile : null,
    brands: (data.brands ?? []).map(
      ({ brand, version }) => `${brand} ${version}`,
    ),
  };
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

export async function getPermissions(): Promise<PermissionSummary> {
  const [notifications, geolocation, camera, microphone] = await Promise.all([
    queryPermission("notifications"),
    queryPermission("geolocation"),
    queryPermission("camera"),
    queryPermission("microphone"),
  ]);
  return { notifications, geolocation, camera, microphone };
}

export interface PageProbe {
  status: "measured" | "unavailable";
  pageFetchMs: number | null;
  pageFetchMinMs: number | null;
  samples: number;
  responseHeaders: ResponseHeaders;
  probedAt: string;
}

/**
 * Times several no-store HEAD requests to the current page and reads the
 * response headers from the last one. One request is a noisy sample (it can
 * include connection setup), so the median and minimum are reported.
 */
export async function probeCurrentPage(
  options: {
    samples?: number;
    fetchImpl?: typeof fetch;
    now?: () => number;
    path?: string;
  } = {},
): Promise<PageProbe> {
  const {
    samples = PROBE_SAMPLES,
    fetchImpl = fetch,
    now = () => performance.now(),
    path = window.location.pathname || "/",
  } = options;

  const durations: number[] = [];
  let headers: Headers | null = null;

  try {
    for (let index = 0; index < samples; index++) {
      const start = now();
      const response = await fetchImpl(path, {
        method: "HEAD",
        cache: "no-store",
      });
      durations.push(Math.round(now() - start));
      headers = response.headers;
    }
  } catch {
    // Keep whatever was measured before the failure.
  }

  const probedAt = new Date().toISOString();
  if (!headers || durations.length === 0) {
    return {
      status: "unavailable",
      pageFetchMs: null,
      pageFetchMinMs: null,
      samples: 0,
      responseHeaders: EMPTY_HEADERS,
      probedAt,
    };
  }

  return {
    status: "measured",
    pageFetchMs: median(durations),
    pageFetchMinMs: Math.min(...durations),
    samples: durations.length,
    responseHeaders: {
      csp: headers.get("content-security-policy"),
      referrerPolicy: headers.get("referrer-policy"),
      permissionsPolicy: headers.get("permissions-policy"),
      strictTransportSecurity: headers.get("strict-transport-security"),
      xFrameOptions: headers.get("x-frame-options"),
      xContentTypeOptions: headers.get("x-content-type-options"),
      cacheControl: headers.get("cache-control"),
    },
    probedAt,
  };
}

/** Everything that can be read synchronously from the browser. */
export function collectBaseSnapshot(
  changedAt: string | null,
): BrowserDiagnosticsSnapshot {
  const connection = getConnection();
  const nav = navigator as Navigator & {
    hardwareConcurrency?: number;
    deviceMemory?: number;
    pdfViewerEnabled?: boolean;
    globalPrivacyControl?: boolean;
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
      downlink: finiteOrNull(connection?.downlink),
      downlinkMax: finiteOrNull(connection?.downlinkMax),
      rtt: finiteOrNull(connection?.rtt),
      saveData: connection?.saveData ?? null,
      changedAt,
      pageFetchMs: null,
      pageFetchMinMs: null,
      pageFetchSamples: 0,
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
      globalPrivacyControl:
        typeof nav.globalPrivacyControl === "boolean"
          ? nav.globalPrivacyControl
          : null,
    },
    capabilities: {
      hardwareConcurrency: normalizeHardwareConcurrency(
        nav.hardwareConcurrency,
      ),
      deviceMemoryGB: normalizeDeviceMemory(nav.deviceMemory),
      pdfViewerEnabled: nav.pdfViewerEnabled ?? null,
      secureContext: window.isSecureContext,
      crossOriginIsolated: window.crossOriginIsolated,
      localStorageAvailable: localStorageAvailable(),
      userAgentData: readUserAgentData(),
    },
    privacy: {
      scriptVisibleCookieCount: countScriptVisibleCookies(document.cookie),
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
      probedAt: null,
    },
  };
}
