# Diagnostics Methodology

The diagnostics page separates facts observed by the server from hints reported by the browser. Unsupported or unavailable signals are shown honestly rather than inferred.

## Connection address

The primary address is the one used for the current HTTP request. On Vercel, request and optional location metadata come from the platform. VPNs, Tor, proxies, carrier-grade NAT, relays, and dual-stack routing can change what the site observes.

## Browser and network signals

- `navigator.onLine` is a browser connectivity hint, not proof of internet reachability.
- Effective connection type, downlink, and RTT come from the Network Information API. They are rounded browser estimates and are not a speed test or ICMP ping. A value of `0` is shown as `0`: browsers report it when they have no usable estimate, and that is different from the API being missing. A non-finite value (for example an unbounded `downlinkMax`) is shown as "Not reported", and "Unsupported" is reserved for browsers that do not expose the API at all.
- Page fetch is the **median** of five sequential same-origin `HEAD` requests, shown with the minimum and the sample count. One request is a noisy sample because it can include connection setup. It includes request scheduling, network transit, Vercel and application processing, and response handling.
- Page fetch and the header checks run on load and whenever the user presses Re-measure or Refresh. The panel shows when they last ran; they are not refreshed in the background.
- Logical processor count is shown exactly as `navigator.hardwareConcurrency` reports it (browsers may cap it). Device memory is the value the browser already rounds. Both are displayed locally only.
- The advanced view also shows the user agent, the full language list, User-Agent Client Hints (platform, mobile flag, brands), Global Privacy Control (On, Off, or Unsupported), and whether localStorage is writable.
- "System scheme" is the operating-system or browser color-scheme preference; "App theme" is the theme this page is using, which differs when the visitor picked one with the theme toggle.
- Script-visible cookie count excludes `HttpOnly` cookies by design.

## Privacy, security, and permissions

- Response-header checks inspect the application's own response and describe what each header allows rather than only whether it exists. A Content-Security-Policy that permits inline scripts, eval, or scripts from any origin is shown as such and is not counted as a positive finding. HSTS shows its `max-age` and flags; a zero or missing `max-age` is reported as ineffective. Permissions-Policy lists the features it disables.
- Permission values are the browser's effective state for this origin. `prompt` means a future feature request may ask; the diagnostics page does not trigger a prompt.
- This site's own Permissions-Policy disables geolocation, camera, and microphone, so the browser answers "denied" for them regardless of the visitor's settings. Those rows read "Blocked by this site's policy" once the real policy has been measured; before that, the plain state is shown. Notifications are not gated by a Permissions-Policy feature and are reported as the browser states them.
- A negative or unavailable capability is not automatically a security problem. Findings use descriptive severities rather than a synthetic numeric score.

## WebRTC address exposure

The WebRTC test is opt-in. It creates a short-lived peer connection and contacts the configured public Google STUN servers to gather ICE candidates. Results are compared with the current HTTP address:

- the same public address is expected exposure;
- an additional public address is highlighted for review;
- a literal private address is highlighted separately;
- an mDNS `.local` candidate indicates browser masking;
- a public IPv6 candidate on an IPv4-only host (the production deployment) cannot be compared with the request address, because the HTTP request could never have used IPv6; it is listed as informational and is not counted as additional exposure. If a VPN should hide your IPv6 address, compare it with the address your VPN reports;
- no observed candidates is not a guarantee that no address can be exposed.

The test deduplicates candidates, keeps partial results on timeout, and closes its peer connection after each run.

## Test coverage

Pure normalization and assessment logic has deterministic unit coverage. Component tests verify visible labels and status presentation. Route integration tests exercise API formats and failure paths. The production smoke test starts the built server and verifies page delivery, API behavior, cache controls, method handling, security headers, and the no-analytics contract.
