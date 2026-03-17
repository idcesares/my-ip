# Competitor Analysis — IP Diagnostics Tools

Research conducted March 2026. Covers the top 10 IP lookup / privacy diagnostics websites.

---

## Feature Comparison Matrix

| Feature | whatismyipaddress.com | ipinfo.io | ipleak.net | whoer.net | browserleaks.com | whatismyip.com | ip-api.com | ifconfig.me/co | ipchicken.com | myip.com |
|---|---|---|---|---|---|---|---|---|---|---|
| **IPv4 Display** | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| **IPv6 Display** | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | No | Yes |
| **Dual-Stack** | Yes | Limited | Yes | Yes | Yes | Yes | No | Partial | No | Partial |
| **Geolocation** | Yes | Paid only | Yes | Yes | Yes | Yes | Yes | Yes | Basic | Basic |
| **ISP/ASN** | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Basic | Yes |
| **DNS Leak Test** | No | No | Yes | Yes | Yes | No | No | No | No | No |
| **WebRTC Leak Test** | No | No | Yes | Yes | Yes | No | No | No | No | No |
| **Speed Test** | Yes | No | No | Yes | No | No | No | No | No | No |
| **Port Scanning** | No | No | No | No | No | Yes | No | No | No | No |
| **VPN/Proxy/Tor Detection** | Yes | Yes (paid) | Partial | Yes | Partial | Yes | No | No | No | No |
| **Browser Fingerprinting** | No | No | No | Basic | Deep | No | No | No | No | No |
| **Anonymity Score** | No | No | No | Yes | No | No | No | No | No | No |
| **API Available** | No | Yes | No | No | No | No | Yes | Yes | No | Yes |
| **CLI-Friendly** | No | Yes | No | No | No | No | Yes | Yes | No | No |
| **Blacklist Check** | Yes | No | No | No | No | Yes | No | No | No | No |
| **WHOIS Lookup** | No | No | No | No | No | Yes | No | No | No | No |
| **Traceroute** | No | No | No | No | No | Yes | No | No | No | No |
| **Privacy-First** | Moderate | Yes | Yes | Moderate | Yes | Moderate | Yes | Yes | Yes | Moderate |
| **UI/UX Quality** | Good (dated) | Excellent | Functional | Good | Good (technical) | Good | Minimal | Minimal | Retro | Basic |

---

## Competitor Profiles

### whatismyipaddress.com
The well-known generalist. Shows IPv4/IPv6, geolocation, ISP, proxy detection, blacklist check, speed test, and email tracing. Has community forums. UI is functional but ad-heavy. No API. No leak testing.

### ipinfo.io
The developer/enterprise leader. Processed 1.4 trillion API requests in 2025. Offers tiered API (Lite free with country-only geo, Core and Plus paid tiers). Excellent data quality with proprietary algorithms. Best-in-class for programmatic access but not a consumer privacy tool.

### ipleak.net
The VPN user's go-to. Auto-runs IP detection, DNS leak test, and WebRTC leak test on page load. Also detects torrent client IP leakage. Simple, no-frills interface. No API. Excellent for quick privacy audits.

### whoer.net
The most comprehensive privacy auditor. Unique anonymity scoring system (0-100%). Checks IP, DNS leaks, WebRTC leaks, browser fingerprint, VPN/proxy/Tor detection, and includes a speed test. Detects inconsistencies between IP location and browser settings. Has become commercialized with VPN upsells.

### browserleaks.com
The deepest fingerprinting toolkit. Tests for: Canvas fingerprinting, WebGL fingerprinting, font fingerprinting, JavaScript capabilities, TLS/SSL analysis (JA3/JA4), WebRTC leaks, DNS leaks, HTTP/2 fingerprinting, QUIC/HTTP3 fingerprinting, and TCP/IP OS fingerprinting. Does not collect personal data or store fingerprints.

### whatismyip.com
The broadest toolbox. Operating since 1999. Offers IP lookup, WHOIS, hostname lookup, server headers check, blacklist check, traceroute, user agent info, DNS lookup, port scanner, and SSL certificate checker.

### ip-api.com
Free API for non-commercial use. JSON/XML/CSV endpoints, no API key needed, 45 req/min rate limit. Anycast network with sub-50ms response times globally. No web UI features beyond the API.

### ifconfig.me / ifconfig.co
The developer's CLI companion. Designed for `curl` usage. ifconfig.co supports endpoints like `/country`, `/city`, `/asn`, `/json`. Rate limited to 1 req/min for automation. Minimal web UI.

### ipchicken.com
The nostalgic minimalist. 24+ years old. Shows your IP and basic ISP info. Nothing else.

### myip.com
Basic IP checker with a JSON API (no request limits beyond server capacity). Minimal feature set on the web UI. The API is its differentiator.

---

## Feature Gap Analysis for my-ip

### Tier 1 — High-Value, Privacy-Aligned

1. **WebRTC Leak Detection** (ipleak.net, whoer.net, browserleaks.com)
   Reveals whether the browser leaks the real IP via WebRTC STUN requests, even behind a VPN. The single most requested privacy test. Can be implemented entirely client-side.

2. **DNS Leak Detection** (ipleak.net, whoer.net, browserleaks.com)
   Tests whether DNS queries bypass the VPN tunnel. Critical for VPN users. Requires a server-side component (custom DNS resolver or integration with a test service).

3. **IPv6 Leak / Dual-Stack Detection** (ipleak.net, browserleaks.com)
   Shows both IPv4 and IPv6 addresses simultaneously. Flags when IPv6 leaks the real address while IPv4 is tunneled. Directly relevant to IP diagnostics.

4. **Anonymity/Privacy Score** (whoer.net)
   A single numerical score summarizing privacy posture. Checks for inconsistencies between IP geolocation and browser settings (timezone, language, system locale). Highly engaging for users. Can be implemented client-side.

### Tier 2 — Valuable Differentiators

5. **TLS/SSL Fingerprint Display** (browserleaks.com)
   Shows the JA3/JA4 TLS fingerprint of the user's browser. Increasingly relevant as TLS fingerprinting is used for bot detection and tracking.

6. **VPN/Proxy/Tor Detection Indicators** (whoer.net, ipinfo.io, whatismyipaddress.com)
   Flag whether the detected IP belongs to a known VPN, proxy, or Tor exit node. Requires a detection database or third-party API.

7. **CLI/API Plain-Text Access** (ifconfig.me, ip-api.com, ipinfo.io, myip.com)
   Support for `curl` / plain-text responses. The existing `/api/ip` endpoint partially covers this. Adding content negotiation (`Accept: text/plain` returning just the IP) would match ifconfig.me's simplicity.

8. **Connection Consistency Checks** (whoer.net)
   Detect mismatches between the IP's geolocation and browser-reported timezone, language, and locale. Entirely client-side and privacy-safe.

### Tier 3 — Nice-to-Have

9. **Speed Test** (whoer.net, whatismyipaddress.com) — Common but tangential to IP diagnostics.

10. **Canvas/WebGL Fingerprint Awareness** (browserleaks.com) — Educational display of the user's own fingerprint hash. Note: the project prohibits fingerprinting, but displaying (without storing) could be considered for educational purposes.

11. **Port Scanning** (whatismyip.com) — Useful for security auditing but raises ethical/legal considerations.

12. **Blacklist/Reputation Check** (whatismyip.com, whatismyipaddress.com) — Useful for email administrators and business users.

---

## Key Takeaways

- **The biggest feature gaps vs. top competitors are: WebRTC leak detection, DNS leak detection, and dual-stack IPv4/IPv6 display.** These are present in the top privacy-focused competitors (ipleak.net, whoer.net, browserleaks.com) and absent from the current implementation.

- **whoer.net's anonymity score is the most unique and engaging feature** across all competitors. A simplified version (checking IP geo vs. browser timezone/language consistency) could be implemented entirely client-side, fitting the privacy-first model.

- **browserleaks.com is the technical depth leader** but is overwhelming for casual users. The opportunity is to offer the most important leak tests (WebRTC, DNS) with a clean, accessible UI — something no competitor currently does well.

- **For developer appeal**, supporting plain-text `curl` responses (like ifconfig.me) from the existing API would be a low-effort, high-value addition.

- **The current project's strongest differentiator** — privacy-first with no server-side logging, no cookies, no fingerprinting — is shared only by browserleaks.com and ipleak.net among these competitors. Most others are ad-supported and/or commercially driven.

---

## Recommended Priorities

1. WebRTC leak detection (client-side, high impact, privacy-aligned)
2. Dual-stack IPv4/IPv6 display (core IP diagnostics feature)
3. Privacy/anonymity score (unique differentiator, client-side)
4. Plain-text API responses for CLI users (low effort, high developer appeal)
5. DNS leak detection (high impact but requires server-side infrastructure)
6. Connection consistency checks (client-side, enhances privacy score)
