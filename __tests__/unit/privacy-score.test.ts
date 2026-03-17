import { describe, expect, it } from "vitest";
import { computePrivacyScore } from "@/lib/privacy-score";
import type { BrowserDiagnostics, IPInfo, WebRTCLeakResult } from "@/types";

function makeIPInfo(overrides: Partial<IPInfo> = {}): IPInfo {
  return {
    ip: "203.0.113.1",
    ipVersion: "IPv4",
    ipv4: "203.0.113.1",
    ipv6: null,
    isPublic: true,
    source: "cloudflare",
    confidence: "high",
    relayLikely: false,
    category: "Public",
    timestamp: new Date().toISOString(),
    warnings: [],
    request: { userAgent: "test", language: "en", protocol: "https" },
    location: null,
    isp: null,
    ...overrides,
  };
}

function makeDiagnostics(overrides: Partial<BrowserDiagnostics> = {}): BrowserDiagnostics {
  return {
    userAgent: "test",
    languages: ["en-US"],
    timezone: "America/New_York",
    viewport: "1920 x 1080",
    screenResolution: "1920 x 1080",
    availableScreen: "1920 x 1040",
    pixelRatio: 1,
    colorDepth: 24,
    online: true,
    connection: {
      effectiveType: "4g",
      type: null,
      downlink: 10,
      downlinkMax: null,
      rtt: 50,
      saveData: null,
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
      doNotTrack: "1",
    },
    capabilities: {
      hardwareConcurrencyBucket: "5-8",
      deviceMemoryBucket: "8GB",
      pdfViewerEnabled: true,
      secureContext: true,
      crossOriginIsolated: false,
    },
    privacy: {
      firstPartyCookieCount: 0,
      permissions: {
        notifications: "denied",
        geolocation: "denied",
        camera: "denied",
        microphone: "denied",
      },
    },
    security: {
      protocol: "https:",
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
    ...overrides,
  };
}

describe("computePrivacyScore", () => {
  it("returns null when ip or diagnostics is null", () => {
    expect(computePrivacyScore(null, null, null)).toBeNull();
    expect(computePrivacyScore(makeIPInfo(), null, null)).toBeNull();
    expect(computePrivacyScore(null, makeDiagnostics(), null)).toBeNull();
  });

  it("returns a score between 0 and 100", () => {
    const result = computePrivacyScore(makeIPInfo(), makeDiagnostics(), null);
    expect(result).not.toBeNull();
    expect(result!.overall).toBeGreaterThanOrEqual(0);
    expect(result!.overall).toBeLessThanOrEqual(100);
  });

  it("returns a valid grade", () => {
    const result = computePrivacyScore(makeIPInfo(), makeDiagnostics(), null);
    expect(["A+", "A", "B", "C", "D", "F"]).toContain(result!.grade);
  });

  it("includes checks array", () => {
    const result = computePrivacyScore(makeIPInfo(), makeDiagnostics(), null);
    expect(result!.checks.length).toBeGreaterThan(0);
    for (const check of result!.checks) {
      expect(check).toHaveProperty("id");
      expect(check).toHaveProperty("label");
      expect(check).toHaveProperty("status");
      expect(check).toHaveProperty("detail");
      expect(check).toHaveProperty("weight");
      expect(["pass", "warn", "fail"]).toContain(check.status);
    }
  });

  it("HTTPS pass gives better score than HTTP fail", () => {
    const httpsIP = makeIPInfo({ request: { userAgent: "test", language: "en", protocol: "https" } });
    const httpIP = makeIPInfo({ request: { userAgent: "test", language: "en", protocol: "http" } });
    const diag = makeDiagnostics();

    const httpsScore = computePrivacyScore(httpsIP, diag, null)!;
    const httpScore = computePrivacyScore(httpIP, diag, null)!;

    expect(httpsScore.overall).toBeGreaterThan(httpScore.overall);
  });

  it("WebRTC leak causes fail check", () => {
    const leak: WebRTCLeakResult = {
      supported: true,
      leaking: true,
      localIPs: ["192.168.1.1"],
      publicIPs: ["203.0.113.1"],
      error: null,
    };

    const result = computePrivacyScore(makeIPInfo(), makeDiagnostics(), leak);
    const webrtcCheck = result!.checks.find((c) => c.id === "webrtc");
    expect(webrtcCheck).toBeDefined();
    expect(webrtcCheck!.status).toBe("fail");
  });

  it("no WebRTC leak gives pass", () => {
    const noLeak: WebRTCLeakResult = {
      supported: true,
      leaking: false,
      localIPs: [],
      publicIPs: [],
      error: null,
    };

    const result = computePrivacyScore(makeIPInfo(), makeDiagnostics(), noLeak);
    const webrtcCheck = result!.checks.find((c) => c.id === "webrtc");
    expect(webrtcCheck).toBeDefined();
    expect(webrtcCheck!.status).toBe("pass");
  });

  it("detects timezone mismatch as consistency issue", () => {
    const ip = makeIPInfo({
      location: {
        city: "Tokyo",
        region: "Tokyo",
        country: "JP",
        timezone: "Asia/Tokyo",
        coordinates: { latitude: 35.6762, longitude: 139.6503 },
      },
    });
    const diag = makeDiagnostics({ timezone: "America/New_York" });

    const result = computePrivacyScore(ip, diag, null);
    expect(result!.consistencyIssues.length).toBeGreaterThan(0);
    expect(result!.consistencyIssues[0]).toContain("Timezone mismatch");
  });

  it("detects language mismatch as consistency issue", () => {
    const ip = makeIPInfo({
      location: {
        city: "Tokyo",
        region: "Tokyo",
        country: "JP",
        timezone: "Asia/Tokyo",
        coordinates: { latitude: 35.6762, longitude: 139.6503 },
      },
    });
    const diag = makeDiagnostics({ timezone: "Asia/Tokyo", languages: ["en-US"] });

    const result = computePrivacyScore(ip, diag, null);
    const langIssue = result!.consistencyIssues.find((i) => i.includes("Language mismatch"));
    expect(langIssue).toBeDefined();
  });

  it("no consistency issues when timezone and language match", () => {
    const ip = makeIPInfo({
      location: {
        city: "New York",
        region: "New York",
        country: "US",
        timezone: "America/New_York",
        coordinates: { latitude: 40.7, longitude: -74.0 },
      },
    });
    const diag = makeDiagnostics({ timezone: "America/New_York", languages: ["en-US"] });

    const result = computePrivacyScore(ip, diag, null);
    expect(result!.consistencyIssues).toHaveLength(0);
  });

  it("DNT enabled gives pass", () => {
    const diag = makeDiagnostics({
      preferences: {
        colorScheme: "dark",
        reducedMotion: false,
        highContrast: false,
        touchCapable: false,
        maxTouchPoints: 0,
        cookieEnabled: true,
        doNotTrack: "1",
      },
    });

    const result = computePrivacyScore(makeIPInfo(), diag, null);
    const dntCheck = result!.checks.find((c) => c.id === "dnt");
    expect(dntCheck!.status).toBe("pass");
  });

  it("DNT disabled gives warn", () => {
    const diag = makeDiagnostics({
      preferences: {
        colorScheme: "dark",
        reducedMotion: false,
        highContrast: false,
        touchCapable: false,
        maxTouchPoints: 0,
        cookieEnabled: true,
        doNotTrack: null,
      },
    });

    const result = computePrivacyScore(makeIPInfo(), diag, null);
    const dntCheck = result!.checks.find((c) => c.id === "dnt");
    expect(dntCheck!.status).toBe("warn");
  });
});
