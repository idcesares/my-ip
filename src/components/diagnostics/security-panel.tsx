import { LockKeyhole } from "lucide-react";
import { headerValue } from "@/components/diagnostics/format";
import { PanelHeading, Row } from "@/components/diagnostics/row";
import { describePermission } from "@/lib/permissions";
import {
  summarizeCsp,
  summarizeHsts,
  summarizePermissionsPolicy,
  summarizeVerbatim,
} from "@/lib/security-headers";
import type { BrowserDiagnosticsSnapshot } from "@/types";

export function SecurityPanel({
  data,
  showAdvanced,
}: {
  data: BrowserDiagnosticsSnapshot;
  showAdvanced: boolean;
}) {
  const { security, privacy } = data;
  const { responseHeaders: headers, responseHeadersStatus: status } = security;
  // Until the probe has read the real policy there is nothing to attribute a
  // "denied" reading to, so the plain state is shown.
  const policy = status === "measured" ? headers.permissionsPolicy : null;

  return (
    <div className="bg-[hsl(var(--card))] p-4">
      <PanelHeading icon={LockKeyhole}>
        Security Headers &amp; Permissions
      </PanelHeading>
      <div>
        <Row
          k="Protocol"
          v={security.protocol.replace(":", "").toUpperCase()}
          tip="Current page protocol (http/https)."
        />
        <Row
          k="CSP Header"
          v={headerValue(status, headers.csp, summarizeCsp)}
          tip="Content-Security-Policy observed on this page response. Presence alone is not protection; the summary says whether script sources are restricted."
        />
        <Row
          k="Permissions-Policy"
          v={headerValue(
            status,
            headers.permissionsPolicy,
            summarizePermissionsPolicy,
          )}
          tip="Permissions-Policy observed on this page response, and the browser features it disables for this site."
        />
        <Row
          k="HSTS"
          v={headerValue(
            status,
            headers.strictTransportSecurity,
            summarizeHsts,
          )}
          tip="Strict-Transport-Security observed on this page response. Browsers only honor it over HTTPS, so it has no effect on a plain HTTP page."
        />
        <Row
          k="X-Frame-Options"
          v={headerValue(status, headers.xFrameOptions, summarizeVerbatim)}
          tip="X-Frame-Options observed on this page response."
        />
        {showAdvanced ? (
          <>
            <Row
              k="Referrer-Policy"
              v={headerValue(status, headers.referrerPolicy, summarizeVerbatim)}
              tip="Referrer-Policy observed on this page response; it controls how much of this page's address other sites receive."
            />
            <Row
              k="X-Content-Type-Options"
              v={headerValue(
                status,
                headers.xContentTypeOptions,
                summarizeVerbatim,
              )}
              tip="X-Content-Type-Options observed on this page response; nosniff stops browsers from guessing content types."
            />
            <Row
              k="Cache-Control"
              v={headerValue(status, headers.cacheControl, summarizeVerbatim)}
              tip="Cache-Control observed on this page response (the page shell, not the IP lookup)."
            />
            <Row
              k="Notifications"
              v={describePermission(
                "notifications",
                privacy.permissions.notifications,
                policy,
              )}
              tip="Effective permission state for this origin. It can reflect user choice and browser policy; this check does not request access."
            />
            <Row
              k="Geolocation"
              v={describePermission(
                "geolocation",
                privacy.permissions.geolocation,
                policy,
              )}
              tip="Effective permission state for this origin. This site's Permissions-Policy disables geolocation, so the answer describes the site, not your browser setting. No prompt is requested."
            />
            <Row
              k="Camera"
              v={describePermission(
                "camera",
                privacy.permissions.camera,
                policy,
              )}
              tip="Effective permission state for this origin. This site's Permissions-Policy disables the camera, so the answer describes the site, not your browser setting. No stream or prompt is requested."
            />
            <Row
              k="Microphone"
              v={describePermission(
                "microphone",
                privacy.permissions.microphone,
                policy,
              )}
              tip="Effective permission state for this origin. This site's Permissions-Policy disables the microphone, so the answer describes the site, not your browser setting. No stream or prompt is requested."
            />
          </>
        ) : null}
      </div>
    </div>
  );
}
