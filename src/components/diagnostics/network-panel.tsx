import { Globe2 } from "lucide-react";
import { estimate, yesNo } from "@/components/diagnostics/format";
import { PanelHeading, Row } from "@/components/diagnostics/row";
import type { BrowserDiagnosticsSnapshot } from "@/types";

function pageFetchValue(data: BrowserDiagnosticsSnapshot): string {
  const { pageFetchMs, pageFetchMinMs, pageFetchSamples } = data.connection;
  if (pageFetchMs === null) {
    return data.security.responseHeadersStatus === "checking"
      ? "Checking…"
      : "Unavailable";
  }
  const min = pageFetchMinMs === null ? "" : ` · min ${pageFetchMinMs} ms`;
  return `${pageFetchMs} ms median${min} · ${pageFetchSamples} samples`;
}

export function NetworkPanel({
  data,
  showAdvanced,
}: {
  data: BrowserDiagnosticsSnapshot;
  showAdvanced: boolean;
}) {
  const { connection } = data;
  const apiSupported =
    connection.effectiveType !== null ||
    connection.downlink !== null ||
    connection.rtt !== null;

  return (
    <div className="bg-[hsl(var(--card))] p-4">
      <PanelHeading icon={Globe2}>Network</PanelHeading>
      <div>
        <Row
          k="Online hint"
          v={yesNo(data.online)}
          tip="Navigator.onLine is a browser hint about network availability; it does not prove that the internet or this site is reachable."
        />
        <Row
          k="Effective Type"
          v={
            connection.effectiveType
              ? `${connection.effectiveType} (estimate)`
              : "Unsupported"
          }
          tip="A coarse browser estimate such as 4g or 3g. It is an effective quality class, not the device's radio technology."
        />
        <Row
          k="Downlink"
          v={estimate(connection.downlink, "Mbps", apiSupported)}
          tip="A rounded browser estimate based on recently observed application-layer throughput, not a speed test. 0 means the browser has no usable estimate."
        />
        <Row
          k="RTT"
          v={estimate(connection.rtt, "ms", apiSupported)}
          tip="A rounded browser estimate from recently observed application-layer requests. It is not ICMP ping latency. 0 means the browser has no usable estimate."
        />
        {showAdvanced ? (
          <>
            <Row
              k="Type"
              v={connection.type ?? "Unsupported"}
              tip="The connection transport reported by supporting browsers. Many browsers intentionally do not expose it."
            />
            <Row
              k="Downlink Max"
              v={
                connection.downlinkMax !== null
                  ? `${connection.downlinkMax} Mbps`
                  : apiSupported
                    ? "Not reported"
                    : "Unsupported"
              }
              tip="Maximum potential downlink reported by the user agent on supported browsers. Browsers report an unbounded value when the link type is unknown; that is shown as not reported."
            />
            <Row
              k="Page fetch"
              v={pageFetchValue(data)}
              tip="Median of several no-store HEAD requests to this page. Each includes browser scheduling, cache checks, server work, transfer, and network latency; it is not pure RTT. The minimum is the least noisy sample."
            />
            <Row
              k="Data Saver"
              v={yesNo(connection.saveData)}
              tip="The Save-Data preference reported by supporting browsers. Unsupported is different from No."
            />
            <Row
              k="Last Change"
              v={
                connection.changedAt
                  ? new Date(connection.changedAt).toLocaleTimeString()
                  : "No change observed"
              }
              tip="Last time network indicators changed during this page session."
            />
          </>
        ) : null}
      </div>
    </div>
  );
}
