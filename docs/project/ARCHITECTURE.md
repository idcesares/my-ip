# Architecture Overview

This project is a privacy-first Next.js App Router application for user-visible IP, browser, and security diagnostics.

## Runtime shape

```mermaid
flowchart TD
  U[User browser] --> V[Vercel edge and WAF]
  V --> P[Next.js application]
  P --> A[/api/ip route]
  A --> M[Vercel request metadata]
  P --> B[Client diagnostics]
  B --> L[Local capability and permission state]
  B --> S[Same-origin header probe]
  B --> W[User-triggered WebRTC candidate test]
  B --> H[localStorage history]
```

## Responsibilities

- Server:
  - Resolve the connection address from trusted request metadata.
  - Read optional Vercel geolocation metadata through `@vercel/functions`.
  - Validate query parameters and shape JSON, report-text, and plain responses.
  - Apply static security headers through `next.config.ts`.
- Browser:
  - Collect browser/network estimates and effective permission states without permission prompts.
  - Measure a same-origin page fetch and label it as total request duration, not RTT.
  - Compare user-triggered WebRTC candidates with the address used for the HTTP request.
  - Keep the last 10 checks in local storage.
  - Perform copy, share, export, and user-triggered advanced diagnostics.
- Platform:
  - Terminate TLS and provide request metadata.
  - Enforce production request limits and abuse rules through Vercel WAF.

There is intentionally no process-local production rate limiter: function instances and regions do not share memory, so an in-process counter would provide misleading protection.

Vercel-specific hosting facts (IPv4-only host, WAF runbook, proxy caveat, deployed-URL checks) are in `OPERATIONS.md`.

Outside Vercel, generic forwarding headers are reported as untrusted provenance. A self-hosted deployment may opt into `TRUSTED_PROXY_MODE=cloudflare` only when Cloudflare is the exclusive ingress.

## Privacy properties

- No analytics or application tracking SDK.
- No application database or server-side check history.
- No third-party geolocation request.
- Advanced and WebRTC probes are user-controlled; the WebRTC probe discloses its public STUN-server contact.
- Vercel operational processing and logs remain governed by deployment settings.

## Delivery and quality gates

Pull requests run formatting, lint, strict TypeScript checks, coverage-enforced Vitest suites, the production build, and a production-server smoke test in `.github/workflows/ci.yml`. Vercel preview/production deployments should additionally verify WAF policy, canonical metadata, security headers, responsive rendering, and Lighthouse results.

Critical measurement and assessment logic is isolated in `src/lib/browser-metrics.ts`, `src/lib/webrtc-diagnostics.ts`, `src/lib/privacy-score.ts`, `src/lib/history.ts`, and `src/lib/share.ts`. Hooks perform browser I/O; pure library functions own normalization and interpretation so they can be tested deterministically. `src/lib/webrtc-gatherer.ts` wraps `RTCPeerConnection` behind a `PeerConnectionFactory` port so the Active test's cancel/timeout/dedup state machine in `use-webrtc-leak.ts` can be driven by a scripted adapter in tests instead of a real browser.

## Discoverability

- Metadata and structured data: `src/app/layout.tsx`
- Crawl/preview routes: `src/app/robots.ts`, `src/app/sitemap.ts`, `src/app/opengraph-image.tsx`, and `src/app/twitter-image.tsx`
