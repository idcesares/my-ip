export interface IPInfo {
  ip: string;
  ipVersion: "IPv4" | "IPv6" | "Unknown";
  ipv4: string | null;
  ipv6: string | null;
  isPublic: boolean;
  source: "cloudflare" | "x-real-ip" | "x-forwarded-for" | "forwarded" | "fallback";
  confidence: "high" | "medium" | "low";
  relayLikely: boolean;
  category: "Public" | "Private" | "CGNAT" | "Loopback" | "Link-Local";
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
    apiRttMs: number | null;
  };
  preferences: {
    colorScheme: "light" | "dark";
    reducedMotion: boolean;
    highContrast: boolean;
    touchCapable: boolean;
    maxTouchPoints: number;
    cookieEnabled: boolean;
    doNotTrack: string | null;
  };
  capabilities: {
    hardwareConcurrencyBucket: string | null;
    deviceMemoryBucket: string | null;
    pdfViewerEnabled: boolean | null;
    secureContext: boolean;
    crossOriginIsolated: boolean;
  };
  privacy: {
    firstPartyCookieCount: number;
    permissions: {
      notifications: PermissionState | "unsupported" | "error";
      geolocation: PermissionState | "unsupported" | "error";
      camera: PermissionState | "unsupported" | "error";
      microphone: PermissionState | "unsupported" | "error";
    };
  };
  security: {
    protocol: string;
    referrerPolicy: string | null;
    responseHeaders: {
      csp: string | null;
      referrerPolicy: string | null;
      permissionsPolicy: string | null;
      xFrameOptions: string | null;
      xContentTypeOptions: string | null;
      cacheControl: string | null;
    };
  };
}

export interface HistoryEntry {
  id: string;
  ip: string;
  ipVersion: "IPv4" | "IPv6" | "Unknown";
  timestamp: string;
  location: string | null;
}
