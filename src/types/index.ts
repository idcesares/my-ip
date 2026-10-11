export interface IPInfo {
  ip: string;
  ipVersion: "IPv4" | "IPv6" | "Unknown";
  ipv4: string | null;
  ipv6: string | null;
  isPublic: boolean;
  source:
    "cloudflare" | "x-real-ip" | "x-forwarded-for" | "forwarded" | "fallback";
  confidence: "high" | "medium" | "low";
  provenance: {
    provider: "vercel" | "cloudflare" | "standard-forwarded" | "none";
    header:
      "x-real-ip" | "cf-connecting-ip" | "x-forwarded-for" | "forwarded" | null;
    trusted: boolean;
    forwarded: boolean;
  };
  category:
    | "Public"
    | "Private"
    | "CGNAT"
    | "Loopback"
    | "Link-Local"
    | "Reserved"
    | "Multicast"
    | "Unspecified";
  timestamp: string;
  warnings: string[];
  request: {
    userAgent: string;
    language: string;
    protocol: "http" | "https";
  };
  location: GeoLocation | null;
  isp: ISPInfo | null;
}

export interface GeoLocation {
  city: string | null;
  region: string | null;
  country: string | null;
  timezone: string | null;
  coordinates: {
    latitude: number | null;
    longitude: number | null;
  };
}

export interface ISPInfo {
  name: string | null;
  asn: string | null;
  organization: string | null;
}

export interface APIError {
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
}

export interface BrowserDiagnostics {
  userAgent: string;
  languages: string[];
  timezone: string;
  viewport: string;
  screenResolution: string;
  availableScreen: string;
  pixelRatio: number;
  colorDepth: number;
  online: boolean;
  connection: {
    effectiveType: string | null;
    type: string | null;
    downlink: number | null;
    downlinkMax: number | null;
    rtt: number | null;
    saveData: boolean | null;
    changedAt: string | null;
    /** Median of the same-origin HEAD probe samples. */
    pageFetchMs: number | null;
    pageFetchMinMs: number | null;
    pageFetchSamples: number;
  };
  preferences: {
    colorScheme: "light" | "dark";
    reducedMotion: boolean;
    highContrast: boolean;
    touchCapable: boolean;
    maxTouchPoints: number;
    cookieEnabled: boolean;
    /** null when the browser does not expose Global Privacy Control. */
    globalPrivacyControl: boolean | null;
  };
  capabilities: {
    hardwareConcurrency: number | null;
    deviceMemoryGB: number | null;
    pdfViewerEnabled: boolean | null;
    secureContext: boolean;
    crossOriginIsolated: boolean;
    localStorageAvailable: boolean;
    /** Low-entropy User-Agent Client Hints; null when unsupported. */
    userAgentData: {
      platform: string | null;
      mobile: boolean | null;
      brands: string[];
    } | null;
  };
  privacy: {
    scriptVisibleCookieCount: number;
    permissions: {
      notifications: PermissionState | "unsupported" | "error";
      geolocation: PermissionState | "unsupported" | "error";
      camera: PermissionState | "unsupported" | "error";
      microphone: PermissionState | "unsupported" | "error";
    };
  };
  security: {
    protocol: string;
    responseHeaders: {
      csp: string | null;
      referrerPolicy: string | null;
      permissionsPolicy: string | null;
      strictTransportSecurity: string | null;
      xFrameOptions: string | null;
      xContentTypeOptions: string | null;
      cacheControl: string | null;
    };
  };
}

export type HeaderMeasurementStatus = "checking" | "measured" | "unavailable";

export type BrowserDiagnosticsSnapshot = Omit<
  BrowserDiagnostics,
  "security"
> & {
  security: BrowserDiagnostics["security"] & {
    responseHeadersStatus: HeaderMeasurementStatus;
    /** When the page probe last completed; null until the first run. */
    probedAt: string | null;
  };
};

export interface WebRTCLeakResult {
  supported: boolean;
  completed: boolean;
  timedOut: boolean;
  candidates: WebRTCCandidateObservation[];
  error: string | null;
}

export interface WebRTCCandidateObservation {
  address: string;
  addressKind: "public" | "private" | "mdns" | "special" | "unknown";
  candidateType: "host" | "srflx" | "prflx" | "relay" | null;
  protocol: "udp" | "tcp" | null;
}

export interface HistoryEntry {
  id: string;
  ip: string;
  ipVersion: "IPv4" | "IPv6" | "Unknown";
  timestamp: string;
  location: string | null;
}
