import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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
      pageFetchMinMs: 1500,
      pageFetchSamples: 5,
    },
    preferences: {
      colorScheme: "dark",
      reducedMotion: false,
      highContrast: false,
      touchCapable: true,
      maxTouchPoints: 2,
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
    unobservableFamilyAddresses: [],
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
    // CSP, Permissions-Policy, HSTS, and X-Frame-Options are all unmeasured.
    expect(screen.getAllByText("Checking…")).toHaveLength(4);
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

describe("InfoGrid measurement accuracy", () => {
  function renderGrid(
    mutate: (d: BrowserDiagnosticsSnapshot) => void = () => {},
    props: Partial<React.ComponentProps<typeof InfoGrid>> = {},
  ) {
    const data = diagnostics();
    mutate(data);
    return render(
      <InfoGrid
        data={data}
        showAdvanced
        onToggleAdvanced={vi.fn()}
        {...props}
      />,
    );
  }

  it("shows a real zero as zero, not as unsupported", () => {
    renderGrid((d) => {
      d.connection.downlink = 0;
      d.connection.rtt = 0;
    });
    expect(screen.getByText("0 Mbps (estimate)")).toBeInTheDocument();
    expect(screen.getByText("0 ms (estimate)")).toBeInTheDocument();
  });

  it("separates 'not reported' from 'unsupported' for network values", () => {
    renderGrid((d) => {
      d.connection.downlinkMax = null; // e.g. the browser reported Infinity
    });
    expect(screen.getByText("Not reported")).toBeInTheDocument();

    cleanup();
    renderGrid((d) => {
      d.connection.effectiveType = null;
      d.connection.downlink = null;
      d.connection.rtt = null;
      d.connection.downlinkMax = null;
    });
    expect(screen.queryByText("Not reported")).not.toBeInTheDocument();
    expect(screen.getAllByText("Unsupported").length).toBeGreaterThanOrEqual(4);
  });

  it("summarizes page fetch with median, minimum, and sample count", () => {
    renderGrid();
    expect(
      screen.getByText("1665 ms median · min 1500 ms · 5 samples"),
    ).toBeInTheDocument();
  });

  it("describes what each header actually allows", () => {
    renderGrid((d) => {
      d.security.responseHeaders.csp =
        "default-src 'self'; script-src 'self' 'unsafe-inline'";
      d.security.responseHeaders.strictTransportSecurity =
        "max-age=31536000; includeSubDomains";
      d.security.responseHeaders.permissionsPolicy =
        "camera=(), geolocation=(), microphone=()";
    });
    expect(
      screen.getByText("Present · allows inline scripts"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Present · max-age 1 year, includeSubDomains"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Present · disables camera, geolocation, microphone"),
    ).toBeInTheDocument();
    expect(screen.getByText("Present · DENY")).toBeInTheDocument();
    expect(screen.getByText("Present · nosniff")).toBeInTheDocument();
  });

  it("attributes denied permissions to this site's policy, not the visitor", () => {
    renderGrid((d) => {
      d.security.responseHeaders.permissionsPolicy =
        "geolocation=(), microphone=(), camera=()";
    });
    expect(screen.getAllByText("Blocked by this site's policy")).toHaveLength(
      3,
    );
    expect(screen.getByText("Prompt")).toBeInTheDocument();
  });

  it("shows the plain permission state until the policy has been measured", () => {
    const data = diagnostics("checking");
    render(<InfoGrid data={data} showAdvanced onToggleAdvanced={vi.fn()} />);
    expect(screen.queryByText("Blocked by this site's policy")).toBeNull();
    expect(screen.getAllByText("Denied")).toHaveLength(3);
  });

  it("shows exact processor count, client hints, and privacy signals", () => {
    renderGrid((d) => {
      d.capabilities.hardwareConcurrency = 12;
      d.capabilities.userAgentData = {
        platform: "macOS",
        mobile: false,
        brands: ["Chromium 141", "Google Chrome 141"],
      };
      d.preferences.globalPrivacyControl = true;
      d.capabilities.localStorageAvailable = false;
      d.languages = ["pt-BR", "en-US"];
    });
    expect(screen.getByText("12 (browser-reported)")).toBeInTheDocument();
    expect(
      screen.getByText("macOS · desktop · Chromium 141, Google Chrome 141"),
    ).toBeInTheDocument();
    expect(screen.getByText("On")).toBeInTheDocument();
    expect(screen.getByText("Blocked")).toBeInTheDocument();
    expect(screen.getByText("pt-BR, en-US")).toBeInTheDocument();
    expect(screen.getByText("User agent")).toBeInTheDocument();
  });

  it("reports unsupported Global Privacy Control and client hints honestly", () => {
    renderGrid();
    expect(screen.getAllByText("Unsupported").length).toBeGreaterThanOrEqual(2);
  });

  it("shows both the system scheme and the app theme", () => {
    renderGrid();
    expect(screen.getByText("System scheme")).toBeInTheDocument();
    expect(screen.getByText("App theme")).toBeInTheDocument();
  });

  it("offers a re-measure action and shows when it last ran", () => {
    const onRemeasure = vi.fn();
    renderGrid(() => {}, { onRemeasure });
    fireEvent.click(screen.getByRole("button", { name: "Re-measure" }));
    expect(onRemeasure).toHaveBeenCalledOnce();
    expect(
      screen.getByText(/Page fetch and header checks last ran at/),
    ).toBeInTheDocument();
  });

  it("disables re-measure while a measurement is running", () => {
    renderGrid(() => {}, { onRemeasure: vi.fn(), measuring: true });
    expect(screen.getByRole("button", { name: "Measuring…" })).toBeDisabled();
  });

  it("says so when no measurement has completed", () => {
    renderGrid((d) => {
      d.security.probedAt = null;
    });
    expect(
      screen.getByText("Page fetch and header checks have not completed yet."),
    ).toBeInTheDocument();
  });
});

describe("WebRTCLeakCard", () => {
  it("presents an IPv6 address this site cannot compare without alarm", () => {
    render(
      <WebRTCLeakCard
        assessment={assessment({
          status: "unobservable-family",
          attention: false,
          summary:
            "WebRTC revealed 1 public IPv6 address that this site cannot compare.",
          expectedPublicAddresses: [],
          unobservableFamilyAddresses: ["2001:4860:4860::8888"],
        })}
        scanning={false}
        onScan={vi.fn()}
      />,
    );
    expect(screen.getByText("IPv6 not comparable")).toBeInTheDocument();
    expect(
      screen.getByText("Public IPv6 addresses (this site cannot compare)"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Additional exposure")).not.toBeInTheDocument();
  });

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
