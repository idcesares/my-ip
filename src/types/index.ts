export interface IPInfo {
  ip: string;
  ipVersion: "IPv4" | "IPv6" | "Unknown";
  ipv4: string | null;
  ipv6: string | null;
  isPublic: boolean;
  source: "cloudflare" | "x-real-ip" | "x-forwarded-for" | "forwarded" | "fallback";
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
    downlink: number | null;
    rtt: number | null;
    saveData: boolean | null;
  };
  preferences: {
    colorScheme: "light" | "dark";
    reducedMotion: boolean;
    highContrast: boolean;
    touchCapable: boolean;
    cookieEnabled: boolean;
    doNotTrack: string | null;
  };
  security: {
    protocol: string;
    referrerPolicy: string | null;
  };
}

export interface HistoryEntry {
  id: string;
  ip: string;
  ipVersion: "IPv4" | "IPv6" | "Unknown";
  timestamp: string;
  location: string | null;
}