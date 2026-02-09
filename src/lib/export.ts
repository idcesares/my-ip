import type { BrowserDiagnostics, IPInfo } from "@/types";

export function buildTextReport(ip: IPInfo, browser: BrowserDiagnostics | null): string {
  const lines = [
    `Your IP Address: ${ip.ip} (${ip.ipVersion})`,
    `IPv4: ${ip.ipv4 ?? "N/A"}`,
    `IPv6: ${ip.ipv6 ?? "N/A"}`,
    `Category: ${ip.category}`,
    `Detection Source: ${ip.source}`,
    `Detection Confidence: ${ip.confidence}`,
    `Relay Likely: ${ip.relayLikely}`,
    `Timestamp: ${ip.timestamp}`,
  ];

  if (ip.location) {
    lines.push(`Location: ${ip.location.city ?? "Unknown"}, ${ip.location.region ?? "Unknown"}, ${ip.location.country ?? "Unknown"}`);
  }

  if (browser) {
    lines.push(`Timezone: ${browser.timezone}`);
    lines.push(`Viewport: ${browser.viewport}`);
    lines.push(`Connection: ${browser.connection.effectiveType ?? "N/A"}`);
  }

  return lines.join("\n");
}

export function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function timestampName() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}
