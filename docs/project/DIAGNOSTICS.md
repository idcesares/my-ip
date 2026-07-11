# Diagnostics Methodology

The diagnostics page separates facts observed by the server from hints reported by the browser. Unsupported or unavailable signals are shown honestly rather than inferred.

## Connection address

The primary address is the one used for the current HTTP request. On Vercel, request and optional location metadata come from the platform. VPNs, Tor, proxies, carrier-grade NAT, relays, and dual-stack routing can change what the site observes.

## Browser and network signals

- `navigator.onLine` is a browser connectivity hint, not proof of internet reachability.
- Effective connection type, downlink, and RTT come from the Network Information API. They are rounded browser estimates and are not a speed test or ICMP ping.
- Page fetch is the elapsed time for a same-origin `HEAD` request. It includes request scheduling, network transit, Vercel and application processing, and response handling.
- Logical processor and device-memory values are coarse browser-exposed capability hints.
- Script-visible cookie count excludes `HttpOnly` cookies by design.

## Privacy, security, and permissions

- Response-header checks inspect the application's own response.
- Permission values are the browser's effective state for this origin. `prompt` means a future feature request may ask; the diagnostics page does not trigger a prompt.
- A negative or unavailable capability is not automatically a security problem. Findings use descriptive severities rather than a synthetic numeric score.

## WebRTC address exposure

The WebRTC test is opt-in. It creates a short-lived peer connection and contacts the configured public Google STUN servers to gather ICE candidates. Results are compared with the current HTTP address:

- the same public address is expected exposure;
- an additional public address is highlighted for review;
- a literal private address is highlighted separately;
- an mDNS `.local` candidate indicates browser masking;
- no observed candidates is not a guarantee that no address can be exposed.

The test deduplicates candidates, keeps partial results on timeout, and closes its peer connection after each run.

## Test coverage

Pure normalization and assessment logic has deterministic unit coverage. Component tests verify visible labels and status presentation. Route integration tests exercise API formats and failure paths. The production smoke test starts the built server and verifies page delivery, API behavior, cache controls, method handling, security headers, and the no-analytics contract.
