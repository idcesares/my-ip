import type { WebRTCAssessment } from "@/lib/webrtc-diagnostics";
import type { BrowserDiagnosticsSnapshot, IPInfo } from "@/types";

export type DiagnosticFindingStatus =
  "positive" | "attention" | "informational" | "unavailable";

export interface DiagnosticFinding {
  id: string;
  label: string;
  status: DiagnosticFindingStatus;
  detail: string;
  source: string;
}

export interface DiagnosticAssessment {
  findings: DiagnosticFinding[];
  summary: {
    attention: number;
    unavailable: number;
  };
}

function finding(
  id: string,
  label: string,
  status: DiagnosticFindingStatus,
  detail: string,
  source: string,
): DiagnosticFinding {
  return { id, label, status, detail, source };
}

function headerFinding(
  diagnostics: BrowserDiagnosticsSnapshot,
  id: string,
  label: string,
  value: string | null,
): DiagnosticFinding {
  const measurement = diagnostics.security.responseHeadersStatus;

  if (measurement === "checking") {
    return finding(
      id,
      label,
      "unavailable",
      "Checking the current page response…",
      "Same-origin page response",
    );
  }

  if (measurement === "unavailable") {
    return finding(
      id,
      label,
      "unavailable",
      "The response could not be inspected in this browser session.",
      "Same-origin page response",
    );
  }

  return value
    ? finding(
        id,
        label,
        "positive",
        `${label} is present on the current page response.`,
        "Same-origin page response",
      )
    : finding(
        id,
        label,
        "informational",
        `${label} was not observed on the current page response.`,
        "Same-origin page response",
      );
}

export function computeDiagnosticAssessment(
  ip: IPInfo | null,
  diagnostics: BrowserDiagnosticsSnapshot | null,
  webrtc: WebRTCAssessment,
): DiagnosticAssessment | null {
  if (!ip || !diagnostics) return null;

  const findings: DiagnosticFinding[] = [
    finding(
      "https",
      "Encrypted connection",
      ip.request.protocol === "https" ? "positive" : "attention",
      ip.request.protocol === "https"
        ? "This request reached the app over HTTPS."
        : "This request did not report HTTPS; network traffic may not be encrypted.",
      "Request protocol",
    ),
    finding(
      "ip-source",
      "Detection provenance",
      "informational",
      `Provider ${ip.provenance.provider} reported ${ip.provenance.header ?? "no forwarding header"}; ${ip.provenance.trusted ? "the deployment trusts this source" : "the deployment does not mark this source as trusted"}.`,
      "Request headers",
    ),
    finding(
      "ip-visibility",
      "Reachable address",
      "informational",
      ip.category === "Public"
        ? "A public address is visible to this site, as expected for an IP lookup."
        : `The detected address is categorized as ${ip.category}.`,
      "IP classification",
    ),
    finding(
      "secure-context",
      "Secure browser context",
      diagnostics.capabilities.secureContext ? "positive" : "attention",
      diagnostics.capabilities.secureContext
        ? "The page is running in a secure browser context."
        : "The browser does not consider this page a secure context.",
      "Browser runtime",
    ),
    headerFinding(
      diagnostics,
      "csp",
      "Content Security Policy",
      diagnostics.security.responseHeaders.csp,
    ),
    headerFinding(
      diagnostics,
      "permissions-policy",
      "Permissions Policy",
      diagnostics.security.responseHeaders.permissionsPolicy,
    ),
  ];

  if (webrtc.status === "not-run") {
    findings.push(
      finding(
        "webrtc",
        "WebRTC address exposure",
        "informational",
        webrtc.summary,
        "Active test",
      ),
    );
  } else if (webrtc.status === "unavailable") {
    findings.push(
      finding(
        "webrtc",
        "WebRTC address exposure",
        "unavailable",
        webrtc.summary,
        "Active test",
      ),
    );
  } else if (webrtc.status === "additional-exposure") {
    findings.push(
      finding(
        "webrtc",
        "WebRTC address exposure",
        "attention",
        webrtc.summary,
        "Active test",
      ),
    );
  } else if (webrtc.status === "none-observed") {
    findings.push(
      finding(
        "webrtc",
        "WebRTC address exposure",
        "positive",
        webrtc.summary,
        "Active test",
      ),
    );
  } else {
    findings.push(
      finding(
        "webrtc",
        "WebRTC address exposure",
        "informational",
        webrtc.summary,
        "Active test",
      ),
    );
  }

  return {
    findings,
    summary: {
      attention: findings.filter((item) => item.status === "attention").length,
      unavailable: findings.filter((item) => item.status === "unavailable")
        .length,
    },
  };
}
