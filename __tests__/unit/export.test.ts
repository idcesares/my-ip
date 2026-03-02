import { describe, expect, it, vi } from "vitest";
import { buildTextReport, timestampName } from "@/lib/export";
import type { BrowserDiagnostics, IPInfo } from "@/types";

function buildIP(overrides: Partial<IPInfo> = {}): IPInfo {
  return {
    ip: "203.0.113.42",
    ipVersion: "IPv4",
    ipv4: "203.0.113.42",
    ipv6: null,
    isPublic: true,
    source: "x-real-ip",
    confidence: "high",
    relayLikely: false,
    category: "Public",
    timestamp: "2026-03-02T12:00:00.000Z",
    warnings: [],
    request: { userAgent: "TestAgent", language: "en-US", protocol: "https" },
    location: null,
    isp: null,
    ...overrides,
  };
}

function buildBrowser(overrides: Partial<BrowserDiagnostics> = {}): BrowserDiagnostics {
  return {
    userAgent: "TestAgent/1.0",
    languages: ["en-US"],
    timezone: "America/New_York",
    viewport: "1920x1080",
    screenResolution: "1920x1080",
    availableScreen: "1920x1040",
    pixelRatio: 2,
    colorDepth: 24,
    online: true,
    connection: {
      effectiveType: "4g",
      type: null,
      downlink: 10,
      downlinkMax: null,
      rtt: 50,
      saveData: false,
      changedAt: null,
      apiRttMs: null,
    },
    preferences: {
      colorScheme: "dark",
      reducedMotion: false,
      highContrast: false,
      touchCapable: false,
      maxTouchPoints: 0,
      cookieEnabled: true,
      doNotTrack: null,
    },
    capabilities: {
      hardwareConcurrencyBucket: "8",
      deviceMemoryBucket: "8",
      pdfViewerEnabled: true,
      secureContext: true,
      crossOriginIsolated: false,
    },
    privacy: {
      firstPartyCookieCount: 0,
      permissions: {
        notifications: "prompt",
        geolocation: "prompt",
        camera: "prompt",
        microphone: "prompt",
      },
    },
    security: {
      protocol: "https:",
      referrerPolicy: "strict-origin-when-cross-origin",
      responseHeaders: {
        csp: null,
        referrerPolicy: null,
        permissionsPolicy: null,
        xFrameOptions: null,
        xContentTypeOptions: null,
        cacheControl: null,
      },
    },
    ...overrides,
  };
}

describe("buildTextReport", () => {
  it("includes IP and version info", () => {
    const report = buildTextReport(buildIP(), null);
    expect(report).toContain("Your IP Address: 203.0.113.42 (IPv4)");
    expect(report).toContain("Category: Public");
    expect(report).toContain("Detection Source: x-real-ip");
    expect(report).toContain("Detection Confidence: high");
  });

  it("handles null browser diagnostics without crashing", () => {
    const report = buildTextReport(buildIP(), null);
    expect(report).not.toContain("Timezone:");
    expect(report).not.toContain("Viewport:");
    expect(report).not.toContain("Connection:");
  });

  it("includes browser diagnostics when provided", () => {
    const report = buildTextReport(buildIP(), buildBrowser());
    expect(report).toContain("Timezone: America/New_York");
    expect(report).toContain("Viewport: 1920x1080");
    expect(report).toContain("Connection: 4g");
  });

  it("includes location when present", () => {
    const ip = buildIP({
      location: {
        city: "São Paulo",
        region: "SP",
        country: "BR",
        timezone: "America/Sao_Paulo",
        coordinates: { latitude: -23.55, longitude: -46.63 },
      },
    });
    const report = buildTextReport(ip, null);
    expect(report).toContain("Location: São Paulo, SP, BR");
  });

  it("omits location line when location is null", () => {
    const report = buildTextReport(buildIP(), null);
    expect(report).not.toContain("Location:");
  });

  it("handles null connection effectiveType", () => {
    const browser = buildBrowser({
      connection: {
        effectiveType: null,
        type: null,
        downlink: null,
        downlinkMax: null,
        rtt: null,
        saveData: null,
        changedAt: null,
        apiRttMs: null,
      },
    });
    const report = buildTextReport(buildIP(), browser);
    expect(report).toContain("Connection: N/A");
  });
});

describe("timestampName", () => {
  it("replaces colons and dots with dashes", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-02T15:30:45.123Z"));

    const name = timestampName();
    expect(name).toBe("2026-03-02T15-30-45-123Z");
    expect(name).not.toContain(":");
    expect(name).not.toContain(".");

    vi.useRealTimers();
  });
});
