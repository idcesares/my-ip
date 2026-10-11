import { MonitorCog } from "lucide-react";
import { yesNo } from "@/components/diagnostics/format";
import { PanelHeading, Row } from "@/components/diagnostics/row";
import type { BrowserDiagnosticsSnapshot } from "@/types";

function clientHints(
  hints: BrowserDiagnosticsSnapshot["capabilities"]["userAgentData"],
): string {
  if (!hints) return "Unsupported";
  const device =
    hints.mobile === null ? null : hints.mobile ? "mobile" : "desktop";
  return (
    [hints.platform, device, hints.brands.join(", ")]
      .filter(Boolean)
      .join(" · ") || "Not reported"
  );
}

export function BrowserPanel({
  data,
  showAdvanced,
}: {
  data: BrowserDiagnosticsSnapshot;
  showAdvanced: boolean;
}) {
  const { capabilities } = data;

  return (
    <div className="bg-[hsl(var(--card))] p-4">
      <PanelHeading icon={MonitorCog}>Browser</PanelHeading>
      <div>
        <Row
          k="Language"
          v={data.languages[0]}
          tip="The first locale in navigator.languages, which reflects browser preference rather than physical location."
        />
        <Row
          k="Timezone"
          v={data.timezone}
          tip="The IANA timezone reported by Intl settings. It can be changed or privacy-reduced and does not prove location."
        />
        <Row
          k="Viewport"
          v={data.viewport}
          tip="Current layout viewport in CSS pixels. It changes with window size, zoom, and mobile browser UI."
        />
        <Row
          k="Screen"
          v={data.screenResolution}
          tip="Screen dimensions reported in CSS pixels. Browsers may reduce or alter this value for privacy."
        />
        {showAdvanced ? (
          <>
            {data.languages.length > 1 ? (
              <Row
                k="All languages"
                v={data.languages.join(", ")}
                tip="The full navigator.languages preference list, in order."
              />
            ) : null}
            <Row
              k="User agent"
              v={data.userAgent}
              tip="The User-Agent string this browser sends. Browsers increasingly freeze or reduce it, so it can be a poor guide to the real browser or OS."
            />
            <Row
              k="Client hints"
              v={clientHints(capabilities.userAgentData)}
              tip="Low-entropy User-Agent Client Hints (platform, mobile flag, brands) from navigator.userAgentData. Supported mainly by Chromium browsers."
            />
            <Row
              k="Available screen"
              v={data.availableScreen}
              tip="Screen area not taken by OS toolbars, in CSS pixels."
            />
            <Row
              k="Color Depth"
              v={data.colorDepth}
              tip="Number of bits used for color display."
            />
            <Row
              k="Pixel Ratio"
              v={data.pixelRatio}
              tip="Ratio between physical and CSS pixels (useful on high-DPI displays). It also changes with browser zoom."
            />
            <Row
              k="Logical processors"
              v={
                capabilities.hardwareConcurrency !== null
                  ? `${capabilities.hardwareConcurrency} (browser-reported)`
                  : "Unsupported"
              }
              tip="The exact navigator.hardwareConcurrency value this browser reports to every site. It is shown only on this page and is not sent anywhere. Browsers may cap it below the device's real count."
            />
            <Row
              k="Device memory hint"
              v={
                capabilities.deviceMemoryGB !== null
                  ? `${capabilities.deviceMemoryGB} GB (browser-rounded)`
                  : "Unsupported"
              }
              tip="The privacy-reduced deviceMemory value reported by supporting browsers. The browser rounds it, so it is not a hardware inventory."
            />
            <Row
              k="PDF Viewer"
              v={yesNo(capabilities.pdfViewerEnabled)}
              tip="Whether the browser reports an inline PDF viewer capability."
            />
          </>
        ) : null}
      </div>
    </div>
  );
}
