# What's My IP?

Privacy-first IP and browser diagnostics app built with Next.js App Router.

## Features

- Deployment-aware IP detection with explicit provenance and trusted Vercel request metadata.
- IPv4/IPv6 breakdown, category detection (public/private/CGNAT/etc).
- Detection confidence and factual request provenance.
- Browser and network signals collected locally with estimate/support-state labels.
- Permission-state, secure-context, and security-header visibility (same-origin).
- Basic/advanced signal toggle with evidence-based diagnostic findings.
- User-triggered WebRTC candidate comparison against the current HTTP address.
- Share, copy, JSON/TXT export, and local history (last 10 checks).
- `GET /api/ip` endpoint with JSON, report text, or a plain IP response.
- Static security headers and Vercel-native request metadata support.
- SEO-ready metadata with `robots.txt`, `sitemap.xml`, Open Graph/Twitter image routes.

## Stack

- Next.js 16 + React 19 + TypeScript strict mode
- Tailwind CSS 4 + custom shadcn-style UI primitives
- SWR, Zod, Framer Motion, Lucide, Sonner
- Vitest + Testing Library; Playwright + axe-core for browser and accessibility checks

## Getting Started

```bash
npm install
npm run dev
```

Requires Node.js 22.22.2 or newer (`.nvmrc` pins 24). Open `http://localhost:3000`.

## Environment

Copy `.env.example` values into `.env.local` for local development.

Required for production SEO correctness:

- `NEXT_PUBLIC_APP_URL`: your deployed origin (used for canonical/sitemap/robots metadata). Production builds fail without it; on Vercel it falls back to `VERCEL_PROJECT_PRODUCTION_URL`. Outside production it defaults to `http://localhost:3000`.

IP and optional location metadata require no provider secret on Vercel. The server uses request metadata exposed by `@vercel/functions`; local development may not provide the same metadata.

Self-hosted deployments that are strictly behind Cloudflare may set `TRUSTED_PROXY_MODE=cloudflare`. Do not enable that mode when clients can reach the application directly, because `cf-connecting-ip` would then be client-controlled.

## Scripts

```bash
npm run dev
npm run lint
npm run typecheck
npm run test
npm run test:coverage
npm run build
npm run test:smoke
npm run test:e2e
npm run format
```

## Browser tests

`npm run test:e2e` serves the production build (run `npm run build` first) and checks the page in Chromium: console errors, overflow at 1280px and 390px, and axe-core WCAG 2 A/AA violations in light and dark mode. First run `npx playwright install chromium`, or set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to an existing Chromium binary.

## Docker

```bash
docker build --build-arg NEXT_PUBLIC_APP_URL=https://your.domain -t my-ip .
docker run -p 3000:3000 my-ip
```

The image runs as the unprivileged `node` user and exposes a healthcheck on `/robots.txt`. Outside Vercel the app trusts forwarding headers by default and labels the result low-confidence; put it behind a proxy you control (see `TRUSTED_PROXY_MODE` above). The image build is not exercised in CI.

## SEO

- Canonical, Open Graph, Twitter metadata: `src/app/layout.tsx`
- Robots: `src/app/robots.ts`
- Sitemap: `src/app/sitemap.ts`
- OG image route: `src/app/opengraph-image.tsx`
- Twitter image route: `src/app/twitter-image.tsx`

## Repository Overview

This repo is also an architecture showcase for a privacy-first diagnostics app.

- Architecture notes and diagrams: `docs/project/ARCHITECTURE.md`
- API details: `docs/project/API.md`
- Privacy model: `docs/project/PRIVACY.md`
- Diagnostic metric semantics: `docs/project/DIAGNOSTICS.md`
- Contributor workflow: `docs/project/CONTRIBUTING.md`

### Deployment Checklist

1. Set `NEXT_PUBLIC_APP_URL` to the production origin.
2. Run quality gate: `npm run typecheck && npm run lint && npm run test:coverage && npm run build && npm run test:smoke && npm run test:e2e && npm run format`.
3. Verify generated SEO assets/routes:
   - `/robots.txt`
   - `/sitemap.xml`
   - `/opengraph-image`
   - `/twitter-image`
4. Configure abuse protection and request limits in Vercel WAF. The application does not rely on process-local counters, which are not durable across functions or regions.
5. Deploy and re-run Lighthouse (mobile + desktop) on the production URL.
6. Confirm canonical and OG/Twitter previews resolve to the production domain.
7. Verify the production WebRTC test and browser signals in at least one Chromium and one non-Chromium browser; unsupported values must remain labeled as such.

## API

See `docs/project/API.md`.

## Privacy

See `docs/project/PRIVACY.md`.

The application does not load analytics or tracking scripts. Recent-check history is stored only in the current browser's `localStorage`. Optional location fields come from Vercel request metadata and do not trigger a third-party geolocation lookup.

## Contributing

See `docs/project/CONTRIBUTING.md`.

## Changelog

See `docs/project/CHANGELOG.md`.

## Agent Docs

See `AGENTS.md` and `docs/agents/MASTER_INDEX.md`.

## Authorship

© 2026 Isaac D'Césares

- Website: https://dcesares.dev
- Open Source: https://github.com/idcesares/my-ip
- Vibe coded collaboration: Isaac D'Césares × Codex (GPT-5)

## License

MIT
