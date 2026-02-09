# Changelog

## 1.1.0 - 2026-02-09
- Added richer diagnostics (network, browser capability, privacy/security context) with explanatory tooltips.
- Added Basic/Advanced diagnostics mode and advanced-only probe behavior to reduce default UI clutter and payload.
- Added detection trust metadata (`confidence`, `relayLikely`) and surfaced it in UI/API/export.
- Hardened share/copy fallback behavior and geolocation fetch timeout handling.
- Improved rate-limit key normalization and bucket cleanup behavior.
- Added full route-level integration tests for `/api/ip` behavior and method/error paths.
- Added SEO and discoverability upgrades:
  - canonical/OG/Twitter metadata
  - structured data
  - `robots.txt` and `sitemap.xml`
  - generated Open Graph/Twitter images
- Added explicit project authorship and open-source attribution in UI/docs.

## 1.0.0 - 2026-02-08
- Initial production-ready release.
- Proxy-aware server-side IP detection and API endpoint.
- Browser/network diagnostics UI with export/share/copy.
- Security headers middleware and rate limiting.
- Unit/integration test baseline and project docs.
