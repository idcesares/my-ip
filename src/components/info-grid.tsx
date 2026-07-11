"use client";

import { memo } from "react";
import { m } from "framer-motion";
import {
  CircleHelp,
  Globe2,
  LockKeyhole,
  MonitorCog,
  ShieldCheck,
} from "lucide-react";
import type {
  BrowserDiagnosticsSnapshot,
  HeaderMeasurementStatus,
} from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function headerValue(status: HeaderMeasurementStatus, value: string | null) {
  if (status === "checking") return "Checking…";
  if (status === "unavailable") return "Unavailable";
  return value ? "Present" : "Not observed";
}

function yesNo(value: boolean | null, unsupported = "Unsupported") {
  return value === null ? unsupported : value ? "Yes" : "No";
}

function permissionValue(value: string) {
  if (value === "unsupported") return "Unsupported";
  if (value === "error") return "Unavailable";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function Row({
  k,
  v,
  tip,
}: {
  k: string;
  v: string | number | null;
  tip?: string;
}) {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] items-start gap-3 py-1 text-sm">
      <span className="inline-flex min-w-0 items-center gap-0.5 text-[hsl(var(--muted-foreground))]">
        {k}
        {tip ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`${k} info`}
                className="-my-2 h-11 w-11 shrink-0 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
              >
                <CircleHelp className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="max-w-64 leading-relaxed">
              {tip}
            </TooltipContent>
          </Tooltip>
        ) : null}
      </span>
      <span className="min-w-0 break-words text-right font-semibold leading-snug">
        {v ?? "Unavailable"}
      </span>
    </div>
  );
}

export const InfoGrid = memo(function InfoGrid({
  data,
  showAdvanced,
  onToggleAdvanced,
}: {
  data: BrowserDiagnosticsSnapshot | null;
  showAdvanced: boolean;
  onToggleAdvanced: () => void;
}) {
  if (!data) {
    return (
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="h-44" />
        </Card>
        <Card>
          <CardContent className="h-44" />
        </Card>
        <Card>
          <CardContent className="h-44" />
        </Card>
        <Card>
          <CardContent className="h-44" />
        </Card>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-sm font-semibold tracking-wide text-[hsl(var(--muted-foreground))]">
          Browser &amp; network signals
        </h2>
        <Button
          type="button"
          variant={showAdvanced ? "secondary" : "outline"}
          size="sm"
          className="min-h-11 w-full sm:w-auto"
          onClick={onToggleAdvanced}
          aria-pressed={showAdvanced}
        >
          {showAdvanced ? "Show basic signals" : "Show advanced signals"}
        </Button>
      </div>
      <p className="mb-4 text-xs leading-relaxed text-[hsl(var(--muted-foreground))]">
        Browser API values are capability signals, not hardware guarantees.
        Network API values marked as estimates are rounded browser observations;
        page fetch duration is an active same-origin measurement.
      </p>
      <m.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.08 }}
        className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe2 className="h-4 w-4 text-sky-500" />
              Network Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Row
              k="Online hint"
              v={yesNo(data.online)}
              tip="Navigator.onLine is a browser hint about network availability; it does not prove that the internet or this site is reachable."
            />
            <Row
              k="Effective Type"
              v={
                data.connection.effectiveType
                  ? `${data.connection.effectiveType} (estimate)`
                  : "Unsupported"
              }
              tip="A coarse browser estimate such as 4g or 3g. It is an effective quality class, not the device's radio technology."
            />
            <Row
              k="Downlink"
              v={
                data.connection.downlink
                  ? `${data.connection.downlink} Mbps (estimate)`
                  : "Unsupported"
              }
              tip="A rounded browser estimate based on recently observed application-layer throughput, not a speed test."
            />
            <Row
              k="RTT"
              v={
                data.connection.rtt
                  ? `${data.connection.rtt} ms (estimate)`
                  : "Unsupported"
              }
              tip="A rounded browser estimate from recently observed application-layer requests. It is not ICMP ping latency."
            />
            {showAdvanced ? (
              <>
                <Row
                  k="Type"
                  v={data.connection.type ?? "Unsupported"}
                  tip="The connection transport reported by supporting browsers. Many browsers intentionally do not expose it."
                />
                <Row
                  k="Downlink Max"
                  v={
                    data.connection.downlinkMax
                      ? `${data.connection.downlinkMax} Mbps`
                      : "Unsupported"
                  }
                  tip="Maximum potential downlink reported by the user agent on supported browsers."
                />
                <Row
                  k="Page fetch"
                  v={
                    data.connection.pageFetchMs !== null
                      ? `${data.connection.pageFetchMs} ms`
                      : "Unavailable"
                  }
                  tip="Total duration of a no-store HEAD request to this page. It includes browser scheduling, cache checks, server work, transfer, and network latency; it is not pure RTT."
                />
                <Row
                  k="Data Saver"
                  v={yesNo(data.connection.saveData)}
                  tip="The Save-Data preference reported by supporting browsers. Unsupported is different from No."
                />
                <Row
                  k="Last Change"
                  v={
                    data.connection.changedAt
                      ? new Date(data.connection.changedAt).toLocaleTimeString()
                      : "No change observed"
                  }
                  tip="Last time network indicators changed during this page session."
                />
              </>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MonitorCog className="h-4 w-4 text-cyan-500" />
              Browser Details
            </CardTitle>
          </CardHeader>
          <CardContent>
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
                <Row
                  k="Color Depth"
                  v={data.colorDepth}
                  tip="Number of bits used for color display."
                />
                <Row
                  k="Pixel Ratio"
                  v={data.pixelRatio}
                  tip="Ratio between physical and CSS pixels (useful on high-DPI displays)."
                />
                <Row
                  k="Logical processors"
                  v={
                    data.capabilities.hardwareConcurrencyBucket ?? "Unsupported"
                  }
                  tip="A locally bucketed navigator.hardwareConcurrency hint. Browsers may report fewer logical processors than the device actually has."
                />
                <Row
                  k="Device memory hint"
                  v={
                    data.capabilities.deviceMemoryGB !== null
                      ? `${data.capabilities.deviceMemoryGB} GB (coarse)`
                      : "Unsupported"
                  }
                  tip="The coarse, privacy-reduced deviceMemory value reported by supporting browsers. It is not a hardware inventory."
                />
                <Row
                  k="PDF Viewer"
                  v={yesNo(data.capabilities.pdfViewerEnabled)}
                  tip="Whether the browser reports an inline PDF viewer capability."
                />
              </>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              Privacy & Security
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Row
              k="Color Scheme"
              v={data.preferences.colorScheme}
              tip="Active theme preference from media query."
            />
            <Row
              k="Cookies"
              v={data.preferences.cookieEnabled ? "Enabled" : "Disabled"}
              tip="Navigator.cookieEnabled is a browser setting hint; it does not guarantee that every cookie write will succeed."
            />
            <Row
              k="Secure Context"
              v={yesNo(data.capabilities.secureContext)}
              tip="True when page runs in a secure context (HTTPS or localhost)."
            />
            {showAdvanced ? (
              <>
                <Row
                  k="Reduced Motion"
                  v={yesNo(data.preferences.reducedMotion)}
                  tip="Accessibility preference to minimize animations."
                />
                <Row
                  k="High Contrast"
                  v={yesNo(data.preferences.highContrast)}
                  tip="Accessibility preference for higher contrast rendering."
                />
                <Row
                  k="Touch"
                  v={yesNo(data.preferences.touchCapable)}
                  tip="Whether the browser reports at least one simultaneous touch point. A desktop can correctly report Yes when it has a touchscreen."
                />
                <Row
                  k="Touch Points"
                  v={data.preferences.maxTouchPoints}
                  tip="Maximum simultaneous touch contacts reported by the browser."
                />
                <Row
                  k="Script-visible cookies"
                  v={data.privacy.scriptVisibleCookieCount}
                  tip="Cookies visible through document.cookie for this origin. HttpOnly cookies and partitioned contexts are not counted."
                />
                <Row
                  k="Cross-Origin Isolated"
                  v={yesNo(data.capabilities.crossOriginIsolated)}
                  tip="Whether the page is cross-origin isolated. No is expected unless COOP and COEP are deliberately enabled; it is not a general security grade."
                />
              </>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LockKeyhole className="h-4 w-4 text-slate-500" />
              Security Headers & Permissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Row
              k="Protocol"
              v={data.security.protocol.replace(":", "").toUpperCase()}
              tip="Current page protocol (http/https)."
            />
            <Row
              k="CSP Header"
              v={headerValue(
                data.security.responseHeadersStatus,
                data.security.responseHeaders.csp,
              )}
              tip="Content-Security-Policy observed on this page response."
            />
            <Row
              k="Permissions-Policy"
              v={headerValue(
                data.security.responseHeadersStatus,
                data.security.responseHeaders.permissionsPolicy,
              )}
              tip="Permissions-Policy observed on this page response."
            />
            <Row
              k="X-Frame-Options"
              v={headerValue(
                data.security.responseHeadersStatus,
                data.security.responseHeaders.xFrameOptions,
              )}
              tip="X-Frame-Options observed on this page response."
            />
            {showAdvanced ? (
              <>
                <Row
                  k="Notifications"
                  v={permissionValue(data.privacy.permissions.notifications)}
                  tip="Effective permission state for this origin. It can reflect user choice, browser policy, and site Permissions-Policy; this check does not request access."
                />
                <Row
                  k="Geolocation"
                  v={permissionValue(data.privacy.permissions.geolocation)}
                  tip="Effective permission state for this origin. The site policy disables browser geolocation, so Denied can be expected without describing your global browser setting."
                />
                <Row
                  k="Camera"
                  v={permissionValue(data.privacy.permissions.camera)}
                  tip="Effective permission state for this origin. The site policy disables camera access; no stream or prompt is requested."
                />
                <Row
                  k="Microphone"
                  v={permissionValue(data.privacy.permissions.microphone)}
                  tip="Effective permission state for this origin. The site policy disables microphone access; no stream or prompt is requested."
                />
              </>
            ) : null}
          </CardContent>
        </Card>
      </m.div>
    </TooltipProvider>
  );
});
