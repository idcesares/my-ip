"use client";

import { domAnimation, LazyMotion, m } from "framer-motion";
import { CircleHelp, Globe2, LockKeyhole, MonitorCog, ShieldCheck } from "lucide-react";
import type { BrowserDiagnostics } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

function Row({
  k,
  v,
  tip,
}: {
  k: string;
  v: string | number | boolean | null;
  tip?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 text-sm">
      <span className="inline-flex items-center gap-1.5 text-[hsl(var(--muted-foreground))]">
        {k}
        {tip ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={`${k} info`}
                className="rounded-sm text-[hsl(var(--muted-foreground))] transition hover:text-[hsl(var(--foreground))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
              >
                <CircleHelp className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-64 leading-relaxed">{tip}</TooltipContent>
          </Tooltip>
        ) : null}
      </span>
      <span className="text-right font-semibold">{String(v ?? "N/A")}</span>
    </div>
  );
}

export function InfoGrid({
  data,
  showAdvanced,
  onToggleAdvanced,
}: {
  data: BrowserDiagnostics | null;
  showAdvanced: boolean;
  onToggleAdvanced: () => void;
}) {
  if (!data) {
    return (
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <Card><CardContent className="h-44" /></Card>
        <Card><CardContent className="h-44" /></Card>
        <Card><CardContent className="h-44" /></Card>
        <Card><CardContent className="h-44" /></Card>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-wide text-[hsl(var(--muted-foreground))]">Diagnostics View</h2>
        <Button
          type="button"
          variant={showAdvanced ? "secondary" : "outline"}
          size="sm"
          onClick={onToggleAdvanced}
        >
          {showAdvanced ? "Basic Metrics" : "Advanced Metrics"}
        </Button>
      </div>
      <LazyMotion features={domAnimation}>
      <m.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.08 }}
        className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4"
      >
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Globe2 className="h-4 w-4 text-sky-500" />Network Information</CardTitle></CardHeader>
        <CardContent>
          <Row k="Online" v={data.online} tip="Whether the browser currently reports internet connectivity." />
          <Row k="Effective Type" v={data.connection.effectiveType} tip="Browser-estimated quality class (like 4g/3g), not guaranteed real throughput." />
          <Row k="Downlink" v={data.connection.downlink ? `${data.connection.downlink} Mbps` : null} tip="Estimated effective download speed as reported by Network Information API." />
          <Row k="RTT" v={data.connection.rtt ? `${data.connection.rtt} ms` : null} tip="Estimated round-trip latency from browser network heuristics." />
          {showAdvanced ? (
            <>
              <Row k="Type" v={data.connection.type} tip="Underlying connection transport when exposed by the browser (wifi/cellular/ethernet)." />
              <Row k="Downlink Max" v={data.connection.downlinkMax ? `${data.connection.downlinkMax} Mbps` : null} tip="Maximum potential downlink reported by the user agent on supported browsers." />
              <Row k="API RTT" v={data.connection.apiRttMs ? `${data.connection.apiRttMs} ms` : null} tip="Measured client-to-this-app latency using same-origin /api/ip request." />
              <Row k="Data Saver" v={data.connection.saveData} tip="User preference indicating reduced data usage mode." />
              <Row k="Last Change" v={data.connection.changedAt ? new Date(data.connection.changedAt).toLocaleTimeString() : null} tip="Last time network indicators changed during this page session." />
            </>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><MonitorCog className="h-4 w-4 text-cyan-500" />Browser Details</CardTitle></CardHeader>
        <CardContent>
          <Row k="Language" v={data.languages[0]} tip="Top preferred browser locale." />
          <Row k="Timezone" v={data.timezone} tip="Local timezone from Intl settings." />
          <Row k="Viewport" v={data.viewport} tip="Current browser content area size." />
          <Row k="Screen" v={data.screenResolution} tip="Physical screen resolution reported by the browser." />
          {showAdvanced ? (
            <>
              <Row k="Color Depth" v={data.colorDepth} tip="Number of bits used for color display." />
              <Row k="Pixel Ratio" v={data.pixelRatio} tip="Ratio between physical and CSS pixels (useful on high-DPI displays)." />
              <Row k="CPU Threads" v={data.capabilities.hardwareConcurrencyBucket} tip="Coarse bucket of logical CPU threads to reduce fingerprinting." />
              <Row k="Device Memory" v={data.capabilities.deviceMemoryBucket} tip="Coarse bucket of approximate device RAM (if exposed)." />
              <Row k="PDF Viewer" v={data.capabilities.pdfViewerEnabled} tip="Whether built-in PDF viewing support is available." />
            </>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-500" />Privacy & Security</CardTitle></CardHeader>
        <CardContent>
          <Row k="Color Scheme" v={data.preferences.colorScheme} tip="Active theme preference from media query." />
          <Row k="Cookies" v={data.preferences.cookieEnabled} tip="Whether cookies are currently enabled in browser settings." />
          <Row k="DNT" v={data.preferences.doNotTrack} tip="Do Not Track browser preference flag value." />
          <Row k="Secure Context" v={data.capabilities.secureContext} tip="True when page runs in a secure context (HTTPS or localhost)." />
          {showAdvanced ? (
            <>
              <Row k="Reduced Motion" v={data.preferences.reducedMotion} tip="Accessibility preference to minimize animations." />
              <Row k="High Contrast" v={data.preferences.highContrast} tip="Accessibility preference for higher contrast rendering." />
              <Row k="Touch" v={data.preferences.touchCapable} tip="Whether touch input appears available." />
              <Row k="Touch Points" v={data.preferences.maxTouchPoints} tip="Maximum simultaneous touch contacts reported by the browser." />
              <Row k="Cookie Count" v={data.privacy.firstPartyCookieCount} tip="Number of first-party cookies visible to this app origin." />
              <Row k="Cross-Origin Isolated" v={data.capabilities.crossOriginIsolated} tip="Indicates advanced isolation headers are active for stronger browser security boundaries." />
            </>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><LockKeyhole className="h-4 w-4 text-slate-500" />Security Headers & Permissions</CardTitle></CardHeader>
        <CardContent>
          <Row k="Protocol" v={data.security.protocol} tip="Current page protocol (http/https)." />
          <Row k="CSP Header" v={data.security.responseHeaders.csp ? "Present" : "Missing"} tip="Content-Security-Policy helps block script/style injection vectors." />
          <Row k="Permissions-Policy" v={data.security.responseHeaders.permissionsPolicy ? "Present" : "Missing"} tip="Limits browser features available to this origin and embeds." />
          <Row k="X-Frame-Options" v={data.security.responseHeaders.xFrameOptions ? "Present" : "Missing"} tip="Mitigates clickjacking by controlling page framing." />
          {showAdvanced ? (
            <>
              <Row k="Notifications" v={data.privacy.permissions.notifications} tip="Permission state only; app does not request access here." />
              <Row k="Geolocation" v={data.privacy.permissions.geolocation} tip="Permission state only; no location request is triggered." />
              <Row k="Camera" v={data.privacy.permissions.camera} tip="Permission state only; no camera stream is requested." />
              <Row k="Microphone" v={data.privacy.permissions.microphone} tip="Permission state only; no microphone stream is requested." />
            </>
          ) : null}
        </CardContent>
      </Card>
      </m.div>
      </LazyMotion>
    </TooltipProvider>
  );
}
