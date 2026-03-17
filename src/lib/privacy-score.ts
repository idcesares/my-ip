import type {
  BrowserDiagnostics,
  IPInfo,
  PrivacyCheckResult,
  PrivacyScore,
  WebRTCLeakResult,
} from "@/types";

function check(
  id: string,
  label: string,
  status: "pass" | "warn" | "fail",
  detail: string,
  weight: number
): PrivacyCheckResult {
  return { id, label, status, detail, weight };
}

function scoreFromChecks(checks: PrivacyCheckResult[]): number {
  let earned = 0;
  let total = 0;

  for (const c of checks) {
    total += c.weight;
    if (c.status === "pass") earned += c.weight;
    else if (c.status === "warn") earned += c.weight * 0.5;
  }

  return total === 0 ? 100 : Math.round((earned / total) * 100);
}

function gradeFromScore(
  score: number
): "A+" | "A" | "B" | "C" | "D" | "F" {
  if (score >= 95) return "A+";
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 55) return "C";
  if (score >= 40) return "D";
  return "F";
}

function runIPChecks(ip: IPInfo): PrivacyCheckResult[] {
  const results: PrivacyCheckResult[] = [];

  results.push(
    check(
      "https",
      "HTTPS Connection",
      ip.request.protocol === "https" ? "pass" : "fail",
      ip.request.protocol === "https"
        ? "Connection is encrypted via HTTPS"
        : "Connection is not encrypted — traffic is visible to intermediaries",
      15
    )
  );

  results.push(
    check(
      "relay",
      "Request Relay Detection",
      ip.relayLikely ? "pass" : "warn",
      ip.relayLikely
        ? "Request was relayed through a proxy or load balancer"
        : "Direct connection detected — no intermediary relay",
      10
    )
  );

  results.push(
    check(
      "ip-public",
      "IP Visibility",
      ip.category === "Public" ? "warn" : "pass",
      ip.category === "Public"
        ? "Your public IP is visible to every site you visit"
        : `IP categorized as ${ip.category}`,
      5
    )
  );

  return results;
}

function runBrowserChecks(
  diag: BrowserDiagnostics
): PrivacyCheckResult[] {
  const results: PrivacyCheckResult[] = [];

  results.push(
    check(
      "dnt",
      "Do Not Track",
      diag.preferences.doNotTrack === "1" ? "pass" : "warn",
      diag.preferences.doNotTrack === "1"
        ? "Do Not Track header is enabled"
        : "Do Not Track is not set — sites may track your browsing",
      8
    )
  );

  results.push(
    check(
      "cookies",
      "Cookie Exposure",
      diag.privacy.firstPartyCookieCount === 0
        ? "pass"
        : diag.privacy.firstPartyCookieCount <= 3
          ? "warn"
          : "fail",
      diag.privacy.firstPartyCookieCount === 0
        ? "No first-party cookies detected"
        : `${diag.privacy.firstPartyCookieCount} first-party cookie(s) present`,
      6
    )
  );

  results.push(
    check(
      "secure-ctx",
      "Secure Context",
      diag.capabilities.secureContext ? "pass" : "fail",
      diag.capabilities.secureContext
        ? "Running in a secure context (HTTPS or localhost)"
        : "Not in a secure context — some privacy APIs are unavailable",
      10
    )
  );

  const langCount = diag.languages.length;
  results.push(
    check(
      "lang-entropy",
      "Language Fingerprint",
      langCount <= 1 ? "pass" : langCount <= 3 ? "warn" : "fail",
      langCount <= 1
        ? "Minimal language list reduces fingerprint surface"
        : `${langCount} languages exposed — increases browser uniqueness`,
      5
    )
  );

  return results;
}

function runWebRTCChecks(
  webrtc: WebRTCLeakResult | null
): PrivacyCheckResult[] {
  if (!webrtc || !webrtc.supported) return [];

  return [
    check(
      "webrtc",
      "WebRTC Leak",
      webrtc.leaking ? "fail" : "pass",
      webrtc.leaking
        ? `WebRTC exposes ${webrtc.localIPs.length + webrtc.publicIPs.length} IP(s) — VPN can be bypassed`
        : "No WebRTC IP leak detected",
      15
    ),
  ];
}

function runSecurityHeaderChecks(
  diag: BrowserDiagnostics
): PrivacyCheckResult[] {
  const headers = diag.security.responseHeaders;
  const results: PrivacyCheckResult[] = [];

  results.push(
    check(
      "csp",
      "Content Security Policy",
      headers.csp ? "pass" : "warn",
      headers.csp
        ? "CSP header is present — protects against XSS"
        : "No CSP header detected",
      8
    )
  );

  results.push(
    check(
      "x-frame",
      "Clickjacking Protection",
      headers.xFrameOptions ? "pass" : "warn",
      headers.xFrameOptions
        ? `X-Frame-Options: ${headers.xFrameOptions}`
        : "No X-Frame-Options — page could be embedded in iframes",
      5
    )
  );

  return results;
}

const COUNTRY_LANG_MAP: Record<string, string[]> = {
  us: ["en"],
  gb: ["en"],
  au: ["en"],
  ca: ["en", "fr"],
  fr: ["fr"],
  de: ["de"],
  es: ["es"],
  it: ["it"],
  pt: ["pt"],
  br: ["pt"],
  jp: ["ja"],
  kr: ["ko"],
  cn: ["zh"],
  tw: ["zh"],
  ru: ["ru"],
  nl: ["nl"],
  se: ["sv"],
  no: ["no", "nb", "nn"],
  dk: ["da"],
  fi: ["fi"],
  pl: ["pl"],
  cz: ["cs"],
  tr: ["tr"],
  th: ["th"],
  vn: ["vi"],
  id: ["id"],
  my: ["ms"],
  ph: ["tl", "en"],
  in: ["hi", "en"],
  sa: ["ar"],
  ae: ["ar"],
  eg: ["ar"],
  il: ["he"],
  ua: ["uk"],
  gr: ["el"],
  ro: ["ro"],
  hu: ["hu"],
  bg: ["bg"],
  hr: ["hr"],
  sk: ["sk"],
  si: ["sl"],
};

function detectConsistencyIssues(
  ip: IPInfo,
  diag: BrowserDiagnostics
): string[] {
  const issues: string[] = [];

  if (ip.location?.timezone && diag.timezone) {
    const serverTz = ip.location.timezone;
    const browserTz = diag.timezone;
    if (serverTz !== browserTz) {
      issues.push(
        `Timezone mismatch: IP location reports "${serverTz}" but your browser is set to "${browserTz}"`
      );
    }
  }

  if (ip.location?.country && diag.languages.length > 0) {
    const countryLower = ip.location.country.toLowerCase();
    const primaryLang = diag.languages[0].toLowerCase();
    const langPrefix = primaryLang.split("-")[0];
    const expectedLangs = COUNTRY_LANG_MAP[countryLower];
    if (expectedLangs && !expectedLangs.includes(langPrefix)) {
      issues.push(
        `Language mismatch: IP is in ${ip.location.country.toUpperCase()} but browser language is "${diag.languages[0]}"`
      );
    }
  }

  return issues;
}

export function computePrivacyScore(
  ip: IPInfo | null,
  diagnostics: BrowserDiagnostics | null,
  webrtc: WebRTCLeakResult | null
): PrivacyScore | null {
  if (!ip || !diagnostics) return null;

  const checks = [
    ...runIPChecks(ip),
    ...runBrowserChecks(diagnostics),
    ...runWebRTCChecks(webrtc),
    ...runSecurityHeaderChecks(diagnostics),
  ];

  const overall = scoreFromChecks(checks);
  const consistencyIssues = detectConsistencyIssues(ip, diagnostics);

  return {
    overall,
    grade: gradeFromScore(overall),
    checks,
    consistencyIssues,
  };
}
