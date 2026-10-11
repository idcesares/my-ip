# Changelog

## Unreleased

- The IPv6 row now says "Not observable: this site is served over IPv4 only" when served from Vercel, which has no IPv6 for custom domains, instead of implying another request might show one; other hosts keep "Not observed on this request".
- When Cloudflare headers appear on a Vercel request, `/api/ip` lowers `confidence` to `low` and warns that the address may be a proxy's, since Vercel reports the connecting proxy.
- Added `scripts/deployment-smoke.mjs` (`npm run test:deployment`) and a post-deployment workflow that verifies trusted Vercel provenance, geolocation, and edge headers on the live production URL.
- Added `docs/project/OPERATIONS.md`: hosting facts, WAF rate-limit runbook and current status, proxy caveat, and deployment verification.
- Icon, Apple icon, Open Graph, and Twitter image routes no longer opt into the edge runtime, so they are prerendered as static files at build time.
- Requesting location now sticks: periodic and manual refreshes keep asking for `include=geo` after the user opted in, instead of silently dropping the location after the next 60-second poll.
- The address card now says "Not observed on this request" for the other address family instead of "Unavailable", since one request only proves the family it used.
- The product name is now the page `<h1>`; the tagline is a paragraph.
- Darkened the light-theme warning color so "need attention" text meets WCAG AA contrast (found by the new axe check).
- Added Playwright browser checks (console errors, overflow at desktop/mobile, axe WCAG 2 A/AA in light and dark) as `npm run test:e2e`, run in CI.
- CI now also runs on pushes to `master` (it was listening for `main`).
- Local history tolerates unavailable or full `localStorage` (reads, writes, and clears no longer throw); history validation lives in `src/lib/schemas.ts` and is covered by tests, including the 10-entry cap.
- Added `src/lib/site-url.ts`: canonical, sitemap, robots, and JSON-LD URLs come from `NEXT_PUBLIC_APP_URL` or Vercel's production hostname, and production builds fail instead of publishing `example.com`.
- Dockerfile now uses Node 24, runs as the `node` user, builds with `NEXT_PUBLIC_APP_URL`, and has a healthcheck; added `.dockerignore`, `.env.example`, `.nvmrc`, and an `engines` field.
- Removed unused `geoSchema` and `isValidIP`.
- Major dependency updates: React 19.3, TypeScript 6.0, Vitest 5, `@vitejs/plugin-react` 6 (Vite 8), jsdom 30, jest-dom 7 (now imported from `@testing-library/jest-dom/vitest`), `lucide-react` 1.x, framer-motion 14, and `@types/node` 22. CI now runs Node 24; `vitest.config.ts` became `vitest.config.mts`. Held back: ESLint 10 (`eslint-config-next` plugins do not yet declare support) and TypeScript 7 (`typescript-eslint` does not support it yet).
- Updated dependencies within semver ranges (Next.js 16.4, Tailwind 4.3, Vitest 4.1.11, Radix, SWR, ipaddr.js, and others), resolving the critical Next.js advisory and the high-severity `postcss`, `undici`, `sharp`, and `nanoid` findings; raised the `postcss` override to 8.5.29. Only the dev-only `braces` chain under `eslint-config-next` remains (see `AGENTS.md`).
- Removed Vercel Analytics so runtime behavior matches the no-analytics privacy contract.
- Moved static security headers into Next.js configuration and removed request middleware overhead and the deprecated `X-XSS-Protection` header.
- Documented Vercel-native IP/location metadata and Vercel WAF as the production request-limiting layer.
- Clarified JSON, report-text, and plain-IP API formats plus local-only browser history.
- Corrected shadcn/ui aliases/style and Tailwind CSS v4 font tokens.
- Added CI enforcement for typecheck, lint, tests, and production builds.
- Corrected diagnostic semantics: browser connection values are labeled as estimates, the same-origin probe is reported as total page-fetch duration, unsupported values are explicit, and ambiguous Do Not Track reporting was removed.
- Reworked the WebRTC test to compare ICE candidates with the current HTTP address, separate expected exposure from additional public or literal private addresses, identify mDNS masking, retain partial timeout results, and disclose STUN-server contact.
- Added deterministic browser-metric and WebRTC assessment modules with unit and component coverage.
- Added enforced coverage thresholds and a production-server smoke suite covering the page, API formats, cache controls, method handling, security headers, and absence of analytics code.
- Refreshed page methodology copy, `AGENTS.md`, and the complete agent/documentation package to match the current Next.js and Vercel architecture.

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
