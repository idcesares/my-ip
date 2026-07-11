import { describe, expect, it } from "vitest";
import { computeDiagnosticAssessment } from "@/lib/privacy-score";
import { assessWebRTCExposure } from "@/lib/webrtc-diagnostics";
import type {
  BrowserDiagnosticsSnapshot,
  IPInfo,
  WebRTCLeakResult,
} from "@/types";

function makeIPInfo(overrides: Partial<IPInfo> = {}): IPInfo {
  return {
    ip: "203.0.113.1",
    ipVersion: "IPv4",
    ipv4: "203.0.113.1",
    ipv6: null,
    isPublic: true,
    source: "x-real-ip",
    confidence: "high",
    provenance: {
      provider: "vercel",
      header: "x-real-ip",
      trusted: true,
      forwarded: true,
    },
    category: "Public",
    timestamp: "2026-07-11T00:00:00.000Z",
    warnings: [],
    request: { userAgent: "test", language: "en", protocol: "https" },
    location: null,
    isp: null,
    ...overrides,
  };
}

function makeDiagnostics(
  headerStatus: BrowserDiagnosticsSnapshot["security"]["responseHeadersStatus"] = "measured",
): BrowserDiagnosticsSnapshot {
  return {
    userAgent: "test",
    languages: ["en-US"],
    timezone: "UTC",
    viewport: "1280 x 720",
    screenResolution: "1280 x 720",
    availableScreen: "1280 x 680",
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
      pageFetchMs: 20,
    },
    preferences: {
      colorScheme: "dark",
      reducedMotion: false,
      highContrast: false,
      touchCapable: false,
      maxTouchPoints: 0,
      cookieEnabled: true,
    },
    capabilities: {
      hardwareConcurrencyBucket: "5-8",
      deviceMemoryGB: 8,
      pdfViewerEnabled: true,
      secureContext: true,
      crossOriginIsolated: false,
    },
    privacy: {
      scriptVisibleCookieCount: 0,
      permissions: {
        notifications: "unsupported",
        geolocation: "unsupported",
        camera: "unsupported",
        microphone: "unsupported",
      },
    },
    security: {
      protocol: "https:",
      responseHeaders: {
        csp: "default-src 'self'",
        referrerPolicy: null,
        permissionsPolicy: "camera=()",
        xFrameOptions: "DENY",
        xContentTypeOptions: "nosniff",
        cacheControl: "no-store",
      },
      responseHeadersStatus: headerStatus,
    },
  };
}

describe("computeDiagnosticAssessment", () => {
  const notRun = assessWebRTCExposure(null, makeIPInfo());

  it("returns null until IP and browser observations exist", () => {
    expect(computeDiagnosticAssessment(null, null, notRun)).toBeNull();
    expect(computeDiagnosticAssessment(makeIPInfo(), null, notRun)).toBeNull();
  });

  it("returns factual findings without a numeric score or grade", () => {
    const result = computeDiagnosticAssessment(
      makeIPInfo(),
      makeDiagnostics(),
      notRun,
    )!;
    expect(result.findings.length).toBeGreaterThan(0);
    expect(result).not.toHaveProperty("overall");
    expect(result).not.toHaveProperty("grade");
    expect(
      result.findings.find((item) => item.id === "ip-source")?.detail,
    ).toContain("vercel");
  });

  it("does not call unmeasured headers missing", () => {
    const result = computeDiagnosticAssessment(
      makeIPInfo(),
      makeDiagnostics("checking"),
      notRun,
    )!;
    const csp = result.findings.find((item) => item.id === "csp")!;
    expect(csp.status).toBe("unavailable");
    expect(csp.detail).toContain("Checking");
    expect(csp.detail).not.toContain("not observed");
  });

  it("reports measured absent headers as informational evidence", () => {
    const diagnostics = makeDiagnostics();
    diagnostics.security.responseHeaders.csp = null;
    const result = computeDiagnosticAssessment(
      makeIPInfo(),
      diagnostics,
      notRun,
    )!;
    const csp = result.findings.find((item) => item.id === "csp")!;
    expect(csp.status).toBe("informational");
    expect(csp.detail).toContain("not observed");
  });

  it("softens a clean WebRTC result to an observation", () => {
    const noCandidate: WebRTCLeakResult = {
      supported: true,
      completed: true,
      timedOut: false,
      candidates: [],
      error: null,
    };
    const assessment = assessWebRTCExposure(noCandidate, makeIPInfo());
    const result = computeDiagnosticAssessment(
      makeIPInfo(),
      makeDiagnostics(),
      assessment,
    )!;
    expect(
      result.findings.find((item) => item.id === "webrtc")?.detail,
    ).toContain("No literal or mDNS candidate address");
  });

  it("flags observed WebRTC candidates for attention", () => {
    const candidate: WebRTCLeakResult = {
      supported: true,
      completed: true,
      timedOut: false,
      candidates: [
        {
          address: "192.168.1.1",
          addressKind: "private",
          candidateType: "host",
          protocol: "udp",
        },
      ],
      error: null,
    };
    const assessment = assessWebRTCExposure(candidate, makeIPInfo());
    const result = computeDiagnosticAssessment(
      makeIPInfo(),
      makeDiagnostics(),
      assessment,
    )!;
    expect(result.findings.find((item) => item.id === "webrtc")?.status).toBe(
      "attention",
    );
  });
});
