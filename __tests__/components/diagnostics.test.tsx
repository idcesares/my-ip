import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { InfoGrid } from "@/components/info-grid";
import { WebRTCLeakCard } from "@/components/webrtc-leak-card";
import type { WebRTCAssessment } from "@/lib/webrtc-diagnostics";
import type { BrowserDiagnosticsSnapshot } from "@/types";

function diagnostics(
  headerStatus: BrowserDiagnosticsSnapshot["security"]["responseHeadersStatus"] = "measured",
): BrowserDiagnosticsSnapshot {
  return {
    userAgent: "test",
    languages: ["pt-BR"],
    timezone: "America/Sao_Paulo",
    viewport: "1707 x 898",
    screenResolution: "1707 x 1067",
    availableScreen: "1707 x 1020",
    pixelRatio: 1.5,
    colorDepth: 24,
    online: true,
    connection: {
      effectiveType: "4g",
      type: null,
      downlink: 10,
      downlinkMax: null,
      rtt: 100,
      saveData: false,
      changedAt: null,
      pageFetchMs: 1665,
    },
    preferences: {
      colorScheme: "dark",
      reducedMotion: false,
      highContrast: false,
      touchCapable: true,
      maxTouchPoints: 2,
      cookieEnabled: true,
    },
    capabilities: {
      hardwareConcurrencyBucket: "9+",
      deviceMemoryGB: 8,
      pdfViewerEnabled: true,
      secureContext: true,
      crossOriginIsolated: false,
    },
    privacy: {
      scriptVisibleCookieCount: 0,
      permissions: {
        notifications: "prompt",
        geolocation: "denied",
        camera: "denied",
        microphone: "denied",
      },
    },
    security: {
      protocol: "https:",
      responseHeaders: {
        csp: "default-src 'self'",
        referrerPolicy: "strict-origin-when-cross-origin",
        permissionsPolicy: "camera=()",
        xFrameOptions: "DENY",
        xContentTypeOptions: "nosniff",
        cacheControl: "no-store",
      },
      responseHeadersStatus: headerStatus,
    },
  };
}

function assessment(
  overrides: Partial<WebRTCAssessment> = {},
): WebRTCAssessment {
  return {
    status: "expected-address",
    attention: false,
    summary:
      "WebRTC exposed only the same public address already used for this HTTP request.",
    expectedPublicAddresses: ["8.8.8.8"],
    additionalPublicAddresses: [],
    privateAddresses: [],
    maskedHostnames: [],
    otherAddresses: [],
    timedOut: false,
    ...overrides,
  };
}

describe("InfoGrid", () => {
  it("labels estimates and active fetch duration accurately", () => {
    render(
      <InfoGrid data={diagnostics()} showAdvanced onToggleAdvanced={vi.fn()} />,
    );
    expect(screen.getByText("4g (estimate)")).toBeInTheDocument();
    expect(screen.getByText("10 Mbps (estimate)")).toBeInTheDocument();
    expect(screen.getByText("Page fetch")).toBeInTheDocument();
    expect(screen.queryByText("DNT")).not.toBeInTheDocument();
    expect(screen.getByText("Script-visible cookies")).toBeInTheDocument();
  });

  it("never reports unmeasured response headers as absent", () => {
    render(
      <InfoGrid
        data={diagnostics("checking")}
        showAdvanced={false}
        onToggleAdvanced={vi.fn()}
      />,
    );
    expect(screen.getAllByText("Checking…")).toHaveLength(3);
    expect(screen.queryByText("Not observed")).not.toBeInTheDocument();
  });

  it("describes the advanced toggle as an action", () => {
    const onToggle = vi.fn();
    render(
      <InfoGrid
        data={diagnostics()}
        showAdvanced={false}
        onToggleAdvanced={onToggle}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Show advanced signals" }),
    );
    expect(onToggle).toHaveBeenCalledOnce();
  });
});

describe("WebRTCLeakCard", () => {
  it("treats the request address as expected rather than a leak", () => {
    render(
      <WebRTCLeakCard
        assessment={assessment()}
        scanning={false}
        onScan={vi.fn()}
      />,
    );
    expect(screen.getByText("Expected address only")).toBeInTheDocument();
    expect(screen.getByText("Current request address")).toBeInTheDocument();
  });

  it("highlights only additional exposure", () => {
    render(
      <WebRTCLeakCard
        assessment={assessment({
          status: "additional-exposure",
          attention: true,
          summary:
            "WebRTC exposed 1 additional public address beyond the address used for this HTTP request.",
          additionalPublicAddresses: ["2001:4860:4860::8888"],
        })}
        scanning={false}
        onScan={vi.fn()}
      />,
    );
    expect(screen.getByText("Additional exposure")).toBeInTheDocument();
    expect(screen.getByText("Additional public addresses")).toBeInTheDocument();
  });
});
