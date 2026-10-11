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
      pageFetchMinMs: 20,
      pageFetchSamples: 5,
    },
    preferences: {
      colorScheme: "dark",
      reducedMotion: false,
      highContrast: false,
      touchCapable: false,
      maxTouchPoints: 0,
      cookieEnabled: true,
      globalPrivacyControl: null,
    },
    capabilities: {
      hardwareConcurrency: 8,
      deviceMemoryGB: 8,
      pdfViewerEnabled: true,
      secureContext: true,
      crossOriginIsolated: false,
      localStorageAvailable: true,
      userAgentData: null,
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
        strictTransportSecurity: null,
        xFrameOptions: "DENY",
        xContentTypeOptions: "nosniff",
        cacheControl: "no-store",
      },
      responseHeadersStatus: headerStatus,
      probedAt: "2026-07-11T00:00:00.000Z",
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

  describe("header strength", () => {
    const finding = (
      id: string,
      mutate: (d: BrowserDiagnosticsSnapshot) => void,
    ) => {
      const diagnostics = makeDiagnostics();
      mutate(diagnostics);
      return computeDiagnosticAssessment(
        makeIPInfo(),
        diagnostics,
        notRun,
      )!.findings.find((item) => item.id === id)!;
    };

    it("does not call a CSP that allows inline scripts positive", () => {
      const csp = finding("csp", (d) => {
        d.security.responseHeaders.csp =
          "default-src 'self'; script-src 'self' 'unsafe-inline'";
      });
      expect(csp.status).toBe("informational");
      expect(csp.detail).toContain("allows inline scripts");
    });

    it("keeps a CSP that restricts scripts positive", () => {
      const csp = finding("csp", (d) => {
        d.security.responseHeaders.csp = "default-src 'self'";
      });
      expect(csp.status).toBe("positive");
    });

    it("reports a strong HSTS as positive and an ineffective one as informational", () => {
      const strong = finding("hsts", (d) => {
        d.security.responseHeaders.strictTransportSecurity =
          "max-age=31536000; includeSubDomains";
      });
      expect(strong.status).toBe("positive");
      expect(strong.detail).toContain("max-age 1 year");

      const weak = finding("hsts", (d) => {
        d.security.responseHeaders.strictTransportSecurity = "max-age=0";
      });
      expect(weak.status).toBe("informational");
      expect(weak.detail).toContain("ineffective");
    });

    it("treats a missing HSTS header as informational and unmeasured as unavailable", () => {
      expect(finding("hsts", () => {}).status).toBe("informational");
      const checking = finding("hsts", (d) => {
        d.security.responseHeadersStatus = "checking";
      });
      expect(checking.status).toBe("unavailable");
    });
  });

  it("reports an IPv6 address WebRTC revealed on an IPv4-only host as informational", () => {
    const result: WebRTCLeakResult = {
      supported: true,
      completed: true,
      timedOut: false,
      candidates: [
        {
          address: "2001:4860:4860::8888",
          addressKind: "public",
          candidateType: "srflx",
          protocol: "udp",
        },
      ],
      error: null,
    };
    const assessment = computeDiagnosticAssessment(
      makeIPInfo(),
      makeDiagnostics(),
      assessWebRTCExposure(result, makeIPInfo()),
    )!;
    const webrtc = assessment.findings.find((item) => item.id === "webrtc")!;
    expect(webrtc.status).toBe("informational");
    expect(assessment.summary.attention).toBe(0);
  });
});
