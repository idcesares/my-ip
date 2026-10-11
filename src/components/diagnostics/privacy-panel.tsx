import { ShieldCheck } from "lucide-react";
import { useTheme } from "next-themes";
import { yesNo } from "@/components/diagnostics/format";
import { PanelHeading, Row } from "@/components/diagnostics/row";
import type { BrowserDiagnosticsSnapshot } from "@/types";

export function PrivacyPanel({
  data,
  showAdvanced,
}: {
  data: BrowserDiagnosticsSnapshot;
  showAdvanced: boolean;
}) {
  const { theme, resolvedTheme } = useTheme();
  const appTheme =
    !theme || theme === "system"
      ? `System${resolvedTheme ? ` (${resolvedTheme})` : ""}`
      : theme.charAt(0).toUpperCase() + theme.slice(1);
  const { preferences, capabilities } = data;

  return (
    <div className="bg-[hsl(var(--card))] p-4">
      <PanelHeading icon={ShieldCheck}>Privacy &amp; Security</PanelHeading>
      <div>
        <Row
          k="System scheme"
          v={preferences.colorScheme}
          tip="Your operating system or browser color-scheme preference (prefers-color-scheme). The page theme can differ when you choose a theme with the toggle."
        />
        <Row
          k="App theme"
          v={appTheme}
          tip="The theme this page is using. System follows the scheme above; Light or Dark means you chose one with the theme toggle."
        />
        <Row
          k="Cookies"
          v={preferences.cookieEnabled ? "Enabled" : "Disabled"}
          tip="Navigator.cookieEnabled is a browser setting hint; it does not guarantee that every cookie write will succeed."
        />
        <Row
          k="Secure Context"
          v={yesNo(capabilities.secureContext)}
          tip="True when page runs in a secure context (HTTPS or localhost)."
        />
        {showAdvanced ? (
          <>
            <Row
              k="Global Privacy Control"
              v={
                preferences.globalPrivacyControl === null
                  ? "Unsupported"
                  : preferences.globalPrivacyControl
                    ? "On"
                    : "Off"
              }
              tip="Whether the browser asks sites not to sell or share your data (navigator.globalPrivacyControl). Unsupported is different from Off; many browsers do not expose it."
            />
            <Row
              k="Local storage"
              v={capabilities.localStorageAvailable ? "Available" : "Blocked"}
              tip="Whether this page can write to localStorage, checked with a temporary key that is removed immediately. Recent-check history needs it; when blocked, history is kept in memory only."
            />
            <Row
              k="Reduced Motion"
              v={yesNo(preferences.reducedMotion)}
              tip="Accessibility preference to minimize animations."
            />
            <Row
              k="High Contrast"
              v={yesNo(preferences.highContrast)}
              tip="Accessibility preference for higher contrast rendering."
            />
            <Row
              k="Touch"
              v={yesNo(preferences.touchCapable)}
              tip="Whether the browser reports at least one simultaneous touch point. A desktop can correctly report Yes when it has a touchscreen."
            />
            <Row
              k="Touch Points"
              v={preferences.maxTouchPoints}
              tip="Maximum simultaneous touch contacts reported by the browser."
            />
            <Row
              k="Script-visible cookies"
              v={data.privacy.scriptVisibleCookieCount}
              tip="Cookies visible through document.cookie for this origin. HttpOnly cookies and partitioned contexts are not counted."
            />
            <Row
              k="Cross-Origin Isolated"
              v={yesNo(capabilities.crossOriginIsolated)}
              tip="Whether the page is cross-origin isolated. No is expected unless COOP and COEP are deliberately enabled; it is not a general security grade."
            />
          </>
        ) : null}
      </div>
    </div>
  );
}
